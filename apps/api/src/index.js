import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.js';
import customerRoutes from './routes/customers.js';
import invoiceRoutes from './routes/invoices.js';
import paymentRoutes from './routes/payments.js';
import whatsappRoutes from './routes/whatsapp.js';
import utilityRoutes from './routes/utilities.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.APP_URL, credentials: true }));

app.use((req, _res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    express.json()(req, _res, next);
  }
});

app.get('/', (_req, res) => {
  res.json({ name: 'SpicaPay API v2', status: 'ok' });
});

app.use('/api/health', healthRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/utilities', utilityRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: error.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
