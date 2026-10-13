import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

import analysisRoutes from './routes/analysisRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security headers
app.use(helmet());

// CORS — allow the configured frontend origin
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// JSON body parser (for non-multipart routes)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting — 100 requests per 15 minutes on /api
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in 15 minutes.' },
});
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/analysis', analysisRoutes);
app.use('/api/history', historyRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
