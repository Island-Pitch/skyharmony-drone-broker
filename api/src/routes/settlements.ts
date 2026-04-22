import { Router } from 'express';
import { db } from '../db/connection.js';
import { settlements, invoices, users } from '../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';
import posthog from '../lib/posthog.js';

const router = Router();

const INSURANCE_RATE = 0.07; // 7% insurance pool deduction

// POST /api/settlements/generate — admin only, generate settlements for a period
router.post(
  '/settlements/generate',
  auth,
  requireRole('CentralRepoAdmin'),
  async (req, res) => {
    try {
      const { period_start, period_end } = req.body;

      if (!period_start || !period_end) {
        res.status(400).json({ error: 'period_start and period_end are required' });
        return;
      }

      // Fetch all paid invoices within the period
      const paidInvoices = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.status, 'paid'),
            gte(invoices.paid_date, new Date(period_start)),
            lte(invoices.paid_date, new Date(period_end)),
          ),
        );

      // Group by operator
      const operatorTotals = new Map<
        string,
        { total: number; damageCharges: number; operatorName: string }
      >();

      for (const inv of paidInvoices) {
        const opId = inv.operator_id;
        if (!opId) continue;

        const existing = operatorTotals.get(opId) ?? {
          total: 0,
          damageCharges: 0,
          operatorName: inv.operator_name ?? 'Unknown',
        };

        existing.total += Number(inv.total);

        // Extract damage charges from line items
        const lineItems = (inv.line_items as { description: string; total: number }[]) ?? [];
        for (const li of lineItems) {
          if (li.description?.toLowerCase().includes('damage')) {
            existing.damageCharges += li.total;
          }
        }

        operatorTotals.set(opId, existing);
      }

      if (operatorTotals.size === 0) {
        res.status(200).json({ data: [], message: 'No paid invoices found for this period' });
        return;
      }

      const created: (typeof settlements.$inferSelect)[] = [];

      for (const [operatorId, data] of operatorTotals) {
        const totalDue = Math.round(data.total * 100) / 100;
        const insuranceDeduction = Math.round(totalDue * INSURANCE_RATE * 100) / 100;
        const damageDeduction = Math.round(data.damageCharges * 100) / 100;
        const totalDeductions = Math.round((insuranceDeduction + damageDeduction) * 100) / 100;
        const netAmount = Math.round((totalDue - totalDeductions) * 100) / 100;

        const deductions = {
          insurance_pool: insuranceDeduction,
          damage_charges: damageDeduction,
          total_deductions: totalDeductions,
        };

        const [settlement] = await db
          .insert(settlements)
          .values({
            operator_id: operatorId,
            period_start,
            period_end,
            status: 'draft',
            total_due: String(totalDue),
            total_payable: String(totalDue),
            net_amount: String(netAmount),
            deductions,
          })
          .returning();

        created.push(settlement);
      }

      posthog.capture({
        distinctId: req.user!.userId,
        event: 'settlement_generated',
        properties: {
          period_start,
          period_end,
          settlement_count: created.length,
          operator_count: operatorTotals.size,
        },
      });

      res.status(201).json({ data: created });
    } catch (err) {
      posthog.captureException(err, req.user?.userId);
      console.error('Settlement generation error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/settlements — list settlements (operator-scoped)
router.get('/settlements', auth, async (req, res) => {
  try {
    const isAdmin = req.user!.role === 'CentralRepoAdmin';
    const scopeFilter = isAdmin
      ? undefined
      : eq(settlements.operator_id, req.user!.userId);

    const rows = await db.select().from(settlements).where(scopeFilter);

    // Attach operator names
    const operatorIds = [...new Set(rows.map((r) => r.operator_id))];
    const operatorRows = operatorIds.length > 0
      ? await db.select({ id: users.id, name: users.name }).from(users)
      : [];
    const operatorMap = new Map(operatorRows.map((u) => [u.id, u.name]));

    const data = rows.map((r) => ({
      ...r,
      operator_name: operatorMap.get(r.operator_id) ?? 'Unknown',
    }));

    res.json({ data });
  } catch (err) {
    console.error('List settlements error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/settlements/:id — single settlement with breakdown
router.get('/settlements/:id', auth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const [settlement] = await db
      .select()
      .from(settlements)
      .where(eq(settlements.id, id));

    if (!settlement) {
      res.status(404).json({ error: 'Settlement not found' });
      return;
    }

    // Operator scoping: non-admins can only see their own settlements
    const isAdmin = req.user!.role === 'CentralRepoAdmin';
    if (!isAdmin && settlement.operator_id !== req.user!.userId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    // Get operator name
    const [operator] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, settlement.operator_id));

    // Get related paid invoices for breakdown
    const relatedInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.operator_id, settlement.operator_id),
          eq(invoices.status, 'paid'),
          gte(invoices.paid_date, new Date(settlement.period_start)),
          lte(invoices.paid_date, new Date(settlement.period_end)),
        ),
      );

    res.json({
      data: {
        ...settlement,
        operator_name: operator?.name ?? 'Unknown',
        invoices: relatedInvoices,
      },
    });
  } catch (err) {
    console.error('Get settlement error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/settlements/:id/approve — admin only, approve for payment
router.post(
  '/settlements/:id/approve',
  auth,
  requireRole('CentralRepoAdmin'),
  async (req, res) => {
    try {
      const id = req.params.id as string;
      const [settlement] = await db
        .select()
        .from(settlements)
        .where(eq(settlements.id, id));

      if (!settlement) {
        res.status(404).json({ error: 'Settlement not found' });
        return;
      }

      if (settlement.status !== 'draft' && settlement.status !== 'pending') {
        res.status(400).json({ error: 'Settlement can only be approved from draft or pending status' });
        return;
      }

      const [updated] = await db
        .update(settlements)
        .set({
          status: 'approved',
          approved_by: req.user!.userId,
          approved_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(settlements.id, id))
        .returning();

      posthog.capture({
        distinctId: req.user!.userId,
        event: 'settlement_approved',
        properties: {
          settlement_id: updated!.id,
          operator_id: updated!.operator_id,
          net_amount: Number(updated!.net_amount),
          period_start: updated!.period_start,
          period_end: updated!.period_end,
        },
      });

      res.json({ data: updated });
    } catch (err) {
      posthog.captureException(err, req.user?.userId);
      console.error('Approve settlement error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// POST /api/settlements/:id/pay — admin only, mark as paid
router.post(
  '/settlements/:id/pay',
  auth,
  requireRole('CentralRepoAdmin'),
  async (req, res) => {
    try {
      const id = req.params.id as string;
      const [settlement] = await db
        .select()
        .from(settlements)
        .where(eq(settlements.id, id));

      if (!settlement) {
        res.status(404).json({ error: 'Settlement not found' });
        return;
      }

      if (settlement.status !== 'approved') {
        res.status(400).json({ error: 'Settlement must be approved before marking as paid' });
        return;
      }

      const paymentReference = req.body?.payment_reference ?? '';

      const [updated] = await db
        .update(settlements)
        .set({
          status: 'paid',
          payment_reference: paymentReference,
          paid_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(settlements.id, id))
        .returning();

      posthog.capture({
        distinctId: req.user!.userId,
        event: 'settlement_paid',
        properties: {
          settlement_id: updated!.id,
          operator_id: updated!.operator_id,
          net_amount: Number(updated!.net_amount),
          payment_reference: paymentReference,
        },
      });

      res.json({ data: updated });
    } catch (err) {
      posthog.captureException(err, req.user?.userId);
      console.error('Pay settlement error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
