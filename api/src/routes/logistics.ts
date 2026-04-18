import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { manifests, transportLegs, assets, bookings } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const LOGISTICS_ROLES = ['CentralRepoAdmin', 'LogisticsStaff'];

const CreateManifestSchema = z.object({
  booking_id: z.string().uuid(),
  pickup_location: z.string().min(1),
  delivery_location: z.string().min(1),
  pickup_date: z.string().datetime(),
  delivery_date: z.string().datetime(),
  notes: z.string().optional(),
});

const CreateLegSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  driver_name: z.string().optional(),
  vehicle_info: z.string().optional(),
});

const UpdateLegSchema = z.object({
  status: z.enum(['pending', 'loading', 'in_transit', 'unloading', 'complete']),
  driver_name: z.string().optional(),
  vehicle_info: z.string().optional(),
});

// POST /api/logistics/manifest — create manifest from booking allocation
router.post(
  '/logistics/manifest',
  auth,
  requireRole(...LOGISTICS_ROLES),
  validate(CreateManifestSchema),
  async (req, res) => {
    try {
      const body = req.body as z.infer<typeof CreateManifestSchema>;

      // Look up the booking to get allocated_assets
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, body.booking_id))
        .limit(1);
      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      const allocatedAssets = (booking.allocated_assets as string[]) ?? [];

      const [manifest] = await db
        .insert(manifests)
        .values({
          booking_id: body.booking_id,
          status: 'draft',
          created_by: req.user!.userId,
          assets: allocatedAssets,
          pickup_location: body.pickup_location,
          delivery_location: body.delivery_location,
          pickup_date: new Date(body.pickup_date),
          delivery_date: new Date(body.delivery_date),
          notes: body.notes ?? null,
        })
        .returning();

      res.status(201).json({ data: manifest });
    } catch (err) {
      console.error('Create manifest error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/logistics/manifests — list manifests
router.get('/logistics/manifests', auth, async (req, res) => {
  try {
    const rows = await db.select().from(manifests);
    res.json({ data: rows });
  } catch (err) {
    console.error('List manifests error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/logistics/manifest/:id — single manifest with legs + asset details
router.get('/logistics/manifest/:id', auth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const [manifest] = await db
      .select()
      .from(manifests)
      .where(eq(manifests.id, id))
      .limit(1);

    if (!manifest) {
      res.status(404).json({ error: 'Manifest not found' });
      return;
    }

    const legs = await db
      .select()
      .from(transportLegs)
      .where(eq(transportLegs.manifest_id, id));

    // Fetch asset details for assets in the manifest
    const assetIds = (manifest.assets as string[]) ?? [];
    let assetDetails: (typeof assets.$inferSelect)[] = [];
    if (assetIds.length > 0) {
      assetDetails = await db
        .select()
        .from(assets)
        .where(inArray(assets.id, assetIds));
    }

    res.json({
      data: {
        ...manifest,
        legs: legs.sort((a, b) => a.leg_number - b.leg_number),
        asset_details: assetDetails,
      },
    });
  } catch (err) {
    console.error('Get manifest error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/logistics/manifest/:id/leg — add transport leg
router.post(
  '/logistics/manifest/:id/leg',
  auth,
  requireRole(...LOGISTICS_ROLES),
  validate(CreateLegSchema),
  async (req, res) => {
    try {
      const manifestId = req.params.id as string;
      const body = req.body as z.infer<typeof CreateLegSchema>;

      // Check manifest exists
      const [manifest] = await db
        .select()
        .from(manifests)
        .where(eq(manifests.id, manifestId))
        .limit(1);
      if (!manifest) {
        res.status(404).json({ error: 'Manifest not found' });
        return;
      }

      // Determine next leg number
      const existingLegs = await db
        .select()
        .from(transportLegs)
        .where(eq(transportLegs.manifest_id, manifestId));
      const nextLeg = existingLegs.length + 1;

      const [leg] = await db
        .insert(transportLegs)
        .values({
          manifest_id: manifestId,
          leg_number: nextLeg,
          origin: body.origin,
          destination: body.destination,
          status: 'pending',
          driver_name: body.driver_name ?? null,
          vehicle_info: body.vehicle_info ?? null,
        })
        .returning();

      res.status(201).json({ data: leg });
    } catch (err) {
      console.error('Create leg error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// PATCH /api/logistics/leg/:id — update leg status
router.patch(
  '/logistics/leg/:id',
  auth,
  requireRole(...LOGISTICS_ROLES),
  validate(UpdateLegSchema),
  async (req, res) => {
    try {
      const legId = req.params.id as string;
      const body = req.body as z.infer<typeof UpdateLegSchema>;

      const [existingLeg] = await db
        .select()
        .from(transportLegs)
        .where(eq(transportLegs.id, legId))
        .limit(1);
      if (!existingLeg) {
        res.status(404).json({ error: 'Transport leg not found' });
        return;
      }

      const updates: Record<string, unknown> = { status: body.status };
      if (body.driver_name !== undefined) updates.driver_name = body.driver_name;
      if (body.vehicle_info !== undefined) updates.vehicle_info = body.vehicle_info;

      // Track departure/arrival timestamps
      if (body.status === 'in_transit' && !existingLeg.departed_at) {
        updates.departed_at = new Date();
      }
      if (body.status === 'complete' && !existingLeg.arrived_at) {
        updates.arrived_at = new Date();
      }

      const [updated] = await db
        .update(transportLegs)
        .set(updates)
        .where(eq(transportLegs.id, legId))
        .returning();

      // When a leg departs (in_transit), set manifest assets to in_transit
      if (body.status === 'in_transit' && existingLeg.manifest_id) {
        const [manifest] = await db
          .select()
          .from(manifests)
          .where(eq(manifests.id, existingLeg.manifest_id))
          .limit(1);

        if (manifest) {
          // Update manifest status
          await db
            .update(manifests)
            .set({ status: 'in_transit', updated_at: new Date() })
            .where(eq(manifests.id, manifest.id));

          // Update asset statuses to in_transit
          const assetIds = (manifest.assets as string[]) ?? [];
          if (assetIds.length > 0) {
            await db
              .update(assets)
              .set({ status: 'in_transit', updated_at: new Date() })
              .where(inArray(assets.id, assetIds));
          }
        }
      }

      // When all legs complete, mark manifest as delivered
      if (body.status === 'complete' && existingLeg.manifest_id) {
        const allLegs = await db
          .select()
          .from(transportLegs)
          .where(eq(transportLegs.manifest_id, existingLeg.manifest_id));

        const allComplete = allLegs.every(
          (l) => l.id === legId ? true : l.status === 'complete',
        );
        if (allComplete) {
          await db
            .update(manifests)
            .set({ status: 'delivered', updated_at: new Date() })
            .where(eq(manifests.id, existingLeg.manifest_id));
        }
      }

      res.json({ data: updated });
    } catch (err) {
      console.error('Update leg error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
