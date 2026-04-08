import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { apiReference } from '@scalar/express-api-reference';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './lib/logger';
import { openApiSpec } from './docs/openapi';

// Routes
import authRoutes from './modules/auth/auth.routes';
import companiesRoutes from './modules/companies/companies.routes';
import integrationsRoutes from './modules/integrations/integrations.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

const app = express();

// ─── Security ────────────────────────────────────────────────────
// Relax helmet for docs UI
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: [env.CLIENT_URL, 'http://localhost:3000'], credentials: true }));

// ─── Rate limiting ───────────────────────────────────────────────
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many auth requests' }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 500 }));

// ─── Body parsing ────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── HTTP Logging ────────────────────────────────────────────────
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

// ─── API Docs (Scalar) ───────────────────────────────────────────
app.get('/openapi.json', (_req, res) => res.json(openApiSpec));

app.use(
  '/docs',
  apiReference({
    spec: { url: '/openapi.json' },
    theme: 'saturn',
    layout: 'modern',
    defaultHttpClient: { targetKey: 'javascript', clientKey: 'fetch' },
    metaData: { title: 'NexoB2B API Docs' },
  }),
);

// ─── Health check ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Error handler (must be last) ────────────────────────────────
app.use(errorHandler);

export default app;
