import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { cooperativeTerms, auditEvents } from '../db/schema.js';
import { desc, sql } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import posthog from '../lib/posthog.js';

const router = Router();

const CreateTermsSchema = z.object({
  brokerage_pct: z.number().min(0).max(100),
  allocation_fee_per_drone: z.number().min(0),
  standby_fee_per_drone: z.number().min(0),
  insurance_pool_pct: z.number().min(0).max(100),
  net_payment_days: z.number().int().min(1),
  damage_policy: z.string().optional(),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * GET /api/terms/current
 * Returns the latest (highest version) terms record. Authenticated users only.
 */
router.get('/terms/current', auth, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(cooperativeTerms)
      .orderBy(desc(cooperativeTerms.version))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: 'No terms have been configured' });
      return;
    }

    res.json({ data: rows[0] });
  } catch (err) {
    console.error('Terms current error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/terms/history
 * Returns all versions of the terms, most recent first.
 */
router.get('/terms/history', auth, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(cooperativeTerms)
      .orderBy(desc(cooperativeTerms.version));

    res.json({ data: rows });
  } catch (err) {
    console.error('Terms history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/terms
 * Creates a new version of cooperative terms. CentralRepoAdmin only.
 * Logs audit events for each changed field.
 */
router.post(
  '/terms',
  auth,
  requireRole('CentralRepoAdmin'),
  validate(CreateTermsSchema),
  async (req, res) => {
    try {
      const body = req.body as z.infer<typeof CreateTermsSchema>;
      const userId = req.user!.userId;

      // Get current terms for comparison
      const current = await db
        .select()
        .from(cooperativeTerms)
        .orderBy(desc(cooperativeTerms.version))
        .limit(1);

      const prev = current[0] ?? null;
      const nextVersion = prev ? prev.version + 1 : 1;

      // Insert new terms
      const [newTerms] = await db
        .insert(cooperativeTerms)
        .values({
          version: nextVersion,
          brokerage_pct: String(body.brokerage_pct),
          allocation_fee_per_drone: String(body.allocation_fee_per_drone),
          standby_fee_per_drone: String(body.standby_fee_per_drone),
          insurance_pool_pct: String(body.insurance_pool_pct),
          net_payment_days: body.net_payment_days,
          damage_policy: body.damage_policy ?? null,
          effective_date: body.effective_date,
          created_by: userId,
        })
        .returning();

      // Log audit events for changed fields
      const fields = [
        'brokerage_pct',
        'allocation_fee_per_drone',
        'standby_fee_per_drone',
        'insurance_pool_pct',
        'net_payment_days',
        'damage_policy',
        'effective_date',
      ] as const;

      for (const field of fields) {
        const oldVal = prev ? String(prev[field] ?? '') : '';
        const newVal = String(body[field] ?? '');
        if (oldVal !== newVal) {
          await db.insert(auditEvents).values({
            field_changed: `terms.${field}`,
            old_value: oldVal || null,
            new_value: newVal,
            changed_by: userId,
          });
        }
      }

      posthog.capture({
        distinctId: userId,
        event: 'cooperative_terms_updated',
        properties: {
          version: nextVersion,
          brokerage_pct: body.brokerage_pct,
          allocation_fee_per_drone: body.allocation_fee_per_drone,
          insurance_pool_pct: body.insurance_pool_pct,
          effective_date: body.effective_date,
        },
      });

      res.status(201).json({ data: newTerms });
    } catch (err) {
      posthog.captureException(err, req.user?.userId);
      console.error('Terms create error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

/**
 * POST /api/terms/override
 * Blocked — uniform terms are enforced for all partners.
 */
router.post('/terms/override', auth, (_req, res) => {
  res.status(403).json({ error: 'Uniform terms required' });
});

export default router;
