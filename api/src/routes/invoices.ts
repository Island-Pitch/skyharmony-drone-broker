import { Router } from 'express';
import { db } from '../db/connection.js';
import { invoices, bookings, incidents } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();

// Pricing constants (same as billing.ts)
const ALLOCATION_FEE_PER_DRONE = 350;
const STANDBY_FEE_PER_DRONE = 150;
const INSURANCE_RATE = 0.07;
const TAX_RATE = 0.085; // 8.5% tax

// POST /api/invoices/generate/:bookingId — admin only, create invoice from booking
router.post(
  '/invoices/generate/:bookingId',
  auth,
  requireRole('CentralRepoAdmin'),
  async (req, res) => {
    try {
      const bookingId = req.params.bookingId as string;

      // Fetch the booking
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId));

      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      // Check if invoice already exists for this booking
      const [existing] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.booking_id, bookingId));

      if (existing) {
        res.status(409).json({ error: 'Invoice already exists for this booking' });
        return;
      }

      // Build line items
      const lineItems: { description: string; quantity: number; unit_price: number; total: number }[] = [];

      // Allocation fees
      const allocationTotal = booking.drone_count * ALLOCATION_FEE_PER_DRONE;
      lineItems.push({
        description: 'Drone allocation fee',
        quantity: booking.drone_count,
        unit_price: ALLOCATION_FEE_PER_DRONE,
        total: allocationTotal,
      });

      // Standby fees (pending bookings get standby charge)
      if (booking.status === 'pending') {
        const standbyTotal = booking.drone_count * STANDBY_FEE_PER_DRONE;
        lineItems.push({
          description: 'Fleet standby fee',
          quantity: booking.drone_count,
          unit_price: STANDBY_FEE_PER_DRONE,
          total: standbyTotal,
        });
      }

      // Insurance
      const insuranceTotal = Math.round(allocationTotal * INSURANCE_RATE * 100) / 100;
      lineItems.push({
        description: 'Drone insurance coverage',
        quantity: 1,
        unit_price: insuranceTotal,
        total: insuranceTotal,
      });

      // Check for damage incidents on the booking
      const bookingIncidents = await db
        .select()
        .from(incidents)
        .where(eq(incidents.booking_id, bookingId));

      if (bookingIncidents.length > 0) {
        const damageCharge = bookingIncidents.length * 500;
        lineItems.push({
          description: 'Damage / incident charges',
          quantity: bookingIncidents.length,
          unit_price: 500,
          total: damageCharge,
        });
      }

      const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
      const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // net-30

      const [invoice] = await db
        .insert(invoices)
        .values({
          booking_id: bookingId,
          operator_id: booking.operator_id,
          operator_name: booking.operator_name,
          status: 'draft',
          line_items: lineItems,
          subtotal: String(subtotal),
          tax: String(tax),
          total: String(total),
          due_date: dueDate,
          payment_method: 'pending',
        })
        .returning();

      res.status(201).json({ data: invoice });
    } catch (err) {
      console.error('Invoice generation error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/invoices — list invoices (operator-scoped)
router.get('/invoices', auth, async (req, res) => {
  try {
    const isAdmin = req.user!.role === 'CentralRepoAdmin';
    const scopeFilter = isAdmin
      ? undefined
      : eq(invoices.operator_id, req.user!.userId);

    const rows = await db.select().from(invoices).where(scopeFilter);
    res.json({ data: rows });
  } catch (err) {
    console.error('List invoices error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/invoices/summary — aggregate totals
router.get('/invoices/summary', auth, async (req, res) => {
  try {
    const isAdmin = req.user!.role === 'CentralRepoAdmin';
    const scopeFilter = isAdmin
      ? undefined
      : eq(invoices.operator_id, req.user!.userId);

    const rows = await db.select().from(invoices).where(scopeFilter);

    const totalBilled = rows.reduce((sum, inv) => sum + Number(inv.total), 0);
    const totalPaid = rows
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.total), 0);
    const totalOutstanding = rows
      .filter((inv) => inv.status !== 'paid')
      .reduce((sum, inv) => sum + Number(inv.total), 0);

    res.json({
      data: {
        total_billed: Math.round(totalBilled * 100) / 100,
        total_paid: Math.round(totalPaid * 100) / 100,
        total_outstanding: Math.round(totalOutstanding * 100) / 100,
        invoice_count: rows.length,
      },
    });
  } catch (err) {
    console.error('Invoice summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/invoices/:id — single invoice
router.get('/invoices/:id', auth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Operator scoping: non-admins can only see their own invoices
    const isAdmin = req.user!.role === 'CentralRepoAdmin';
    if (!isAdmin && invoice.operator_id !== req.user!.userId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    res.json({ data: invoice });
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/invoices/:id/pay — mark invoice as paid
router.post('/invoices/:id/pay', auth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    if (invoice.status === 'paid') {
      res.status(400).json({ error: 'Invoice is already paid' });
      return;
    }

    const paymentMethod = req.body?.payment_method ?? 'credit_card';

    const [updated] = await db
      .update(invoices)
      .set({
        status: 'paid',
        paid_date: new Date(),
        payment_method: paymentMethod,
        updated_at: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();

    res.json({ data: updated });
  } catch (err) {
    console.error('Pay invoice error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
