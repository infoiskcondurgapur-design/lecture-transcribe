import { get, run } from '../db.js';
import { verifyPassword, hashPassword } from '../lib/auth-utils.js';
import { createSession, destroySession } from '../lib/sessions.js';
import { isAdmin, requireAdmin } from '../middleware.js';
import { rateLimitIp } from '../lib/rate-limit.js';

export async function getAdminHash() {
  return get('SELECT value FROM settings WHERE key = ?', ['admin_password_hash']);
}

export async function ensureAdminHash() {
  const envPw = process.env.ADMIN_PASSWORD;
  if (!envPw) return;
  const row = await getAdminHash();
  const hash = hashPassword(envPw);
  if (!row) {
    await run('INSERT INTO settings (key, value) VALUES (?, ?)', [
      'admin_password_hash',
      hash,
    ]);
  } else if (row.value !== hash) {
    await run('UPDATE settings SET value = ? WHERE key = ?', [
      hash,
      'admin_password_hash',
    ]);
  }
}

export function router(express) {
  const r = express.Router();

  r.post('/login', async (req, res) => {
    const { password } = req.body || {};
    const ip = req.ip || 'unknown';
    if (!rateLimitIp(ip)) {
      return res.status(429).json({ error: 'Too many attempts, try again later' });
    }
    const row = await getAdminHash();
    if (!password || !row || !verifyPassword(password, row.value)) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
    const token = createSession();
    res.cookie('lsid', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: !!process.env.VERCEL,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ ok: true });
  });

  r.post('/logout', (req, res) => {
    destroySession();
    res.clearCookie('lsid');
    res.json({ ok: true });
  });

  r.get('/me', (req, res) => {
    res.json({ authed: isAdmin(req) });
  });

  r.post('/rotate', requireAdmin, async (req, res) => {
    const pw = (req.body && req.body.password) || process.env.ADMIN_PASSWORD;
    if (!pw) return res.status(400).json({ error: 'No password given' });
    await run('UPDATE settings SET value = ? WHERE key = ?', [
      hashPassword(pw),
      'admin_password_hash',
    ]);
    res.json({ ok: true });
  });

  return r;
}