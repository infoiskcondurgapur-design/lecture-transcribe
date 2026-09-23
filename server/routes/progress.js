import { get } from '../db.js';
import { secret } from '../lib/sessions.js';
import crypto from 'node:crypto';

function signIds(ids) {
  const payload = JSON.stringify({ ids });
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function readProgress(req) {
  const raw = req.cookies?.progress;
  if (!raw) return [];
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return [];
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expect = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  if (expect !== sig) return [];
  try {
    const parsed = JSON.parse(payload);
    return Array.isArray(parsed.ids) ? parsed.ids : [];
  } catch {
    return [];
  }
}

function setProgressCookie(res, ids) {
  const value = signIds(ids);
  res.cookie('progress', value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !!process.env.VERCEL,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export async function getProgressIds(req) {
  return readProgress(req);
}

export function router(express) {
  const r = express.Router();

  r.get('/', async (req, res) => {
    const ids = readProgress(req);
    res.json({ ids });
  });

  r.post('/', async (req, res) => {
    const id = Number(req.body?.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const exists = await get('SELECT id FROM lectures WHERE id = ?', [id]);
    if (!exists) return res.status(404).json({ error: 'Lecture not found' });
    const ids = readProgress(req);
    const idx = ids.indexOf(id);
    if (idx >= 0) {
      ids.splice(idx, 1);
    } else {
      ids.push(id);
    }
    setProgressCookie(res, ids);
    res.json({ ids });
  });

  return r;
}
