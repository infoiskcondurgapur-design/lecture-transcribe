import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { router as authRouter, ensureAdminHash } from './routes/auth.js';
import { router as lecturesRouter } from './routes/lectures.js';
import { router as uploadRouter } from './routes/upload.js';
import { router as bookmarksRouter } from './routes/bookmarks.js';

const REQUIRED_ENV = ['SESSION_SECRET', 'ADMIN_PASSWORD'];
function validateEnv() {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(', ')}`);
  if (process.env.TURSO_DATABASE_URL && !process.env.TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL is set');
  }
}

export async function createApp() {
  validateEnv();
  await ensureAdminHash();

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));

  const PUBLIC_DIR = path.resolve(import.meta.dirname, 'public');
  app.use(express.static(PUBLIC_DIR));

  app.use('/api/auth', authRouter(express));
  app.use('/api/lectures', lecturesRouter(express));
  app.use('/api/upload', uploadRouter(express));
  app.use('/api/bookmarks', bookmarksRouter(express));

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  });

  return app;
}