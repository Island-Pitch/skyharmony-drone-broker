import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { assets, bookings } from '../db/schema.js';
import { eq, and, count } from 'drizzle-orm';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const CheckSchema = z.object({
  booking_id: z.string().uuid(),
});

// POST /api/allocation/check
router.post('/allocation/check', auth, validate(CheckSchema), async (req, res) => {
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
router.post('/allocation/allocate/:bookingId', auth, async (req, res) => {
  try {
    const bookingId = req.params.bookingId as string;

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      res.status(422).json({ error: `Cannot allocate for booking with status '${booking.status}'` });
      return;
    }

    // Find available drones
    const droneTypeId = '00000000-0000-4000-8000-000000000001';
    const availableDrones = await db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.asset_type_id, droneTypeId),
          eq(assets.status, 'available'),
        ),
      )
      .limit(booking.drone_count);

    if (availableDrones.length < booking.drone_count) {
      res.status(422).json({
        error: `Not enough drones available. Need ${booking.drone_count}, found ${availableDrones.length}`,
      });
      return;
    }

    const allocatedIds = availableDrones.map((d) => d.id);

    // Mark drones as allocated
    for (const droneId of allocatedIds) {
      await db
        .update(assets)
        .set({ status: 'allocated', updated_at: new Date() })
        .where(eq(assets.id, droneId));
    }

    // Update booking
    const [updated] = await db
      .update(bookings)
      .set({
        status: 'allocated',
        allocated_assets: allocatedIds,
        updated_at: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    res.json({
      data: {
        booking: updated,
        allocated_count: allocatedIds.length,
      },
    });
  } catch (err) {
    console.error('Allocation allocate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
