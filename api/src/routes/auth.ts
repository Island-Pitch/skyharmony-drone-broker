import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { validate } from '../middleware/validate.js';
import { auth, signToken } from '../middleware/auth.js';
import posthog from '../lib/posthog.js';

const router = Router();

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/auth/signup', validate(SignupSchema), async (req, res) => {
  try {
    const { email, password, name } = req.body as z.infer<typeof SignupSchema>;

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({
      email,
      password_hash,
      name,
      role: 'OperatorStaff',
    }).returning();

    const token = signToken({ userId: user!.id, email: user!.email, role: user!.role });

    posthog.capture({
      distinctId: user!.id,
      event: 'user_signed_up',
      properties: {
        $set: { email: user!.email, name: user!.name, role: user!.role },
      },
    });

    res.status(201).json({
      data: {
        token,
        user: { id: user!.id, email: user!.email, name: user!.name, role: user!.role },
      },
    });
  } catch (err) {
    posthog.captureException(err);
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/auth/login', validate(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body as z.infer<typeof LoginSchema>;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    posthog.capture({
      distinctId: user.id,
      event: 'user_logged_in',
      properties: {
        role: user.role,
        onboarded: user.onboarded,
      },
    });

    res.json({
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, onboarded: user.onboarded },
      },
    });
  } catch (err) {
    posthog.captureException(err);
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const OnboardSchema = z.object({
  role: z.enum(['CentralRepoAdmin', 'OperatorAdmin', 'OperatorStaff', 'LogisticsStaff']),
  organization: z.string().min(1),
  region: z.string().min(1),
  fleet_size: z.number().int().nonnegative().optional(),
});

router.post('/auth/onboard', auth, validate(OnboardSchema), async (req, res) => {
  try {
    const { role, organization, region, fleet_size } = req.body as z.infer<typeof OnboardSchema>;

    const [current] = await db.select().from(users).where(eq(users.id, req.user!.userId)).limit(1);
    if (!current) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (current.onboarded === 'true') {
      res.status(403).json({ error: 'Already onboarded' });
      return;
    }
    if (role === 'CentralRepoAdmin' && current.role !== 'CentralRepoAdmin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    if (current.role !== 'CentralRepoAdmin' && role === 'OperatorAdmin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const [user] = await db.update(users)
      .set({ role, organization, region, fleet_size: fleet_size ?? 0, onboarded: 'true', updated_at: new Date() })
      .where(eq(users.id, req.user!.userId))
      .returning();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    posthog.capture({
      distinctId: user.id,
      event: 'user_onboarded',
      properties: {
        role: user.role,
        organization: user.organization,
        region: user.region,
        fleet_size: user.fleet_size,
        $set: { role: user.role, organization: user.organization, region: user.region, fleet_size: user.fleet_size },
      },
    });

    // Issue new token with updated role
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, organization: user.organization, region: user.region, fleet_size: user.fleet_size, onboarded: user.onboarded },
      },
    });
  } catch (err) {
    posthog.captureException(err);
    console.error('Onboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/auth/me', auth, async (req, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      data: { id: user.id, email: user.email, name: user.name, role: user.role, organization: user.organization, region: user.region, fleet_size: user.fleet_size, onboarded: user.onboarded },
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
