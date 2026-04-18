import { Router } from 'express';
import { db } from '../db/connection.js';
import { bookings, users } from '../db/schema.js';
import { eq, sql, count } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();

// Pricing model
const ALLOCATION_FEE_PER_DRONE = 350;  // per drone per booking
const STANDBY_FEE_PER_DRONE = 150;     // per drone for standby fleet
const INSURANCE_RATE = 0.07;            // 7% of allocation fees

// GET /api/billing/summary
router.get('/billing/summary', auth, requireRole('CentralRepoAdmin', 'OperatorAdmin'), async (req, res) => {
  try {
    const isAdmin = req.user!.role === 'CentralRepoAdmin';
    const scopeFilter = isAdmin ? undefined : eq(bookings.operator_id, req.user!.userId);

    // Get bookings (scoped to operator for non-admins)
    const allBookings = await db.select({
      id: bookings.id,
      operator_id: bookings.operator_id,
      operator_name: bookings.operator_name,
      drone_count: bookings.drone_count,
      status: bookings.status,
    }).from(bookings).where(scopeFilter);

    // Calculate revenue from allocated/confirmed/completed bookings
    const billableBookings = allBookings.filter(
      (b) => b.status === 'allocated' || b.status === 'confirmed' || b.status === 'completed',
    );

    const totalAllocatedDrones = billableBookings.reduce((sum, b) => sum + b.drone_count, 0);
    const allocationRevenue = totalAllocatedDrones * ALLOCATION_FEE_PER_DRONE;

    // Standby fee: pending bookings hold fleet in reserve
    const pendingBookings = allBookings.filter((b) => b.status === 'pending');
    const standbyDrones = pendingBookings.reduce((sum, b) => sum + b.drone_count, 0);
    const standbyRevenue = standbyDrones * STANDBY_FEE_PER_DRONE;

    const totalRevenue = allocationRevenue + standbyRevenue;
    const insurancePool = Math.round(allocationRevenue * INSURANCE_RATE);

    // Pending invoices = pending bookings count
    const pendingInvoices = pendingBookings.length;

    // Per-operator breakdown
    const operatorMap = new Map<string, { name: string; allocation: number; standby: number; bookings: number }>();
    for (const b of allBookings) {
      const opId = b.operator_id ?? 'unknown';
      const opName = b.operator_name ?? 'Unknown Operator';
      const existing = operatorMap.get(opId) ?? { name: opName, allocation: 0, standby: 0, bookings: 0 };
      existing.bookings++;
      if (b.status && ['allocated', 'confirmed', 'completed'].includes(b.status)) {
        existing.allocation += b.drone_count * ALLOCATION_FEE_PER_DRONE;
      }
      if (b.status === 'pending') {
        existing.standby += b.drone_count * STANDBY_FEE_PER_DRONE;
      }
      operatorMap.set(opId, existing);
    }

    const operators = Array.from(operatorMap.entries()).map(([id, data]) => ({
      operator_id: id,
      operator_name: data.name,
      allocation_revenue: data.allocation,
      standby_revenue: data.standby,
      total_revenue: data.allocation + data.standby,
      booking_count: data.bookings,
    })).sort((a, b) => b.total_revenue - a.total_revenue);

    res.json({
      data: {
        total_revenue: totalRevenue,
        allocation_fee_revenue: allocationRevenue,
        standby_fee_revenue: standbyRevenue,
        insurance_pool: insurancePool,
        pending_invoices: pendingInvoices,
        operators,
      },
    });
  } catch (err) {
    console.error('Billing summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
