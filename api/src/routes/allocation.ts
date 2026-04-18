import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { assets, bookings, allocationRules } from '../db/schema.js';
import { eq, and, count, sql } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const CheckSchema = z.object({
  booking_id: z.string().uuid(),
});

/**
 * Scan +/- windowDays from a target date and return the top N dates
 * with the highest drone availability.
 */
async function findAlternativeDates(
  targetDate: Date,
  droneCount: number,
  windowDays = 14,
  topN = 3,
): Promise<{ date: string; available_count: number; shortfall: number }[]> {
  const droneTypeId = '00000000-0000-4000-8000-000000000001';

  // Get total available drones (simplified: not date-aware for demo)
  const [availableRow] = await db
    .select({ count: count() })
    .from(assets)
    .where(
      and(
        eq(assets.asset_type_id, droneTypeId),
        eq(assets.status, 'available'),
      ),
    );
  const totalAvailable = Number(availableRow?.count ?? 0);

  const candidates: { date: string; available_count: number; shortfall: number }[] = [];

  for (let offset = -windowDays; offset <= windowDays; offset++) {
    if (offset === 0) continue; // skip the requested date

    const candidate = new Date(targetDate);
    candidate.setDate(candidate.getDate() + offset);
    const dateStr = candidate.toISOString().split('T')[0]!;

    // Count bookings overlapping this candidate date
    const overlapping = await db
      .select({ total_drones: sql<number>`COALESCE(SUM(${bookings.drone_count}), 0)` })
      .from(bookings)
      .where(
        sql`${bookings.show_date}::date = ${dateStr}::date AND ${bookings.status} NOT IN ('cancelled', 'completed')`,
      );

    const usedDrones = Number(overlapping[0]?.total_drones ?? 0);
    const availableForDate = Math.max(0, totalAvailable - usedDrones);
    const shortfall = Math.max(0, droneCount - availableForDate);

    candidates.push({
      date: candidate.toISOString(),
      available_count: availableForDate,
      shortfall,
    });
  }

  // Sort by availability descending, then by proximity to target date
  candidates.sort((a, b) => {
    if (b.available_count !== a.available_count) {
      return b.available_count - a.available_count;
    }
    const aDist = Math.abs(new Date(a.date).getTime() - targetDate.getTime());
    const bDist = Math.abs(new Date(b.date).getTime() - targetDate.getTime());
    return aDist - bDist;
  });

  return candidates.slice(0, topN);
}

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

    // SHD-6: Scan +/- 14 days for alternative dates with highest availability
    const alternatives = await findAlternativeDates(
      new Date(booking.show_date),
      needed,
    );

    res.json({
      data: {
        booking_id,
        available,
        needed,
        can_allocate: available >= needed,
        conflicts,
        alternatives,
      },
    });
  } catch (err) {
    console.error('Allocation check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/allocation/rules — list allocation rules
router.get('/allocation/rules', auth, async (_req, res) => {
  try {
    const rules = await db.select().from(allocationRules);
    res.json({ data: rules });
  } catch (err) {
    console.error('Allocation rules list error:', err);
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

    res.json({
      data: {
        booking: result.booking,
        allocated_count: result.allocated_count,
      },
    });
  } catch (err) {
    console.error('Allocation allocate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
