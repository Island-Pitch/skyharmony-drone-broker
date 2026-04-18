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

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Global middleware
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));
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

app.listen(PORT, () => {
  console.log(`SkyHarmony API listening on port ${PORT}`);
});

export default app;
