import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { assets, custodyEvents } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const LookupSchema = z.object({
  serial_number: z.string().min(1),
});

const CheckoutSchema = z.object({
  serial_number: z.string().min(1),
  booking_id: z.string().uuid().optional(),
  mac_address: z.string().optional(),
});

const CheckinSchema = z.object({
  serial_number: z.string().min(1),
  mac_address: z.string().optional(),
});

// POST /api/scan/lookup
router.post('/scan/lookup', auth, validate(LookupSchema), async (req, res) => {
  try {
    const { serial_number } = req.body as z.infer<typeof LookupSchema>;
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.serial_number, serial_number))
      .limit(1);

    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json({ data: asset });
  } catch (err) {
    console.error('Scan lookup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/scan/checkout
router.post('/scan/checkout', auth, validate(CheckoutSchema), async (req, res) => {
  try {
    const { serial_number, booking_id, mac_address } = req.body as z.infer<typeof CheckoutSchema>;

    const result = await db.transaction(async (tx) => {
      const [asset] = await tx
        .select()
        .from(assets)
        .where(eq(assets.serial_number, serial_number))
        .for('update')
        .limit(1);

      if (!asset) {
        return { ok: false as const, code: 'not_found' as const };
      }

      if (asset.status !== 'available') {
        return { ok: false as const, code: 'unavailable' as const, status: asset.status };
      }

      const [updated] = await tx
        .update(assets)
        .set({ status: 'allocated', current_operator_id: req.user!.userId, updated_at: new Date() })
        .where(eq(assets.id, asset.id))
        .returning();

      await tx.insert(custodyEvents).values({
        asset_id: asset.id,
        action: 'check_out',
        actor_id: req.user!.userId,
        booking_id: booking_id ?? null,
        mac_address: mac_address ?? null,
      });

      return { ok: true as const, data: updated };
    });

    if (!result.ok) {
      if (result.code === 'not_found') {
        res.status(404).json({ error: 'Asset not found' });
        return;
      }
      res.status(422).json({ error: `Asset is not available (current status: ${result.status})` });
      return;
    }

    res.json({ data: result.data });
  } catch (err) {
    console.error('Scan checkout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/scan/checkin
router.post('/scan/checkin', auth, validate(CheckinSchema), async (req, res) => {
  try {
    const { serial_number, mac_address } = req.body as z.infer<typeof CheckinSchema>;

    const result = await db.transaction(async (tx) => {
      const [asset] = await tx
        .select()
        .from(assets)
        .where(eq(assets.serial_number, serial_number))
        .for('update')
        .limit(1);

      if (!asset) {
        return { ok: false as const, code: 'not_found' as const };
      }

      if (asset.status === 'maintenance' || asset.status === 'retired') {
        return {
          ok: false as const,
          code: 'blocked_status' as const,
          status: asset.status,
        };
      }

      const [updated] = await tx
        .update(assets)
        .set({ status: 'available', current_operator_id: null, updated_at: new Date() })
        .where(eq(assets.id, asset.id))
        .returning();

      await tx.insert(custodyEvents).values({
        asset_id: asset.id,
        action: 'check_in',
        actor_id: req.user!.userId,
        mac_address: mac_address ?? null,
      });

      return { ok: true as const, data: updated };
    });

    if (!result.ok) {
      if (result.code === 'not_found') {
        res.status(404).json({ error: 'Asset not found' });
        return;
      }
      res.status(422).json({ error: `Cannot check in asset while status is '${result.status}'` });
      return;
    }

    res.json({ data: result.data });
  } catch (err) {
    console.error('Scan checkin error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
