import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import posthog from './lib/posthog.js';

import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import fleetRouter from './routes/fleet.js';
import bookingsRouter from './routes/bookings.js';
import scanRouter from './routes/scan.js';
import incidentsRouter from './routes/incidents.js';
import allocationRouter from './routes/allocation.js';
import billingRouter from './routes/billing.js';
import invoicesRouter from './routes/invoices.js';
import logisticsRouter from './routes/logistics.js';
import maintenanceRouter from './routes/maintenance.js';
import telemetryRouter from './routes/telemetry.js';
import settlementsRouter from './routes/settlements.js';
import analyticsRouter from './routes/analytics.js';
import operatorRouter from './routes/operator.js';
import sponsorsRouter from './routes/sponsors.js';
import termsRouter from './routes/terms.js';
import forecastingRouter from './routes/forecasting.js';
import routesRouter from './routes/routes.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Behind a reverse proxy (e.g., container ingress), trust one hop for correct client IP detection.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:50080'];
const corsOrigins =
  typeof process.env.CORS_ORIGINS === 'string' && process.env.CORS_ORIGINS.trim() !== ''
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : defaultOrigins;

// Request ID middleware — attach unique ID to every request for log correlation
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
});

// Security headers
app.use(helmet());

// CORS + body parsing
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

// Global rate limit: 100 requests per minute per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
}));

// Routes — all under /api
app.use('/api', healthRouter);
app.use('/api', authRouter);
app.use('/api', fleetRouter);
app.use('/api', bookingsRouter);
app.use('/api', scanRouter);
app.use('/api', incidentsRouter);
app.use('/api', allocationRouter);
app.use('/api', billingRouter);
app.use('/api', invoicesRouter);
app.use('/api', logisticsRouter);
app.use('/api', maintenanceRouter);
app.use('/api', telemetryRouter);
app.use('/api', settlementsRouter);
app.use('/api', analyticsRouter);
app.use('/api', operatorRouter);
app.use('/api', sponsorsRouter);
app.use('/api', termsRouter);
app.use('/api', forecastingRouter);
app.use('/api', routesRouter);

// Global error handler — catch anything that slips through route-level handlers
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const distinctId = (req as any).user?.userId;
  posthog.captureException(err, distinctId);
  console.error(JSON.stringify({
    level: 'error',
    message: 'Unhandled API error',
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    requestId: req.requestId,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  }));
  res.status(500).json({ error: 'Internal server error', requestId: req.requestId });
});

app.listen(PORT, () => {
  console.log(`SkyHarmony API listening on port ${PORT}`);
});

export default app;
