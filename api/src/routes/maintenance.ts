/** SHD-15: Rules-based maintenance triggers and ticket workflow. */
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { maintenanceRules, maintenanceTickets, assets } from '../db/schema.js';
import { eq, and, sql, count } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import posthog from '../lib/posthog.js';

const router = Router();

/* ---------- Schemas ---------- */

const CreateRuleSchema = z.object({
  asset_type_id: z.string().uuid().nullable().optional(),
  rule_name: z.string().min(1),
  field: z.enum(['flight_hours', 'battery_cycles', 'firmware_version']),
  operator: z.enum(['gte', 'lte', 'neq']),
  threshold_value: z.string().min(1),
  severity: z.enum(['warning', 'mandatory_ground']),
  enabled: z.boolean().optional().default(true),
});

const UpdateRuleSchema = z.object({
  enabled: z.boolean().optional(),
  rule_name: z.string().min(1).optional(),
  threshold_value: z.string().min(1).optional(),
  severity: z.enum(['warning', 'mandatory_ground']).optional(),
});

const UpdateTicketSchema = z.object({
  status: z.enum(['open', 'assigned', 'in_progress', 'verification', 'complete']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  parts_needed: z.string().nullable().optional(),
  resolution_notes: z.string().nullable().optional(),
  severity: z.enum(['warning', 'mandatory_ground']).optional(),
});

/* ---------- Rules ---------- */

// GET /api/maintenance/rules
router.get('/maintenance/rules', auth, async (_req, res) => {
  try {
    const rows = await db.select().from(maintenanceRules);
    res.json({ data: rows });
  } catch (err) {
    console.error('Maintenance rules list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/maintenance/rules
router.post('/maintenance/rules', auth, requireRole('CentralRepoAdmin'), validate(CreateRuleSchema), async (req, res) => {
  try {
    const body = req.body as z.infer<typeof CreateRuleSchema>;
    const [rule] = await db.insert(maintenanceRules).values(body).returning();

    posthog.capture({
      distinctId: req.user!.userId,
      event: 'maintenance_rule_created',
      properties: { rule_id: rule!.id, rule_name: body.rule_name, field: body.field, severity: body.severity },
    });

    res.status(201).json({ data: rule });
  } catch (err) {
    posthog.captureException(err, req.user?.userId);
    console.error('Maintenance rule create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/maintenance/rules/:id
router.patch('/maintenance/rules/:id', auth, requireRole('CentralRepoAdmin'), validate(UpdateRuleSchema), async (req, res) => {
  try {
    const body = req.body as z.infer<typeof UpdateRuleSchema>;
    const id = req.params.id as string;
    const [rule] = await db
      .update(maintenanceRules)
      .set(body)
      .where(eq(maintenanceRules.id, id))
      .returning();
    if (!rule) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }
    res.json({ data: rule });
  } catch (err) {
    console.error('Maintenance rule update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ---------- Evaluate ---------- */

// POST /api/maintenance/evaluate — run all enabled rules against all non-retired assets
router.post('/maintenance/evaluate', auth, requireRole('CentralRepoAdmin'), async (_req, res) => {
  try {
    const rules = await db.select().from(maintenanceRules).where(eq(maintenanceRules.enabled, true));
    const allAssets = await db.select().from(assets);

    const ticketsCreated: (typeof maintenanceTickets.$inferSelect)[] = [];

    // Get existing open tickets to avoid duplicates (same asset + same rule)
    const existingTickets = await db
      .select({ asset_id: maintenanceTickets.asset_id, rule_id: maintenanceTickets.rule_id })
      .from(maintenanceTickets)
      .where(
        sql`${maintenanceTickets.status} != 'complete'`
      );
    const existingSet = new Set(
      existingTickets.map((t) => `${t.asset_id}:${t.rule_id}`),
    );

    for (const rule of rules) {
      for (const asset of allAssets) {
        if (asset.status === 'retired') continue;

        // Filter by asset type if the rule is scoped
        if (rule.asset_type_id && asset.asset_type_id !== rule.asset_type_id) continue;

        // Skip if an open ticket already exists for this asset+rule
        if (existingSet.has(`${asset.id}:${rule.id}`)) continue;

        const violated = evaluateRule(rule, asset);
        if (!violated) continue;

        const [ticket] = await db.insert(maintenanceTickets).values({
          asset_id: asset.id,
          rule_id: rule.id,
          ticket_type: rule.field === 'firmware_version' ? 'firmware' : 'threshold',
          severity: rule.severity,
          description: `Rule "${rule.rule_name}" triggered: ${rule.field} ${rule.operator} ${rule.threshold_value} (current: ${getFieldValue(rule.field, asset)})`,
        }).returning();

        ticketsCreated.push(ticket!);

        // If mandatory_ground, set asset to maintenance
        if (rule.severity === 'mandatory_ground' && asset.status !== 'maintenance') {
          await db.update(assets).set({ status: 'maintenance', updated_at: new Date() }).where(eq(assets.id, asset.id));
        }
      }
    }

    posthog.capture({
      distinctId: _req.user!.userId,
      event: 'maintenance_evaluated',
      properties: { tickets_created: ticketsCreated.length, rules_evaluated: rules.length, assets_scanned: allAssets.length },
    });

    res.json({ data: { tickets_created: ticketsCreated.length, tickets: ticketsCreated } });
  } catch (err) {
    posthog.captureException(err, _req.user?.userId);
    console.error('Maintenance evaluate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function getFieldValue(field: string, asset: typeof assets.$inferSelect): string {
  switch (field) {
    case 'flight_hours': return String(asset.flight_hours ?? '0');
    case 'battery_cycles': return String(asset.battery_cycles ?? 0);
    case 'firmware_version': return asset.firmware_version ?? 'unknown';
    default: return 'unknown';
  }
}

function evaluateRule(
  rule: typeof maintenanceRules.$inferSelect,
  asset: typeof assets.$inferSelect,
): boolean {
  const rawValue = getFieldValue(rule.field, asset);

  switch (rule.operator) {
    case 'gte': {
      const num = Number(rawValue);
      const threshold = Number(rule.threshold_value);
      return !isNaN(num) && !isNaN(threshold) && num >= threshold;
    }
    case 'lte': {
      const num = Number(rawValue);
      const threshold = Number(rule.threshold_value);
      return !isNaN(num) && !isNaN(threshold) && num <= threshold;
    }
    case 'neq': {
      return rawValue !== rule.threshold_value;
    }
    default:
      return false;
  }
}

/* ---------- Tickets ---------- */

// GET /api/maintenance/tickets
router.get('/maintenance/tickets', auth, async (req, res) => {
  try {
    const { status, severity, page = '1', per_page = '50' } = req.query as Record<string, string | undefined>;

    const conditions = [];
    if (status) conditions.push(eq(maintenanceTickets.status, status));
    if (severity) conditions.push(eq(maintenanceTickets.severity, severity));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = Math.min(Number(per_page) || 50, 200);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

    const [rows, [totalRow]] = await Promise.all([
      db.select().from(maintenanceTickets).where(where).limit(limit).offset(offset).orderBy(maintenanceTickets.created_at),
      db.select({ count: count() }).from(maintenanceTickets).where(where),
    ]);

    const total = Number(totalRow?.count ?? 0);
    const currentPage = Math.max(Number(page) || 1, 1);

    res.json({
      data: rows,
      meta: { page: currentPage, per_page: limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Maintenance tickets list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/maintenance/tickets/:id
router.patch('/maintenance/tickets/:id', auth, validate(UpdateTicketSchema), async (req, res) => {
  try {
    const body = req.body as z.infer<typeof UpdateTicketSchema>;
    const id = req.params.id as string;

    const updates: Record<string, unknown> = { ...body, updated_at: new Date() };

    const [ticket] = await db
      .update(maintenanceTickets)
      .set(updates)
      .where(eq(maintenanceTickets.id, id))
      .returning();

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    res.json({ data: ticket });
  } catch (err) {
    console.error('Maintenance ticket update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/maintenance/tickets/:id/complete
router.post('/maintenance/tickets/:id/complete', auth, validate(z.object({
  resolution_notes: z.string().optional(),
})), async (req, res) => {
  try {
    const id = req.params.id as string;
    const { resolution_notes } = req.body as { resolution_notes?: string };

    const [ticket] = await db
      .update(maintenanceTickets)
      .set({
        status: 'complete',
        resolution_notes: resolution_notes ?? null,
        completed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(maintenanceTickets.id, id))
      .returning();

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    posthog.capture({
      distinctId: req.user!.userId,
      event: 'maintenance_ticket_completed',
      properties: { ticket_id: id, asset_id: ticket.asset_id, severity: ticket.severity, ticket_type: ticket.ticket_type },
    });

    // Set asset status back to available
    if (ticket.asset_id) {
      await db
        .update(assets)
        .set({ status: 'available', updated_at: new Date() })
        .where(eq(assets.id, ticket.asset_id));
    }

    res.json({ data: ticket });
  } catch (err) {
    console.error('Maintenance ticket complete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
