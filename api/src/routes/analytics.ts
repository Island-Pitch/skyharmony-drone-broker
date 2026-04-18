/** SHD-11: Predictive maintenance — baseline computation and anomaly detection. */
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { assetBaselines, anomalies, telemetrySyncs, assets } from '../db/schema.js';
import { eq, sql, count, and } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

/* ---------- Math helpers ---------- */

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function sigmaDistance(value: number, avg: number, sd: number): number {
  if (sd === 0) return 0;
  return Math.abs(value - avg) / sd;
}

async function findPendingSigmaDuplicate(params: {
  asset_id: string;
  field: string;
  expected_value: string;
  actual_value: string;
}) {
  const [row] = await db
    .select({ id: anomalies.id })
    .from(anomalies)
    .where(
      and(
        eq(anomalies.asset_id, params.asset_id),
        eq(anomalies.anomaly_type, 'sigma_deviation'),
        eq(anomalies.field, params.field),
        eq(anomalies.status, 'pending'),
        eq(anomalies.expected_value, params.expected_value),
        eq(anomalies.actual_value, params.actual_value),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function findPendingOperatorDuplicate(params: {
  asset_id: string;
  expected_value: string;
  actual_value: string;
}) {
  const [row] = await db
    .select({ id: anomalies.id })
    .from(anomalies)
    .where(
      and(
        eq(anomalies.asset_id, params.asset_id),
        eq(anomalies.anomaly_type, 'operator_anomaly'),
        eq(anomalies.field, 'fleet_utilization'),
        eq(anomalies.status, 'pending'),
        eq(anomalies.expected_value, params.expected_value),
        eq(anomalies.actual_value, params.actual_value),
      ),
    )
    .limit(1);
  return row ?? null;
}

/* ---------- POST /api/analytics/compute-baselines ---------- */

router.post(
  '/analytics/compute-baselines',
  auth,
  requireRole('CentralRepoAdmin'),
  async (_req, res) => {
    try {
      const allAssets = await db.select().from(assets).where(sql`${assets.status} != 'retired'`);
      let baselinesComputed = 0;

      for (const asset of allAssets) {
        const syncs = await db
          .select()
          .from(telemetrySyncs)
          .where(eq(telemetrySyncs.asset_id, asset.id))
          .orderBy(sql`${telemetrySyncs.synced_at} DESC`);

        if (syncs.length < 3) continue;

        const flightHoursDeltas = syncs
          .map((s) => Number(s.flight_hours_delta ?? 0))
          .filter((v) => v > 0);
        const batteryDrainDeltas = syncs
          .map((s) => Number(s.battery_cycles_delta ?? 0))
          .filter((v) => v > 0);

        if (flightHoursDeltas.length < 3 && batteryDrainDeltas.length < 3) continue;

        const avgFlight = mean(flightHoursDeltas);
        const sdFlight = stddev(flightHoursDeltas, avgFlight);
        const avgBattery = mean(batteryDrainDeltas);
        const sdBattery = stddev(batteryDrainDeltas, avgBattery);
        const sampleCount = Math.max(flightHoursDeltas.length, batteryDrainDeltas.length);

        const existing = await db
          .select()
          .from(assetBaselines)
          .where(eq(assetBaselines.asset_id, asset.id))
          .limit(1);

        const values = {
          avg_flight_hours_per_show: String(Math.round(avgFlight * 100) / 100),
          stddev_flight_hours: String(Math.round(sdFlight * 10000) / 10000),
          avg_battery_drain_per_show: String(Math.round(avgBattery * 100) / 100),
          stddev_battery_drain: String(Math.round(sdBattery * 10000) / 10000),
          sample_count: sampleCount,
          last_computed: new Date(),
        };

        if (existing.length > 0) {
          await db.update(assetBaselines).set(values).where(eq(assetBaselines.asset_id, asset.id));
        } else {
          await db.insert(assetBaselines).values({ asset_id: asset.id, ...values });
        }

        baselinesComputed++;
      }

      const [totalRow] = await db
        .select({ count: count() })
        .from(assets)
        .where(sql`${assets.status} != 'retired'`);
      const [baselineRow] = await db.select({ count: count() }).from(assetBaselines);

      const totalActive = Number(totalRow?.count ?? 0);
      const totalBaselines = Number(baselineRow?.count ?? 0);
      const coveragePct =
        totalActive > 0 ? Math.round((totalBaselines / totalActive) * 1000) / 10 : 0;

      res.json({
        data: {
          baselines_computed: baselinesComputed,
          total_baselines: totalBaselines,
          fleet_coverage_pct: coveragePct,
        },
      });
    } catch (err) {
      console.error('Compute baselines error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

/* ---------- POST /api/analytics/detect-anomalies ---------- */

router.post(
  '/analytics/detect-anomalies',
  auth,
  requireRole('CentralRepoAdmin'),
  async (_req, res) => {
    try {
      const baselines = await db.select().from(assetBaselines);
      const anomaliesCreated: (typeof anomalies.$inferSelect)[] = [];

      for (const baseline of baselines) {
        const [latestSync] = await db
          .select()
          .from(telemetrySyncs)
          .where(eq(telemetrySyncs.asset_id, baseline.asset_id))
          .orderBy(sql`${telemetrySyncs.synced_at} DESC`)
          .limit(1);

        if (!latestSync) continue;

        const avgFlight = Number(baseline.avg_flight_hours_per_show ?? 0);
        const sdFlight = Number(baseline.stddev_flight_hours ?? 0);
        const avgBattery = Number(baseline.avg_battery_drain_per_show ?? 0);
        const sdBattery = Number(baseline.stddev_battery_drain ?? 0);

        // Check flight_hours_delta
        const flightDelta = Number(latestSync.flight_hours_delta ?? 0);
        if (flightDelta > 0 && sdFlight > 0) {
          const sigma = sigmaDistance(flightDelta, avgFlight, sdFlight);
          if (sigma >= 2) {
            const expected_value = String(Math.round(avgFlight * 10000) / 10000);
            const actual_value = String(Math.round(flightDelta * 10000) / 10000);
            const dup = await findPendingSigmaDuplicate({
              asset_id: baseline.asset_id,
              field: 'flight_hours_delta',
              expected_value,
              actual_value,
            });
            if (!dup) {
              const [anomaly] = await db
                .insert(anomalies)
                .values({
                  asset_id: baseline.asset_id,
                  anomaly_type: 'sigma_deviation',
                  field: 'flight_hours_delta',
                  expected_value,
                  actual_value,
                  sigma_distance: String(Math.round(sigma * 100) / 100),
                })
                .returning();
              anomaliesCreated.push(anomaly!);
            }
          }
        }

        // Check battery_cycles_delta
        const batteryDelta = Number(latestSync.battery_cycles_delta ?? 0);
        if (batteryDelta > 0 && sdBattery > 0) {
          const sigma = sigmaDistance(batteryDelta, avgBattery, sdBattery);
          if (sigma >= 2) {
            const expected_value = String(Math.round(avgBattery * 10000) / 10000);
            const actual_value = String(Math.round(batteryDelta * 10000) / 10000);
            const dup = await findPendingSigmaDuplicate({
              asset_id: baseline.asset_id,
              field: 'battery_cycles_delta',
              expected_value,
              actual_value,
            });
            if (!dup) {
              const [anomaly] = await db
                .insert(anomalies)
                .values({
                  asset_id: baseline.asset_id,
                  anomaly_type: 'sigma_deviation',
                  field: 'battery_cycles_delta',
                  expected_value,
                  actual_value,
                  sigma_distance: String(Math.round(sigma * 100) / 100),
                })
                .returning();
              anomaliesCreated.push(anomaly!);
            }
          }
        }
      }

      // Detect operator-level usage spikes (>200% change)
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const operatorAssets = await db
        .select({ operator_id: assets.current_operator_id, asset_id: assets.id })
        .from(assets)
        .where(sql`${assets.current_operator_id} IS NOT NULL AND ${assets.status} != 'retired'`);

      const operatorFleets = new Map<string, string[]>();
      for (const row of operatorAssets) {
        if (!row.operator_id) continue;
        const list = operatorFleets.get(row.operator_id) ?? [];
        list.push(row.asset_id);
        operatorFleets.set(row.operator_id, list);
      }

      for (const [, assetIds] of operatorFleets.entries()) {
        const [currentRow] = await db
          .select({ count: count() })
          .from(telemetrySyncs)
          .where(sql`${telemetrySyncs.asset_id} = ANY(${assetIds}) AND ${telemetrySyncs.synced_at} >= ${oneDayAgo}`);

        const [previousRow] = await db
          .select({ count: count() })
          .from(telemetrySyncs)
          .where(sql`${telemetrySyncs.asset_id} = ANY(${assetIds}) AND ${telemetrySyncs.synced_at} >= ${twoDaysAgo} AND ${telemetrySyncs.synced_at} < ${oneDayAgo}`);

        const currentCount = Number(currentRow?.count ?? 0);
        const previousCount = Number(previousRow?.count ?? 0);

        if (previousCount > 0 && currentCount > previousCount * 2) {
          const ratio = currentCount / previousCount;
          const expected_value = String(previousCount);
          const actual_value = String(currentCount);
          const dup = await findPendingOperatorDuplicate({
            asset_id: assetIds[0]!,
            expected_value,
            actual_value,
          });
          if (!dup) {
            const [anomaly] = await db
              .insert(anomalies)
              .values({
                asset_id: assetIds[0]!,
                anomaly_type: 'operator_anomaly',
                field: 'fleet_utilization',
                expected_value,
                actual_value,
                sigma_distance: String(Math.round(ratio * 100) / 100),
              })
              .returning();
            anomaliesCreated.push(anomaly!);
          }
        }
      }

      res.json({
        data: { anomalies_created: anomaliesCreated.length, anomalies: anomaliesCreated },
      });
    } catch (err) {
      console.error('Detect anomalies error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

/* ---------- GET /api/analytics/anomalies ---------- */

router.get('/analytics/anomalies', auth, async (req, res) => {
  try {
    const { status, anomaly_type, page = '1', per_page = '50' } = req.query as Record<string, string | undefined>;

    const conditions = [];
    if (status) conditions.push(eq(anomalies.status, status));
    if (anomaly_type) conditions.push(eq(anomalies.anomaly_type, anomaly_type));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = Math.min(Number(per_page) || 50, 200);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

    const statusCountsBase = db
      .select({
        pending: sql<number>`cast(count(*) filter (where ${anomalies.status} = 'pending') as int)`,
        accepted: sql<number>`cast(count(*) filter (where ${anomalies.status} = 'accepted') as int)`,
        dismissed: sql<number>`cast(count(*) filter (where ${anomalies.status} = 'dismissed') as int)`,
      })
      .from(anomalies);

    const [rows, [totalRow], [statusCountsRow]] = await Promise.all([
      db.select().from(anomalies).where(where).limit(limit).offset(offset).orderBy(sql`${anomalies.created_at} DESC`),
      db.select({ count: count() }).from(anomalies).where(where),
      where ? statusCountsBase.where(where) : statusCountsBase,
    ]);

    // Enrich with asset serial numbers
    const assetIds = [...new Set(rows.map((r) => r.asset_id).filter(Boolean))] as string[];
    const assetMap = new Map<string, string>();
    if (assetIds.length > 0) {
      const assetRows = await db
        .select({ id: assets.id, serial_number: assets.serial_number })
        .from(assets)
        .where(sql`${assets.id} = ANY(${assetIds})`);
      for (const a of assetRows) assetMap.set(a.id, a.serial_number);
    }

    const enrichedRows = rows.map((r) => ({
      ...r,
      asset_serial: r.asset_id ? assetMap.get(r.asset_id) ?? null : null,
    }));

    const total = Number(totalRow?.count ?? 0);
    const currentPage = Math.max(Number(page) || 1, 1);

    res.json({
      data: enrichedRows,
      meta: {
        page: currentPage,
        per_page: limit,
        total,
        total_pages: Math.ceil(total / limit),
        status_counts: {
          pending: Number(statusCountsRow?.pending ?? 0),
          accepted: Number(statusCountsRow?.accepted ?? 0),
          dismissed: Number(statusCountsRow?.dismissed ?? 0),
        },
      },
    });
  } catch (err) {
    console.error('Anomalies list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ---------- POST /api/analytics/anomalies/:id/review ---------- */

const ReviewSchema = z.object({
  status: z.enum(['accepted', 'dismissed']),
});

router.post(
  '/analytics/anomalies/:id/review',
  auth,
  requireRole('CentralRepoAdmin'),
  validate(ReviewSchema),
  async (req, res) => {
    try {
      const { status } = req.body as z.infer<typeof ReviewSchema>;
      const id = req.params.id as string;

      const [anomaly] = await db
        .update(anomalies)
        .set({ status, reviewed_by: req.user!.userId, reviewed_at: new Date() })
        .where(eq(anomalies.id, id))
        .returning();

      if (!anomaly) {
        res.status(404).json({ error: 'Anomaly not found' });
        return;
      }
      res.json({ data: anomaly });
    } catch (err) {
      console.error('Anomaly review error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

/* ---------- GET /api/analytics/baselines ---------- */

router.get('/analytics/baselines', auth, async (_req, res) => {
  try {
    const rows = await db.select().from(assetBaselines);
    const [totalActiveRow] = await db
      .select({ count: count() })
      .from(assets)
      .where(sql`${assets.status} != 'retired'`);

    const totalActive = Number(totalActiveRow?.count ?? 0);
    const coveragePct = totalActive > 0 ? Math.round((rows.length / totalActive) * 1000) / 10 : 0;

    res.json({
      data: {
        baselines: rows,
        total_baselines: rows.length,
        total_active_assets: totalActive,
        fleet_coverage_pct: coveragePct,
      },
    });
  } catch (err) {
    console.error('Baselines list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
