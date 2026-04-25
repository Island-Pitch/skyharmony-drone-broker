import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { validate } from '../middleware/validate.js';
import { auth, signToken } from '../middleware/auth.js';
import posthog from '../lib/posthog.js';
import { sendEmail } from '../lib/email.js';

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
      res.status(409).json({ error: 'Email already registered', code: 'EMAIL_TAKEN' });
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
    const isPrivilegedRole = role === 'CentralRepoAdmin' || role === 'OperatorAdmin';
    const allowSelfAssignPrivilegedRoles = process.env.ALLOW_SELF_ASSIGN_PRIVILEGED_ROLES === 'true';
    if (isPrivilegedRole && !allowSelfAssignPrivilegedRoles) {
      res.status(403).json({ error: 'Role not permitted' });
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

/* ------------------------------------------------------------------ */
/*  Forgot password                                                    */
/* ------------------------------------------------------------------ */

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

router.post('/auth/forgot-password', validate(ForgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body as z.infer<typeof ForgotPasswordSchema>;
    const genericMessage = 'If an account with that email exists, a reset link has been sent.';

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.update(users)
        .set({ reset_token: token, reset_token_expires_at: expiresAt, updated_at: new Date() })
        .where(eq(users.id, user.id));

      const appUrl = process.env.APP_URL || 'http://localhost:5173';
      const resetUrl = `${appUrl}/reset-password?token=${token}`;

      console.log(`[AUTH] Password reset link for ${email}: ${resetUrl}`);

      await sendEmail(email, 'SkyHarmony — Reset Your Password', `
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your password. Click the link below to set a new one:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
        <p style="margin-top:24px;padding:12px;background:#f5f0e6;border-radius:8px;font-size:13px;color:#555;">
          Found this in spam? We're a young cooperative and some email providers are still learning to trust us.
          Marking this message "not spam" helps the whole formation fly together — thank you for being part of it.
        </p>
        <p>— SkyHarmony</p>
      `);

      posthog.capture({ distinctId: user.id, event: 'password_reset_requested' });

      if (process.env.NODE_ENV !== 'production') {
        res.json({ message: genericMessage, data: { resetUrl } });
        return;
      }
    }

    res.json({ message: genericMessage });
  } catch (err) {
    posthog.captureException(err);
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  Reset password                                                     */
/* ------------------------------------------------------------------ */

const ResetPasswordSchema = z.object({
  token: z.string().length(64),
  password: z.string().min(6),
});

router.post('/auth/reset-password', validate(ResetPasswordSchema), async (req, res) => {
  try {
    const { token, password } = req.body as z.infer<typeof ResetPasswordSchema>;
    const invalidMessage = 'Invalid or expired reset token';

    const [user] = await db.select().from(users).where(eq(users.reset_token, token)).limit(1);
    if (!user || !user.reset_token) {
      res.status(400).json({ error: invalidMessage });
      return;
    }

    // Timing-safe comparison
    const tokenMatch = crypto.timingSafeEqual(
      Buffer.from(user.reset_token),
      Buffer.from(token),
    );
    if (!tokenMatch) {
      res.status(400).json({ error: invalidMessage });
      return;
    }

    if (!user.reset_token_expires_at || user.reset_token_expires_at < new Date()) {
      res.status(400).json({ error: invalidMessage });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    await db.update(users)
      .set({ password_hash, reset_token: null, reset_token_expires_at: null, updated_at: new Date() })
      .where(eq(users.id, user.id));

    posthog.capture({ distinctId: user.id, event: 'password_reset_completed' });

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    posthog.captureException(err);
    console.error('Reset password error:', err);
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
