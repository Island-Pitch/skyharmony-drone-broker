import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { assets, bookings } from '../db/schema.js';
import { eq, and, count } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import posthog from '../lib/posthog.js';

const router = Router();

const CheckSchema = z.object({
  booking_id: z.string().uuid(),
});

// POST /api/allocation/check
router.post('/allocation/check', auth, requireRole('CentralRepoAdmin'), validate(CheckSchema), async (req, res) => {
  try {
    const { booking_id } = req.body as z.infer<typeof CheckSchema>;

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, booking_id))
      .limit(1);

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Count available drones
    const droneTypeId = '00000000-0000-4000-8000-000000000001';
    const [availableRow] = await db
      .select({ count: count() })
      .from(assets)
      .where(
        and(
          eq(assets.asset_type_id, droneTypeId),
          eq(assets.status, 'available'),
        ),
      );

    const available = Number(availableRow?.count ?? 0);
    const needed = booking.drone_count;
    const conflicts = available < needed
      ? [{ reason: 'insufficient_drones', available, needed }]
      : [];

    res.json({
      data: {
        booking_id,
        available,
        needed,
        can_allocate: available >= needed,
        conflicts,
      },
    });
  } catch (err) {
    console.error('Allocation check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/allocation/allocate/:bookingId
router.post('/allocation/allocate/:bookingId', auth, requireRole('CentralRepoAdmin'), async (req, res) => {
  try {
    const bookingId = req.params.bookingId as string;

    const droneTypeId = '00000000-0000-4000-8000-000000000001';

    const result = await db.transaction(async (tx) => {
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .for('update')
        .limit(1);

      if (!booking) {
        return { ok: false as const, code: 'not_found' as const };
      }

      if (booking.status !== 'pending' && booking.status !== 'confirmed') {
        return { ok: false as const, code: 'invalid_status' as const, status: booking.status };
      }

      const availableDrones = await tx
        .select()
        .from(assets)
        .where(
          and(
            eq(assets.asset_type_id, droneTypeId),
            eq(assets.status, 'available'),
          ),
        )
        .limit(booking.drone_count)
        .for('update');

      if (availableDrones.length < booking.drone_count) {
        return {
          ok: false as const,
          code: 'insufficient' as const,
          needed: booking.drone_count,
          found: availableDrones.length,
        };
      }

      const allocatedIds = availableDrones.map((d) => d.id);

      for (const droneId of allocatedIds) {
        await tx
          .update(assets)
          .set({ status: 'allocated', updated_at: new Date() })
          .where(eq(assets.id, droneId));
      }

      const [updated] = await tx
        .update(bookings)
        .set({
          status: 'allocated',
          allocated_assets: allocatedIds,
          updated_at: new Date(),
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      return { ok: true as const, booking: updated, allocated_count: allocatedIds.length };
    });

    if (!result.ok) {
      if (result.code === 'not_found') {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }
      if (result.code === 'invalid_status') {
        res.status(422).json({ error: `Cannot allocate for booking with status '${result.status}'` });
        return;
      }
      res.status(422).json({
        error: `Not enough drones available. Need ${result.needed}, found ${result.found}`,
      });
      return;
    }

    posthog.capture({
      distinctId: req.user!.userId,
      event: 'drones_allocated',
      properties: {
        booking_id: bookingId,
        allocated_count: result.allocated_count,
        operator_id: result.booking?.operator_id,
      },
    });

    res.json({
      data: {
        booking: result.booking,
        allocated_count: result.allocated_count,
      },
    });
  } catch (err) {
    posthog.captureException(err, req.user?.userId);
    console.error('Allocation allocate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
