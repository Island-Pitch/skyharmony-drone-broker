import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { assets, assetTypes } from '../db/schema.js';
import { eq, and, or, sql, count } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import posthog from '../lib/posthog.js';

const router = Router();

/** Escape `%`, `_`, and `\` for use in SQL LIKE/ILIKE patterns (PostgreSQL ESCAPE '\\'). */
function escapeLikePattern(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

const CreateAssetSchema = z.object({
  asset_type_id: z.string().uuid(),
  serial_number: z.string().min(1),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  typed_attributes: z.record(z.string(), z.any()).optional().default({}),
  firmware_version: z.string().optional(),
  flight_hours: z.number().nonnegative().optional(),
  battery_cycles: z.number().int().nonnegative().optional(),
  parent_asset_id: z.string().uuid().optional(),
});

const UpdateAssetSchema = z.object({
  status: z.enum(['available', 'allocated', 'in_transit', 'maintenance', 'retired']).optional(),
  firmware_version: z.string().optional(),
  flight_hours: z.number().nonnegative().optional(),
  battery_cycles: z.number().int().nonnegative().optional(),
  typed_attributes: z.record(z.string(), z.any()).optional(),
  current_operator_id: z.string().uuid().nullable().optional(),
  parent_asset_id: z.string().uuid().nullable().optional(),
});

// GET /api/fleet/summary — must come before /:id
router.get('/fleet/summary', auth, async (req, res) => {
  try {
    const isAdmin = req.user!.role === 'CentralRepoAdmin';
    const scopeFilter = isAdmin ? undefined : eq(assets.current_operator_id, req.user!.userId);

    const rows = await db
      .select({
        status: assets.status,
        count: count(),
      })
      .from(assets)
      .where(scopeFilter)
      .groupBy(assets.status);

    const total = rows.reduce((s, r) => s + Number(r.count), 0);
    const by_status: Record<string, number> = {};
    for (const r of rows) {
      by_status[r.status] = Number(r.count);
    }

    // Manufacturer breakdown
    const mfrRows = await db
      .select({ manufacturer: assets.manufacturer, count: count() })
      .from(assets)
      .where(scopeFilter)
      .groupBy(assets.manufacturer);
    const by_manufacturer: Record<string, number> = {};
    for (const r of mfrRows) {
      by_manufacturer[r.manufacturer] = Number(r.count);
    }

    // Type breakdown
    const typeRows = await db
      .select({ asset_type_id: assets.asset_type_id, count: count() })
      .from(assets)
      .where(scopeFilter)
      .groupBy(assets.asset_type_id);
    const by_type: Record<string, number> = {};
    for (const r of typeRows) {
      if (r.asset_type_id) by_type[r.asset_type_id] = Number(r.count);
    }

    const retired = by_status['retired'] ?? 0;
    const allocated = by_status['allocated'] ?? 0;
    const in_transit = by_status['in_transit'] ?? 0;
    const active = total - retired;
    const utilization_pct = active > 0 ? Math.round(((allocated + in_transit) / active) * 1000) / 10 : 0;

    res.json({ data: { total_assets: total, by_status, by_type, by_manufacturer, utilization_pct } });
  } catch (err) {
    console.error('Fleet summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/fleet/types/:typeId/schema — returns expected typed_attributes fields
const TYPE_ATTRIBUTE_SCHEMAS: Record<string, { field: string; type: string; description: string }[]> = {
  fixed_wing: [
    { field: 'tail_number', type: 'string', description: 'FAA tail number' },
    { field: 'airframe_hours', type: 'number', description: 'Total airframe hours' },
    { field: 'engine_hours', type: 'number', description: 'Total engine hours' },
    { field: 'ifr_certified', type: 'boolean', description: 'IFR certification status' },
    { field: 'seats', type: 'number', description: 'Number of seats' },
    { field: 'range_nm', type: 'number', description: 'Range in nautical miles' },
  ],
  helicopter: [
    { field: 'tail_number', type: 'string', description: 'FAA tail number' },
    { field: 'rotor_hours', type: 'number', description: 'Total rotor hours' },
    { field: 'turbine_hours', type: 'number', description: 'Total turbine hours' },
    { field: 'max_payload_kg', type: 'number', description: 'Maximum payload in kg' },
  ],
  pyrodrone: [
    { field: 'pyro_capacity', type: 'number', description: 'Pyrotechnic payload capacity' },
    { field: 'faa_waiver_number', type: 'string', description: 'FAA pyro waiver number' },
    { field: 'max_altitude_ft', type: 'number', description: 'Maximum altitude in feet' },
  ],
  drone: [
    { field: 'max_altitude_ft', type: 'number', description: 'Maximum altitude in feet' },
    { field: 'payload_capacity_kg', type: 'number', description: 'Payload capacity in kg' },
  ],
  battery: [{ field: 'capacity_mah', type: 'number', description: 'Battery capacity in mAh' }],
  charger: [{ field: 'bays', type: 'number', description: 'Number of charging bays' }],
  base_station: [{ field: 'range_km', type: 'number', description: 'Communication range in km' }],
  trailer: [
    { field: 'capacity_drones', type: 'number', description: 'Drone capacity' },
    { field: 'vehicle_type', type: 'string', description: 'Vehicle type' },
    { field: 'license_plate', type: 'string', description: 'License plate number' },
  ],
  antenna_array: [
    { field: 'frequency_ghz', type: 'number', description: 'Operating frequency in GHz' },
    { field: 'range_km', type: 'number', description: 'Range in km' },
    { field: 'channels', type: 'number', description: 'Number of channels' },
  ],
  ground_control: [
    { field: 'software_version', type: 'string', description: 'Software version' },
    { field: 'max_drones', type: 'number', description: 'Maximum simultaneous drones' },
    { field: 'display_count', type: 'number', description: 'Number of displays' },
  ],
  rtk_station: [
    { field: 'accuracy_cm', type: 'number', description: 'Position accuracy in cm' },
    { field: 'constellation', type: 'string', description: 'GNSS constellation support' },
    { field: 'range_km', type: 'number', description: 'Range in km' },
  ],
};

router.get('/fleet/types/:typeId/schema', auth, async (req, res) => {
  try {
    const typeId = req.params.typeId as string;
    const [assetType] = await db.select().from(assetTypes).where(eq(assetTypes.id, typeId)).limit(1);
    if (!assetType) {
      res.status(404).json({ error: 'Asset type not found' });
      return;
    }
    const schema = TYPE_ATTRIBUTE_SCHEMAS[assetType.name] ?? [];
    res.json({ data: { type_id: typeId, type_name: assetType.name, fields: schema } });
  } catch (err) {
    console.error('Fleet type schema error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/fleet/types — returns asset types with count of assets per type
router.get('/fleet/types', auth, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: assetTypes.id,
        name: assetTypes.name,
        description: assetTypes.description,
        created_at: assetTypes.created_at,
        updated_at: assetTypes.updated_at,
        asset_count: count(assets.id),
      })
      .from(assetTypes)
      .leftJoin(assets, eq(assetTypes.id, assets.asset_type_id))
      .groupBy(assetTypes.id, assetTypes.name, assetTypes.description, assetTypes.created_at, assetTypes.updated_at);

    res.json({ data: rows });
  } catch (err) {
    console.error('Fleet types error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/fleet
router.get('/fleet', auth, async (req, res) => {
  try {
    const {
      type,
      status,
      search,
      page = '1',
      per_page = '50',
    } = req.query as Record<string, string | undefined>;

    const isAdmin = req.user!.role === 'CentralRepoAdmin';
    const conditions = [];
    if (!isAdmin) conditions.push(eq(assets.current_operator_id, req.user!.userId));
    if (type) conditions.push(eq(assets.asset_type_id, type));
    if (status) conditions.push(eq(assets.status, status));
    if (search) {
      const pattern = `%${escapeLikePattern(search)}%`;
      conditions.push(
        or(
          sql`${assets.serial_number} ILIKE ${pattern} ESCAPE '\\'`,
          sql`${assets.manufacturer} ILIKE ${pattern} ESCAPE '\\'`,
          sql`${assets.model} ILIKE ${pattern} ESCAPE '\\'`,
        )!,
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = Math.min(Number(per_page) || 50, 200);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

    const [rows, [totalRow]] = await Promise.all([
      db.select().from(assets).where(where).limit(limit).offset(offset),
      db.select({ count: count() }).from(assets).where(where),
    ]);

    const total = Number(totalRow?.count ?? 0);
    const currentPage = Math.max(Number(page) || 1, 1);
    // Normalize flight_hours from string to number
    const normalized = rows.map((r) => ({
      ...r,
      flight_hours: r.flight_hours != null ? Number(r.flight_hours) : undefined,
    }));
    res.json({
      data: normalized,
      meta: {
        page: currentPage,
        per_page: limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Fleet list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/fleet/:id
router.get('/fleet/:id', auth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const [asset] = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json({ data: asset });
  } catch (err) {
    console.error('Fleet get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/fleet
router.post('/fleet', auth, requireRole('CentralRepoAdmin'), validate(CreateAssetSchema), async (req, res) => {
  try {
    const body = req.body as z.infer<typeof CreateAssetSchema>;
    const [asset] = await db.insert(assets).values({
      ...body,
      flight_hours: body.flight_hours != null ? String(body.flight_hours) : '0',
      status: 'available',
    }).returning();

    posthog.capture({
      distinctId: req.user!.userId,
      event: 'asset_created',
      properties: {
        asset_id: asset!.id,
        asset_type_id: body.asset_type_id,
        serial_number: body.serial_number,
        manufacturer: body.manufacturer,
        model: body.model,
      },
    });

    res.status(201).json({ data: asset });
  } catch (err: any) {
    if (err?.code === '23505') {
      res.status(409).json({ error: 'Serial number already exists' });
      return;
    }
    console.error('Fleet create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/fleet/:id
router.patch('/fleet/:id', auth, validate(UpdateAssetSchema), async (req, res) => {
  try {
    const body = req.body as z.infer<typeof UpdateAssetSchema>;
    const id = req.params.id as string;

    // Ownership check: only CentralRepoAdmin or the asset's current operator can update
    const isAdmin = req.user!.role === 'CentralRepoAdmin';
    if (!isAdmin) {
      const [existing] = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
      if (!existing) {
        res.status(404).json({ error: 'Asset not found' });
        return;
      }
      if (existing.current_operator_id !== req.user!.userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    }

    const updates: Record<string, unknown> = { ...body, updated_at: new Date() };
    if (body.flight_hours != null) {
      updates.flight_hours = String(body.flight_hours);
    }

    const [asset] = await db
      .update(assets)
      .set(updates)
      .where(eq(assets.id, id))
      .returning();

    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    posthog.capture({
      distinctId: req.user!.userId,
      event: 'asset_updated',
      properties: {
        asset_id: id,
        updated_fields: Object.keys(body),
        new_status: body.status,
      },
    });

    res.json({ data: asset });
  } catch (err) {
    posthog.captureException(err, req.user?.userId);
    console.error('Fleet update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/fleet/:id
router.delete('/fleet/:id', auth, requireRole('CentralRepoAdmin'), async (req, res) => {
  try {
    const id = req.params.id as string;
    const [deleted] = await db.delete(assets).where(eq(assets.id, id)).returning();
    if (!deleted) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    posthog.capture({
      distinctId: req.user!.userId,
      event: 'asset_deleted',
      properties: { asset_id: id, serial_number: deleted.serial_number },
    });

    res.json({ data: { id: deleted.id, deleted: true } });
  } catch (err) {
    posthog.captureException(err, req.user?.userId);
    console.error('Fleet delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
