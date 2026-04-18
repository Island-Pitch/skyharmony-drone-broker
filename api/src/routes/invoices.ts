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

// GET /api/invoices/:id/pdf — generate HTML invoice for download
router.get('/invoices/:id/pdf', auth, async (req, res) => {
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

    // Operator scoping
    const isAdmin = req.user!.role === 'CentralRepoAdmin';
    if (!isAdmin && invoice.operator_id !== req.user!.userId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const lineItems = Array.isArray(invoice.line_items)
      ? (invoice.line_items as { description: string; quantity: number; unit_price: number; total: number }[])
      : [];

    const invoiceDate = invoice.created_at
      ? new Date(invoice.created_at).toLocaleDateString()
      : new Date().toLocaleDateString();
    const dueDate = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString()
      : '-';
    const statusLabel = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);

    const lineItemRows = lineItems
      .map(
        (li) => `
        <tr>
          <td>${li.description}</td>
          <td style="text-align:center">${li.quantity}</td>
          <td style="text-align:right">$${Number(li.unit_price).toFixed(2)}</td>
          <td style="text-align:right">$${Number(li.total).toFixed(2)}</td>
        </tr>`,
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice ${id.slice(0, 8)}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 2rem; color: #1a1a2e; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; border-bottom: 3px solid #16213e; padding-bottom: 1rem; }
    .company h1 { margin: 0; font-size: 1.6rem; color: #16213e; }
    .company p { margin: 0.2rem 0; color: #555; font-size: 0.85rem; }
    .koru { font-style: italic; color: #777; font-size: 0.8rem; margin-top: 0.3rem; }
    .invoice-meta { text-align: right; }
    .invoice-meta p { margin: 0.2rem 0; font-size: 0.9rem; }
    .invoice-meta .inv-number { font-size: 1.1rem; font-weight: 700; color: #16213e; }
    .status { display: inline-block; padding: 0.2rem 0.7rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
    .status-paid { background: #d4edda; color: #155724; }
    .status-draft { background: #fff3cd; color: #856404; }
    .status-sent { background: #cce5ff; color: #004085; }
    .status-overdue { background: #f8d7da; color: #721c24; }
    .bill-to { margin-bottom: 1.5rem; }
    .bill-to h3 { margin: 0 0 0.3rem; font-size: 0.9rem; color: #888; text-transform: uppercase; }
    .bill-to p { margin: 0.1rem 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
    th { background: #16213e; color: #fff; padding: 0.6rem; text-align: left; font-size: 0.85rem; }
    td { padding: 0.5rem 0.6rem; border-bottom: 1px solid #ddd; font-size: 0.9rem; }
    .totals td { border-bottom: none; }
    .totals .grand-total td { font-size: 1.1rem; font-weight: 700; border-top: 2px solid #16213e; }
    .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd; font-size: 0.8rem; color: #888; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <h1>Sky Harmony LLC</h1>
      <p>Drone Coordination &amp; Brokerage</p>
      <p class="koru">The koru: a symbol of new beginnings, growth, and harmony in flight.</p>
    </div>
    <div class="invoice-meta">
      <p class="inv-number">INV-${id.slice(0, 8).toUpperCase()}</p>
      <p>Date: ${invoiceDate}</p>
      <p>Due: ${dueDate}</p>
      <p><span class="status status-${invoice.status}">${statusLabel}</span></p>
    </div>
  </div>

  <div class="bill-to">
    <h3>Bill To</h3>
    <p><strong>${invoice.operator_name ?? 'Unknown Operator'}</strong></p>
    <p>Billing Period: ${invoiceDate} &mdash; ${dueDate}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemRows}
    </tbody>
    <tfoot class="totals">
      <tr>
        <td colspan="3" style="text-align:right;font-weight:600">Subtotal</td>
        <td style="text-align:right">$${Number(invoice.subtotal).toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="3" style="text-align:right;font-weight:600">Tax (8.5%)</td>
        <td style="text-align:right">$${Number(invoice.tax).toFixed(2)}</td>
      </tr>
      <tr class="grand-total">
        <td colspan="3" style="text-align:right">Total</td>
        <td style="text-align:right">$${Number(invoice.total).toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  <p><strong>Payment Status:</strong> ${statusLabel}${invoice.paid_date ? ` (paid ${new Date(invoice.paid_date).toLocaleDateString()})` : ''}</p>

  <div class="footer">
    <p><strong>Payment terms:</strong> Net-30</p>
    <p>Sky Harmony LLC &mdash; Drone Coordination &amp; Brokerage Platform</p>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${id.slice(0, 8)}.html`,
    );
    res.send(html);
  } catch (err) {
    console.error('Invoice PDF error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/invoices/:id/send — admin only, mark invoice as sent (email_stub)
router.post(
  '/invoices/:id/send',
  auth,
  requireRole('CentralRepoAdmin'),
  async (req, res) => {
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
        res.status(400).json({ error: 'Invoice is already paid — cannot re-send' });
        return;
      }

      await db
        .update(invoices)
        .set({
          status: 'sent',
          updated_at: new Date(),
        })
        .where(eq(invoices.id, id));

      res.json({
        data: {
          sent: true,
          method: 'email_stub',
          message:
            'Email integration pending — invoice marked as sent',
        },
      });
    } catch (err) {
      console.error('Send invoice error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// POST /api/invoices/:id/pay — mark invoice as paid (stripe_stub / ach_pending / wire_pending)
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

    const paymentMethod: 'credit_card' | 'ach' | 'wire' =
      req.body?.payment_method ?? 'credit_card';
    const paymentReference: string | undefined = req.body?.payment_reference;

    // For credit_card, set a stub stripe_payment_id
    const stripePaymentId =
      paymentMethod === 'credit_card' ? `stub_${Date.now()}` : null;

    const [updated] = await db
      .update(invoices)
      .set({
        status: 'paid',
        paid_date: new Date(),
        payment_method: paymentMethod,
        stripe_payment_id: stripePaymentId ?? (paymentReference || null),
        updated_at: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();

    res.json({
      data: {
        paid: true,
        method: paymentMethod,
        stripe_payment_id_stub: stripePaymentId,
        invoice: updated,
        note: 'Stripe integration pending — payment recorded manually',
      },
    });
  } catch (err) {
    console.error('Pay invoice error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
