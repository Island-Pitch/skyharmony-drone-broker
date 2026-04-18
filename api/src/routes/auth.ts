import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { validate } from '../middleware/validate.js';
import { auth, signToken } from '../middleware/auth.js';

const router = Router();

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['CentralRepoAdmin', 'OperatorAdmin', 'OperatorStaff', 'LogisticsStaff', 'SystemAI']).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/auth/signup', validate(SignupSchema), async (req, res) => {
  try {
    const { email, password, name, role } = req.body as z.infer<typeof SignupSchema>;

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
      role: role ?? 'OperatorStaff',
    }).returning();

    const token = signToken({ userId: user!.id, email: user!.email, role: user!.role });
    res.status(201).json({
      data: {
        token,
        user: { id: user!.id, email: user!.email, name: user!.name, role: user!.role },
      },
    });
  } catch (err) {
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
    res.json({
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
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
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
