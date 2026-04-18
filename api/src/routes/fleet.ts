import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { assets, assetTypes } from '../db/schema.js';
import { eq, ilike, and, or, sql, count } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

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
router.get('/fleet/summary', auth, async (_req, res) => {
  try {
    const rows = await db
      .select({
        status: assets.status,
        count: count(),
      })
      .from(assets)
      .groupBy(assets.status);

    const total = rows.reduce((s, r) => s + Number(r.count), 0);
    const byStatus: Record<string, number> = {};
    for (const r of rows) {
      byStatus[r.status] = Number(r.count);
    }

    res.json({ data: { total, byStatus } });
  } catch (err) {
    console.error('Fleet summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/fleet/types
router.get('/fleet/types', auth, async (_req, res) => {
  try {
    const rows = await db.select().from(assetTypes);
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

    const conditions = [];
    if (type) conditions.push(eq(assets.asset_type_id, type));
    if (status) conditions.push(eq(assets.status, status));
    if (search) {
      conditions.push(
        or(
          ilike(assets.serial_number, `%${search}%`),
          ilike(assets.manufacturer, `%${search}%`),
          ilike(assets.model, `%${search}%`),
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

    res.json({
      data: rows,
      meta: {
        page: Math.max(Number(page) || 1, 1),
        per_page: limit,
        total: Number(totalRow?.count ?? 0),
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

export default router;
