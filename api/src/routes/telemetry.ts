/** SHD-22: Verge Aero Mothership API — mock telemetry sync integration. */
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { telemetrySyncs, assets, auditEvents } from '../db/schema.js';
import { eq, sql, count, gte } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import posthog from '../lib/posthog.js';

const router = Router();

/* ---------- Schemas ---------- */

const TelemetrySyncItemSchema = z.object({
  serial_number: z.string().min(1),
  flight_hours_delta: z.number().nonnegative().optional(),
  battery_cycles_delta: z.number().int().nonnegative().optional(),
  firmware_version: z.string().optional(),
  fault_codes: z.array(z.string()).optional(),
  raw_payload: z.record(z.string(), z.any()).optional(),
});

const TelemetrySyncSchema = z.object({
  source: z.enum(['verge_aero', 'manual', 'api']).default('api'),
  items: z.array(TelemetrySyncItemSchema).min(1),
});

/* ---------- POST /api/telemetry/sync ---------- */

router.post('/telemetry/sync', auth, requireRole('CentralRepoAdmin', 'SystemAI'), validate(TelemetrySyncSchema), async (req, res) => {
  try {
    const { source, items } = req.body as z.infer<typeof TelemetrySyncSchema>;
    const results: { serial_number: string; synced: boolean; error?: string }[] = [];

    for (const item of items) {
      // Look up asset by serial number
      const [asset] = await db
        .select()
        .from(assets)
        .where(eq(assets.serial_number, item.serial_number))
        .limit(1);

      if (!asset) {
        results.push({ serial_number: item.serial_number, synced: false, error: 'Asset not found' });
        continue;
      }

      // Compute new values
      const oldFlightHours = Number(asset.flight_hours ?? 0);
      const oldBatteryCycles = asset.battery_cycles ?? 0;
      const oldFirmware = asset.firmware_version ?? 'unknown';

      const newFlightHours = oldFlightHours + (item.flight_hours_delta ?? 0);
      const newBatteryCycles = oldBatteryCycles + (item.battery_cycles_delta ?? 0);
      const newFirmware = item.firmware_version ?? oldFirmware;

      // Update asset
      await db.update(assets).set({
        flight_hours: String(newFlightHours),
        battery_cycles: newBatteryCycles,
        firmware_version: newFirmware,
        updated_at: new Date(),
      }).where(eq(assets.id, asset.id));

      // Create telemetry sync record
      await db.insert(telemetrySyncs).values({
        asset_id: asset.id,
        source,
        flight_hours_delta: item.flight_hours_delta != null ? String(item.flight_hours_delta) : null,
        battery_cycles_delta: item.battery_cycles_delta ?? null,
        firmware_version: newFirmware,
        fault_codes: item.fault_codes ?? [],
        raw_payload: item.raw_payload ?? {},
      });

      // Create audit events for changed fields
      const auditEntries: { asset_id: string; field_changed: string; old_value: string; new_value: string; changed_by: string | null }[] = [];

      if (item.flight_hours_delta && item.flight_hours_delta > 0) {
        auditEntries.push({
          asset_id: asset.id,
          field_changed: 'flight_hours',
          old_value: String(oldFlightHours),
          new_value: String(newFlightHours),
          changed_by: req.user!.userId,
        });
      }
      if (item.battery_cycles_delta && item.battery_cycles_delta > 0) {
        auditEntries.push({
          asset_id: asset.id,
          field_changed: 'battery_cycles',
          old_value: String(oldBatteryCycles),
          new_value: String(newBatteryCycles),
          changed_by: req.user!.userId,
        });
      }
      if (item.firmware_version && item.firmware_version !== oldFirmware) {
        auditEntries.push({
          asset_id: asset.id,
          field_changed: 'firmware_version',
          old_value: oldFirmware,
          new_value: newFirmware,
          changed_by: req.user!.userId,
        });
      }

      for (const entry of auditEntries) {
        await db.insert(auditEvents).values(entry);
      }

      results.push({ serial_number: item.serial_number, synced: true });
    }

    const syncedCount = results.filter((r) => r.synced).length;
    const failedCount = results.filter((r) => !r.synced).length;

    posthog.capture({
      distinctId: req.user!.userId,
      event: 'telemetry_synced',
      properties: { source, items_total: items.length, synced: syncedCount, failed: failedCount },
    });

    res.json({ data: { synced: syncedCount, failed: failedCount, results } });
  } catch (err) {
    posthog.captureException(err, req.user?.userId);
    console.error('Telemetry sync error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ---------- POST /api/telemetry/simulate ---------- */

const FAULT_CODES = [
  'MOTOR_OVERHEAT_01',
  'GPS_DRIFT_02',
  'BATTERY_CELL_IMBALANCE_03',
  'ESC_FAILURE_04',
  'IMU_CALIBRATION_05',
  'COMPASS_INTERFERENCE_06',
  'PROPELLER_VIBRATION_07',
  'COMMS_LINK_DEGRADED_08',
];

router.post('/telemetry/simulate', auth, requireRole('CentralRepoAdmin'), async (req, res) => {
  try {
    const allAssets = await db.select().from(assets).where(
      sql`${assets.status} != 'retired'`
    );

    if (allAssets.length === 0) {
      res.json({ data: { synced: 0, message: 'No active assets to simulate' } });
      return;
    }

    const results: { serial_number: string; flight_hours_delta: number; battery_cycles_delta: number; fault_codes: string[] }[] = [];

    for (const asset of allAssets) {
      const flightHoursDelta = Math.round((1 + Math.random() * 9) * 10) / 10; // 1.0-10.0
      const batteryCyclesDelta = 1 + Math.floor(Math.random() * 5); // 1-5
      const hasFault = Math.random() < 0.02; // 2% chance
      const faultCodes = hasFault
        ? [FAULT_CODES[Math.floor(Math.random() * FAULT_CODES.length)]!]
        : [];

      const oldFlightHours = Number(asset.flight_hours ?? 0);
      const oldBatteryCycles = asset.battery_cycles ?? 0;
      const newFlightHours = oldFlightHours + flightHoursDelta;
      const newBatteryCycles = oldBatteryCycles + batteryCyclesDelta;

      // Update asset
      await db.update(assets).set({
        flight_hours: String(newFlightHours),
        battery_cycles: newBatteryCycles,
        updated_at: new Date(),
      }).where(eq(assets.id, asset.id));

      // Create telemetry sync record
      await db.insert(telemetrySyncs).values({
        asset_id: asset.id,
        source: 'verge_aero',
        flight_hours_delta: String(flightHoursDelta),
        battery_cycles_delta: batteryCyclesDelta,
        firmware_version: asset.firmware_version,
        fault_codes: faultCodes,
        raw_payload: { simulated: true, timestamp: new Date().toISOString() },
      });

      // Audit events
      await db.insert(auditEvents).values({
        asset_id: asset.id,
        field_changed: 'flight_hours',
        old_value: String(oldFlightHours),
        new_value: String(newFlightHours),
        changed_by: req.user!.userId,
      });
      await db.insert(auditEvents).values({
        asset_id: asset.id,
        field_changed: 'battery_cycles',
        old_value: String(oldBatteryCycles),
        new_value: String(newBatteryCycles),
        changed_by: req.user!.userId,
      });

      results.push({
        serial_number: asset.serial_number,
        flight_hours_delta: flightHoursDelta,
        battery_cycles_delta: batteryCyclesDelta,
        fault_codes: faultCodes,
      });
    }

    const faulted = results.filter((r) => r.fault_codes.length > 0);

    posthog.capture({
      distinctId: req.user!.userId,
      event: 'telemetry_simulated',
      properties: { assets_simulated: results.length, faulted_count: faulted.length },
    });

    res.json({
      data: {
        synced: results.length,
        faulted: faulted.length,
        results,
      },
    });
  } catch (err) {
    posthog.captureException(err, req.user?.userId);
    console.error('Telemetry simulate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ---------- GET /api/telemetry/history/:assetId ---------- */

router.get('/telemetry/history/:assetId', auth, async (req, res) => {
  try {
    const assetId = req.params.assetId as string;
    const { page = '1', per_page = '50' } = req.query as Record<string, string | undefined>;

    const limit = Math.min(Number(per_page) || 50, 200);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

    const [rows, [totalRow]] = await Promise.all([
      db.select().from(telemetrySyncs)
        .where(eq(telemetrySyncs.asset_id, assetId))
        .limit(limit).offset(offset)
        .orderBy(sql`${telemetrySyncs.synced_at} DESC`),
      db.select({ count: count() }).from(telemetrySyncs)
        .where(eq(telemetrySyncs.asset_id, assetId)),
    ]);

    const total = Number(totalRow?.count ?? 0);
    const currentPage = Math.max(Number(page) || 1, 1);

    res.json({
      data: rows,
      meta: { page: currentPage, per_page: limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Telemetry history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ---------- GET /api/telemetry/coverage ---------- */

router.get('/telemetry/coverage', auth, async (_req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Count active (non-retired) assets
    const [activeRow] = await db
      .select({ count: count() })
      .from(assets)
      .where(sql`${assets.status} != 'retired'`);

    const totalActive = Number(activeRow?.count ?? 0);

    if (totalActive === 0) {
      res.json({ data: { total_active: 0, synced_last_24h: 0, coverage_pct: 0 } });
      return;
    }

    // Count distinct assets synced in last 24h
    const [syncedRow] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${telemetrySyncs.asset_id})` })
      .from(telemetrySyncs)
      .where(gte(telemetrySyncs.synced_at, oneDayAgo));

    const syncedLast24h = Number(syncedRow?.count ?? 0);
    const coveragePct = Math.round((syncedLast24h / totalActive) * 1000) / 10;

    // Recent syncs with fault codes
    const faultSyncs = await db
      .select()
      .from(telemetrySyncs)
      .where(sql`${telemetrySyncs.fault_codes}::text != '[]' AND ${telemetrySyncs.synced_at} >= ${oneDayAgo}`)
      .orderBy(sql`${telemetrySyncs.synced_at} DESC`)
      .limit(50);

    res.json({
      data: {
        total_active: totalActive,
        synced_last_24h: syncedLast24h,
        coverage_pct: coveragePct,
        fault_alerts: faultSyncs,
      },
    });
  } catch (err) {
    console.error('Telemetry coverage error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
