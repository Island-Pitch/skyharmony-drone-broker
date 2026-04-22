import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { incidents, assets } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import posthog from '../lib/posthog.js';

const router = Router();

const CreateIncidentSchema = z.object({
  asset_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  severity: z.enum(['cosmetic', 'functional', 'critical']),
  description: z.string().min(1),
  photo_url: z.string().optional(),
});

const ResolveSchema = z.object({
  resolution_notes: z.string().min(1),
});

// GET /api/incidents
router.get('/incidents', auth, async (req, res) => {
  try {
    const isAdmin = req.user!.role === 'CentralRepoAdmin';
    const { severity, status } = req.query as Record<string, string | undefined>;
    const conditions = [];
    if (!isAdmin) conditions.push(eq(incidents.reporter_id, req.user!.userId));
    if (severity) conditions.push(eq(incidents.severity, severity));
    if (status) conditions.push(eq(incidents.status, status));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db.select().from(incidents).where(where);
    res.json({ data: rows });
  } catch (err) {
    console.error('Incidents list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/incidents
router.post('/incidents', auth, validate(CreateIncidentSchema), async (req, res) => {
  try {
    const body = req.body as z.infer<typeof CreateIncidentSchema>;
    const incident = await db.transaction(async (tx) => {
      const [created] = await tx.insert(incidents).values({
        ...body,
        reporter_id: req.user!.userId,
        status: 'open',
      }).returning();

      if (body.severity === 'critical') {
        await tx
          .update(assets)
          .set({ status: 'maintenance', updated_at: new Date() })
          .where(eq(assets.id, body.asset_id));
      }

      return created;
    });

    posthog.capture({
      distinctId: req.user!.userId,
      event: 'incident_reported',
      properties: {
        incident_id: incident!.id,
        asset_id: incident!.asset_id,
        booking_id: incident!.booking_id,
        severity: incident!.severity,
      },
    });

    res.status(201).json({ data: incident });
  } catch (err) {
    posthog.captureException(err, req.user?.userId);
    console.error('Incident create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/incidents/:id/resolve
router.post('/incidents/:id/resolve', auth, requireRole('CentralRepoAdmin'), validate(ResolveSchema), async (req, res) => {
  try {
    const { resolution_notes } = req.body as z.infer<typeof ResolveSchema>;

    const id = req.params.id as string;
    const [incident] = await db
      .update(incidents)
      .set({ status: 'resolved', resolution_notes, updated_at: new Date() })
      .where(eq(incidents.id, id))
      .returning();

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    posthog.capture({
      distinctId: req.user!.userId,
      event: 'incident_resolved',
      properties: {
        incident_id: incident.id,
        asset_id: incident.asset_id,
        severity: incident.severity,
      },
    });

    res.json({ data: incident });
  } catch (err) {
    posthog.captureException(err, req.user?.userId);
    console.error('Incident resolve error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
