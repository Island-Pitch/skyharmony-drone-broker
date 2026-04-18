import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { assets, assetTypes, pilotCertifications, users } from '../db/schema.js';
import { eq, and, or, sql, count } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

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

    res.json({ data: { total_assets: total, by_status, by_type, by_manufacturer, utilization_pct, refreshed_at: new Date().toISOString() } });
  } catch (err) {
    console.error('Fleet summary error:', err);
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
    res.json({ data: asset });
  } catch (err) {
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
    res.json({ data: { id: deleted.id, deleted: true } });
  } catch (err) {
    console.error('Fleet delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  Pilot certifications                                               */
/* ------------------------------------------------------------------ */

const CreatePilotCertSchema = z.object({
  user_id: z.string().uuid(),
  cert_type: z.enum(['Part107', 'Part135', 'ATP']),
  cert_number: z.string().min(1),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  verified: z.boolean().optional().default(false),
});

// GET /api/fleet/pilots — list pilots with certifications
router.get('/fleet/pilots', auth, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: pilotCertifications.id,
        user_id: pilotCertifications.user_id,
        user_name: users.name,
        user_email: users.email,
        cert_type: pilotCertifications.cert_type,
        cert_number: pilotCertifications.cert_number,
        expiry_date: pilotCertifications.expiry_date,
        verified: pilotCertifications.verified,
        created_at: pilotCertifications.created_at,
      })
      .from(pilotCertifications)
      .innerJoin(users, eq(pilotCertifications.user_id, users.id));

    res.json({ data: rows });
  } catch (err) {
    console.error('Fleet pilots list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/fleet/pilots — add pilot certification
router.post('/fleet/pilots', auth, validate(CreatePilotCertSchema), async (req, res) => {
  try {
    const body = req.body as z.infer<typeof CreatePilotCertSchema>;
    const [cert] = await db.insert(pilotCertifications).values({
      user_id: body.user_id,
      cert_type: body.cert_type,
      cert_number: body.cert_number,
      expiry_date: body.expiry_date,
      verified: body.verified,
    }).returning();
    res.status(201).json({ data: cert });
  } catch (err) {
    console.error('Fleet pilots create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
