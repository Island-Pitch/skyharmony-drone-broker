import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { bookings } from '../db/schema.js';
import { eq, count } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import posthog from '../lib/posthog.js';
import { auditLog } from '../lib/audit.js';

const router = Router();

const ADMIN_ROLES = ['CentralRepoAdmin', 'LogisticsStaff', 'SystemAI'];

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['allocated', 'confirmed', 'cancelled'],
  allocated: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const CreateBookingSchema = z.object({
  operator_id: z.string().uuid(),
  operator_name: z.string().min(1),
  show_date: z.string().datetime(),
  end_date: z.string().datetime().optional(),
  drone_count: z.number().int().positive(),
  location: z.string().min(1),
  notes: z.string().optional(),
});

const UpdateBookingSchema = z.object({
  show_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  drone_count: z.number().int().positive().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  allocated_assets: z.array(z.string().uuid()).optional(),
});

const TransitionSchema = z.object({
  status: z.enum(['pending', 'allocated', 'confirmed', 'completed', 'cancelled']),
});

// GET /api/bookings
router.get('/bookings', auth, async (req, res) => {
  try {
    const isAdmin = ADMIN_ROLES.includes(req.user!.role);
    const where = isAdmin ? undefined : eq(bookings.operator_id, req.user!.userId);

    const rows = await db.select().from(bookings).where(where);
    res.json({ data: rows });
  } catch (err) {
    console.error('Bookings list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bookings/:id
router.get('/bookings/:id', auth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    const isAdmin = ADMIN_ROLES.includes(req.user!.role);
    if (!isAdmin && booking.operator_id !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.json({ data: booking });
  } catch (err) {
    console.error('Booking get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/bookings
router.post('/bookings', auth, validate(CreateBookingSchema), async (req, res) => {
  try {
    const body = req.body as z.infer<typeof CreateBookingSchema>;
    // Non-admins must use their own userId as operator_id
    const isAdmin = req.user!.role === 'CentralRepoAdmin';
    const operator_id = isAdmin ? body.operator_id : req.user!.userId;
    const [booking] = await db.insert(bookings).values({
      ...body,
      operator_id,
      show_date: new Date(body.show_date),
      end_date: body.end_date ? new Date(body.end_date) : null,
      status: 'pending',
      allocated_assets: [],
    }).returning();

    posthog.capture({
      distinctId: req.user!.userId,
      event: 'booking_created',
      properties: {
        booking_id: booking!.id,
        operator_id: booking!.operator_id,
        operator_name: booking!.operator_name,
        drone_count: booking!.drone_count,
        location: booking!.location,
        show_date: booking!.show_date,
      },
    });

    res.status(201).json({ data: booking });
  } catch (err) {
    posthog.captureException(err, req.user?.userId);
    console.error('Booking create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/bookings/:id
router.patch('/bookings/:id', auth, validate(UpdateBookingSchema), async (req, res) => {
  try {
    const body = req.body as z.infer<typeof UpdateBookingSchema>;
    const id = req.params.id as string;

    // Ownership check: only admins (same policy as list) or the booking's operator can update
    const isAdmin = ADMIN_ROLES.includes(req.user!.role);
    if (!isAdmin) {
      const [existing] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
      if (!existing) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }
      if (existing.operator_id !== req.user!.userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    }

    const updates: Record<string, unknown> = { ...body, updated_at: new Date() };
    if (body.show_date) updates.show_date = new Date(body.show_date);
    if (body.end_date) updates.end_date = new Date(body.end_date);

    const [booking] = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, id))
      .returning();

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json({ data: booking });
  } catch (err) {
    console.error('Booking update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/bookings/:id/transition
router.post('/bookings/:id/transition', auth, requireRole('CentralRepoAdmin'), validate(TransitionSchema), async (req, res) => {
  try {
    const { status: newStatus } = req.body as z.infer<typeof TransitionSchema>;

    const id = req.params.id as string;
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const allowed = VALID_TRANSITIONS[booking.status ?? 'pending'] ?? [];
    if (!allowed.includes(newStatus)) {
      res.status(422).json({
        error: `Cannot transition from '${booking.status}' to '${newStatus}'`,
      });
      return;
    }

    const [updated] = await db
      .update(bookings)
      .set({ status: newStatus, updated_at: new Date() })
      .where(eq(bookings.id, id))
      .returning();

    await auditLog({
      action: 'booking_transition',
      actorId: req.user!.userId,
      targetType: 'booking',
      targetId: id,
      details: { from: booking.status, to: newStatus, operator_id: booking.operator_id },
    });

    posthog.capture({
      distinctId: req.user!.userId,
      event: 'booking_status_transitioned',
      properties: {
        booking_id: id,
        previous_status: booking.status,
        new_status: newStatus,
        operator_id: booking.operator_id,
        drone_count: booking.drone_count,
      },
    });

    res.json({ data: updated });
  } catch (err) {
    posthog.captureException(err, req.user?.userId);
    console.error('Booking transition error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
