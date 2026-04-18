import { Router } from 'express';
import { pool } from '../db/connection.js';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ data: { status: 'ok', db: 'connected', timestamp: new Date().toISOString() } });
  } catch {
    res.status(503).json({ data: { status: 'error', db: 'disconnected', timestamp: new Date().toISOString() } });
  }
});

export default router;
