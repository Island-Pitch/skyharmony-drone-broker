/** SHD-19: Sponsor management and portal routes. */
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { sponsors, bookingSponsors, bookings } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const CreateSponsorSchema = z.object({
  name: z.string().min(1),
  logo_url: z.string().nullable().optional(),
  campaign_tag: z.string().nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
});

const AttachSponsorSchema = z.object({
  booking_id: z.string().uuid(),
  sponsor_id: z.string().uuid(),
  campaign_name: z.string().nullable().optional(),
});

// GET /api/sponsors — list all sponsors
router.get('/sponsors', auth, async (_req, res) => {
  try {
    const rows = await db.select().from(sponsors);
    res.json({ data: rows });
  } catch (err) {
    console.error('Sponsors list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sponsors — create sponsor (admin only)
router.post(
  '/sponsors',
  auth,
  requireRole('CentralRepoAdmin'),
  validate(CreateSponsorSchema),
  async (req, res) => {
    try {
      const body = req.body as z.infer<typeof CreateSponsorSchema>;
      const [sponsor] = await db
        .insert(sponsors)
        .values({
          name: body.name,
          logo_url: body.logo_url ?? null,
          campaign_tag: body.campaign_tag ?? null,
          contact_email: body.contact_email ?? null,
        })
        .returning();
      res.status(201).json({ data: sponsor });
    } catch (err) {
      console.error('Sponsor create error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// POST /api/sponsors/attach — attach sponsor to booking
router.post(
  '/sponsors/attach',
  auth,
  validate(AttachSponsorSchema),
  async (req, res) => {
    try {
      const body = req.body as z.infer<typeof AttachSponsorSchema>;

      // Verify booking exists
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, body.booking_id))
        .limit(1);
      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      // Verify sponsor exists
      const [sponsor] = await db
        .select()
        .from(sponsors)
        .where(eq(sponsors.id, body.sponsor_id))
        .limit(1);
      if (!sponsor) {
        res.status(404).json({ error: 'Sponsor not found' });
        return;
      }

      const [link] = await db
        .insert(bookingSponsors)
        .values({
          booking_id: body.booking_id,
          sponsor_id: body.sponsor_id,
          campaign_name: body.campaign_name ?? null,
        })
        .returning();

      res.status(201).json({ data: link });
    } catch (err) {
      console.error('Sponsor attach error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/sponsors/report/:bookingId — post-show sponsor report
router.get('/sponsors/report/:bookingId', auth, async (req, res) => {
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

    const links = await db
      .select({
        link_id: bookingSponsors.id,
        campaign_name: bookingSponsors.campaign_name,
        notes: bookingSponsors.notes,
        sponsor_id: sponsors.id,
        sponsor_name: sponsors.name,
        sponsor_logo_url: sponsors.logo_url,
        sponsor_campaign_tag: sponsors.campaign_tag,
        sponsor_contact_email: sponsors.contact_email,
      })
      .from(bookingSponsors)
      .innerJoin(sponsors, eq(bookingSponsors.sponsor_id, sponsors.id))
      .where(eq(bookingSponsors.booking_id, bookingId));

    res.json({
      data: {
        booking: {
          id: booking.id,
          operator_name: booking.operator_name,
          show_date: booking.show_date,
          end_date: booking.end_date,
          drone_count: booking.drone_count,
          location: booking.location,
          status: booking.status,
        },
        sponsors: links.map((l) => ({
          id: l.sponsor_id,
          name: l.sponsor_name,
          logo_url: l.sponsor_logo_url,
          campaign_tag: l.sponsor_campaign_tag,
          contact_email: l.sponsor_contact_email,
          campaign_name: l.campaign_name,
          notes: l.notes,
        })),
      },
    });
  } catch (err) {
    console.error('Sponsor report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sponsors/portal — sponsor-specific portal (SHD-19)
// Returns only shows sponsored by the authenticated user's sponsor record
router.get('/sponsors/portal', auth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // Find sponsor record linked to this user
    const [sponsorRecord] = await db
      .select()
      .from(sponsors)
      .where(eq(sponsors.user_id, userId))
      .limit(1);

    if (!sponsorRecord) {
      res.json({ data: { sponsor: null, shows: [] } });
      return;
    }

    // Get all bookings this sponsor is attached to
    const links = await db
      .select({
        link_id: bookingSponsors.id,
        campaign_name: bookingSponsors.campaign_name,
        notes: bookingSponsors.notes,
        booking_id: bookings.id,
        operator_name: bookings.operator_name,
        show_date: bookings.show_date,
        end_date: bookings.end_date,
        drone_count: bookings.drone_count,
        location: bookings.location,
        status: bookings.status,
      })
      .from(bookingSponsors)
      .innerJoin(bookings, eq(bookingSponsors.booking_id, bookings.id))
      .where(eq(bookingSponsors.sponsor_id, sponsorRecord.id));

    res.json({
      data: {
        sponsor: {
          id: sponsorRecord.id,
          name: sponsorRecord.name,
          logo_url: sponsorRecord.logo_url,
          campaign_tag: sponsorRecord.campaign_tag,
        },
        shows: links.map((l) => ({
          booking_id: l.booking_id,
          operator_name: l.operator_name,
          show_date: l.show_date,
          end_date: l.end_date,
          drone_count: l.drone_count,
          location: l.location,
          status: l.status,
          campaign_name: l.campaign_name,
          report_url: `/api/sponsors/report/${l.booking_id}`,
        })),
      },
    });
  } catch (err) {
    console.error('Sponsor portal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
