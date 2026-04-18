import express from 'express';
import cors from 'cors';

import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import fleetRouter from './routes/fleet.js';
import bookingsRouter from './routes/bookings.js';
import scanRouter from './routes/scan.js';
import incidentsRouter from './routes/incidents.js';
import allocationRouter from './routes/allocation.js';
import billingRouter from './routes/billing.js';
import logisticsRouter from './routes/logistics.js';
import maintenanceRouter from './routes/maintenance.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:50080'];
const corsOrigins =
  typeof process.env.CORS_ORIGINS === 'string' && process.env.CORS_ORIGINS.trim() !== ''
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : defaultOrigins;

// Global middleware
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

// Routes — all under /api
app.use('/api', healthRouter);
app.use('/api', authRouter);
app.use('/api', fleetRouter);
app.use('/api', bookingsRouter);
app.use('/api', scanRouter);
app.use('/api', incidentsRouter);
app.use('/api', allocationRouter);
app.use('/api', billingRouter);
app.use('/api', logisticsRouter);
app.use('/api', maintenanceRouter);

app.listen(PORT, () => {
  console.log(`SkyHarmony API listening on port ${PORT}`);
});

export default app;
