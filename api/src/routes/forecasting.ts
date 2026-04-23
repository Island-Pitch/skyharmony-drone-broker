import { Router } from 'express';
import { db } from '../db/connection.js';
import { bookings, assets } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { auth } from '../middleware/auth.js';
import posthog from '../lib/posthog.js';

const router = Router();

/* ---------- helpers ---------- */

/** Seasonal multipliers by month (1-indexed). Summer 1.3x, winter 0.7x, holiday (Nov/Dec) 1.5x. */
const SEASONAL_MULTIPLIERS: Record<number, number> = {
  1: 0.7,   // Jan — winter
  2: 0.7,   // Feb — winter
  3: 1.0,   // Mar
  4: 1.0,   // Apr
  5: 1.1,   // May
  6: 1.3,   // Jun — summer
  7: 1.3,   // Jul — summer
  8: 1.3,   // Aug — summer
  9: 1.1,   // Sep
  10: 1.0,  // Oct
  11: 1.5,  // Nov — holiday
  12: 1.5,  // Dec — holiday
};

/** Map a location string to a canonical region. */
function regionFromLocation(location: string): string {
  const loc = location.toLowerCase();
  if (loc.includes(', ca')) return 'California';
  if (loc.includes(', nv')) return 'Nevada';
  if (loc.includes(', az')) return 'Arizona';
  // Fallback: return the state portion or the whole string
  const parts = location.split(',');
  return (parts[parts.length - 1] ?? location).trim();
}

/** Region centroid coordinates for heatmap display. */
const REGION_COORDS: Record<string, { lat: number; lng: number }> = {
  California: { lat: 36.78, lng: -119.42 },
  Nevada: { lat: 38.80, lng: -116.42 },
  Arizona: { lat: 34.05, lng: -111.09 },
};

interface MonthRegionBucket {
  month: string; // YYYY-MM
  region: string;
  totalDrones: number;
  bookingCount: number;
}

function buildBuckets(rows: { show_date: Date; drone_count: number; location: string }[]): MonthRegionBucket[] {
  const map = new Map<string, MonthRegionBucket>();
  for (const row of rows) {
    const d = new Date(row.show_date);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const region = regionFromLocation(row.location);
    const key = `${month}|${region}`;
    const bucket = map.get(key) ?? { month, region, totalDrones: 0, bookingCount: 0 };
    bucket.totalDrones += row.drone_count;
    bucket.bookingCount += 1;
    map.set(key, bucket);
  }
  return Array.from(map.values());
}

/** Simple moving average of drone demand per region, then apply seasonal multiplier. */
function forecastNext90Days(buckets: MonthRegionBucket[]) {
  // Group by region
  const regionBuckets = new Map<string, MonthRegionBucket[]>();
  for (const b of buckets) {
    const list = regionBuckets.get(b.region) ?? [];
    list.push(b);
    regionBuckets.set(b.region, list);
  }

  const now = new Date();
  const forecasts: {
    month: string;
    region: string;
    predicted_drone_demand: number;
    confidence: number;
  }[] = [];

  // Generate 3 months of forecasts
  for (let offset = 0; offset < 3; offset++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
    const futureMonth = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;
    const monthNum = futureDate.getMonth() + 1;
    const seasonalMultiplier = SEASONAL_MULTIPLIERS[monthNum] ?? 1.0;

    for (const [region, rBuckets] of regionBuckets.entries()) {
      // Moving average: average total drones per month in this region
      const avgDrones =
        rBuckets.length > 0
          ? rBuckets.reduce((sum, b) => sum + b.totalDrones, 0) / rBuckets.length
          : 0;

      const predicted = Math.round(avgDrones * seasonalMultiplier);

      // Confidence: higher with more data points, capped at 95%
      const dataPoints = rBuckets.length;
      const confidence = Math.min(95, 40 + dataPoints * 10);

      forecasts.push({
        month: futureMonth,
        region,
        predicted_drone_demand: predicted,
        confidence,
      });
    }
  }

  return forecasts;
}

/* ---------- routes ---------- */

// GET /api/forecasting/demand
router.get('/forecasting/demand', auth, async (_req, res) => {
  try {
    const rows = await db
      .select({
        show_date: bookings.show_date,
        drone_count: bookings.drone_count,
        location: bookings.location,
      })
      .from(bookings);

    // Exclude cancelled bookings
    const active = rows.filter(
      (r) => r.show_date !== null && r.drone_count !== null && r.location !== null,
    );

    const buckets = buildBuckets(
      active as { show_date: Date; drone_count: number; location: string }[],
    );
    const forecasts = forecastNext90Days(buckets);

    res.json({ data: { forecasts } });
  } catch (err) {
    posthog.captureException(err, _req.user?.userId);
    console.error('Forecasting demand error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/forecasting/heatmap
router.get('/forecasting/heatmap', auth, async (_req, res) => {
  try {
    // Demand: sum of drone_count per region for non-cancelled, future or recent bookings
    const bookingRows = await db
      .select({
        drone_count: bookings.drone_count,
        location: bookings.location,
        status: bookings.status,
      })
      .from(bookings);

    const demandByRegion = new Map<string, number>();
    for (const row of bookingRows) {
      if (row.status === 'cancelled') continue;
      const region = regionFromLocation(row.location);
      demandByRegion.set(region, (demandByRegion.get(region) ?? 0) + row.drone_count);
    }

    // Supply: count available drones per operator region
    const droneTypeId = '00000000-0000-4000-8000-000000000001';
    const droneRows = await db
      .select({ status: assets.status, current_operator_id: assets.current_operator_id })
      .from(assets)
      .where(eq(assets.asset_type_id, droneTypeId));

    // Total available supply across all regions
    const totalSupply = droneRows.filter((d) => d.status === 'available').length;

    // Distribute supply proportionally across known regions
    const allRegions = new Set([
      ...demandByRegion.keys(),
      ...Object.keys(REGION_COORDS),
    ]);

    const regions: {
      name: string;
      lat: number;
      lng: number;
      demand_score: number;
      supply_count: number;
      balance: number;
    }[] = [];

    const regionCount = allRegions.size || 1;
    const supplyPerRegion = Math.floor(totalSupply / regionCount);

    for (const region of allRegions) {
      const coords = REGION_COORDS[region] ?? { lat: 36.0, lng: -115.0 };
      const demand = demandByRegion.get(region) ?? 0;
      const supply = supplyPerRegion;
      regions.push({
        name: region,
        lat: coords.lat,
        lng: coords.lng,
        demand_score: demand,
        supply_count: supply,
        balance: supply - demand,
      });
    }

    res.json({ data: { regions } });
  } catch (err) {
    console.error('Forecasting heatmap error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/forecasting/alerts
router.get('/forecasting/alerts', auth, async (_req, res) => {
  try {
    const bookingRows = await db
      .select({
        drone_count: bookings.drone_count,
        location: bookings.location,
        status: bookings.status,
        show_date: bookings.show_date,
      })
      .from(bookings);

    // Sum demand by region (active bookings only)
    const demandByRegion = new Map<string, number>();
    for (const row of bookingRows) {
      if (row.status === 'cancelled' || row.status === 'completed') continue;
      const region = regionFromLocation(row.location);
      demandByRegion.set(region, (demandByRegion.get(region) ?? 0) + row.drone_count);
    }

    // Supply count
    const droneTypeId = '00000000-0000-4000-8000-000000000001';
    const droneRows = await db
      .select({ status: assets.status })
      .from(assets)
      .where(eq(assets.asset_type_id, droneTypeId));

    const totalSupply = droneRows.filter((d) => d.status === 'available').length;
    const regionCount = demandByRegion.size || 1;
    const supplyPerRegion = Math.floor(totalSupply / regionCount);

    const alerts: {
      region: string;
      demand: number;
      supply: number;
      utilization_pct: number;
      severity: 'warning' | 'critical';
      message: string;
    }[] = [];

    for (const [region, demand] of demandByRegion.entries()) {
      const supply = supplyPerRegion;
      if (supply === 0) continue;
      const utilization = (demand / supply) * 100;
      if (utilization > 80) {
        const severity = utilization > 100 ? 'critical' : 'warning';
        alerts.push({
          region,
          demand,
          supply,
          utilization_pct: Math.round(utilization),
          severity,
          message: `${region}: demand (${demand} drones) is ${Math.round(utilization)}% of available supply (${supply} drones)`,
        });
      }
    }

    // Sort by utilization descending
    alerts.sort((a, b) => b.utilization_pct - a.utilization_pct);

    res.json({ data: { alerts } });
  } catch (err) {
    console.error('Forecasting alerts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
