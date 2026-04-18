import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db/connection.js';
import { users, assets, bookings, invoices, settlements } from '../db/schema.js';
import { eq, and, count, gte } from 'drizzle-orm';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// GET /api/operator/overview — aggregated dashboard view for the current operator
router.get('/operator/overview', auth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // Get the current user's organization
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const organization = currentUser.organization ?? '';

    // Fleet count by status
    const fleetRows = await db
      .select({ status: assets.status, count: count() })
      .from(assets)
      .where(eq(assets.current_operator_id, userId))
      .groupBy(assets.status);

    const fleet_by_status: Record<string, number> = {};
    let fleet_total = 0;
    for (const r of fleetRows) {
      fleet_by_status[r.status] = Number(r.count);
      fleet_total += Number(r.count);
    }

    // Upcoming bookings (show_date >= now)
    const now = new Date();
    const upcomingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.operator_id, userId),
          gte(bookings.show_date, now),
        ),
      );

    // Revenue this month — sum of paid invoices created this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const allInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.operator_id, userId));

    const paidThisMonth = allInvoices.filter(
      (inv) =>
        inv.status === 'paid' &&
        inv.paid_date &&
        new Date(inv.paid_date) >= monthStart,
    );
    const revenue_this_month = paidThisMonth.reduce(
      (sum, inv) => sum + Number(inv.total),
      0,
    );

    // Outstanding balance
    const outstanding_balance = allInvoices
      .filter((inv) => inv.status !== 'paid')
      .reduce((sum, inv) => sum + Number(inv.total), 0);

    // Settlement status
    const operatorSettlements = await db
      .select()
      .from(settlements)
      .where(eq(settlements.operator_id, userId));

    const latest_settlement = operatorSettlements.length > 0
      ? operatorSettlements.sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime(),
        )[0]
      : null;

    // Team size — users in the same organization
    let team_size = 0;
    if (organization) {
      const [teamCount] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.organization, organization));
      team_size = Number(teamCount?.count ?? 0);
    }

    // Recent invoices (last 5)
    const recent_invoices = allInvoices
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime(),
      )
      .slice(0, 5)
      .map((inv) => ({
        id: inv.id,
        total: inv.total,
        status: inv.status,
        due_date: inv.due_date,
        created_at: inv.created_at,
      }));

    res.json({
      data: {
        organization,
        fleet_total,
        fleet_by_status,
        upcoming_bookings: upcomingBookings.slice(0, 5).map((b) => ({
          id: b.id,
          show_date: b.show_date,
          location: b.location,
          drone_count: b.drone_count,
          status: b.status,
        })),
        upcoming_bookings_count: upcomingBookings.length,
        revenue_this_month: Math.round(revenue_this_month * 100) / 100,
        outstanding_balance: Math.round(outstanding_balance * 100) / 100,
        latest_settlement: latest_settlement
          ? {
              id: latest_settlement.id,
              status: latest_settlement.status,
              net_amount: latest_settlement.net_amount,
              period_start: latest_settlement.period_start,
              period_end: latest_settlement.period_end,
            }
          : null,
        team_size,
        recent_invoices,
      },
    });
  } catch (err) {
    console.error('Operator overview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/operator/team — list users in my organization
router.get('/operator/team', auth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUser || !currentUser.organization) {
      res.json({ data: [] });
      return;
    }

    const teamMembers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.organization, currentUser.organization));

    res.json({ data: teamMembers });
  } catch (err) {
    console.error('Operator team error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const InviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['OperatorStaff']).default('OperatorStaff'),
});

// POST /api/operator/team/invite — create user with my organization (OperatorAdmin only)
router.post(
  '/operator/team/invite',
  auth,
  requireRole('OperatorAdmin'),
  validate(InviteSchema),
  async (req, res) => {
    try {
      const userId = req.user!.userId;
      const { email, name, role } = req.body as z.infer<typeof InviteSchema>;

      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!currentUser || !currentUser.organization) {
        res.status(400).json({ error: 'You must belong to an organization to invite team members' });
        return;
      }

      // Check if email already exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing.length > 0) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      // Create user with a temporary password hash
      const tempPassword = await bcrypt.hash('changeme123', 10);
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          name,
          password_hash: tempPassword,
          role,
          organization: currentUser.organization,
          region: currentUser.region,
          onboarded: 'true',
        })
        .returning();

      res.status(201).json({
        data: {
          id: newUser!.id,
          name: newUser!.name,
          email: newUser!.email,
          role: newUser!.role,
          created_at: newUser!.created_at,
        },
      });
    } catch (err) {
      console.error('Operator team invite error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// DELETE /api/operator/team/:userId — remove team member (OperatorAdmin only)
router.delete(
  '/operator/team/:userId',
  auth,
  requireRole('OperatorAdmin'),
  async (req, res) => {
    try {
      const currentUserId = req.user!.userId;
      const targetUserId = req.params.userId as string;

      // Cannot remove yourself
      if (currentUserId === targetUserId) {
        res.status(400).json({ error: 'Cannot remove yourself from the team' });
        return;
      }

      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, currentUserId))
        .limit(1);

      const [targetUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (!targetUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Verify same organization
      if (
        !currentUser?.organization ||
        currentUser.organization !== targetUser.organization
      ) {
        res.status(403).json({ error: 'User is not in your organization' });
        return;
      }

      const [deleted] = await db
        .delete(users)
        .where(eq(users.id, targetUserId))
        .returning();

      res.json({ data: { id: deleted!.id, deleted: true } });
    } catch (err) {
      console.error('Operator team remove error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
