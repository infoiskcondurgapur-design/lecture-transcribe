import { all, get, run } from '../db.js';
import { requireAdmin } from '../middleware.js';

const MAXLEN = { title: 200, speaker: 100, type: 50, location: 100, date: 10, duration: 20, audio_file: 500, excerpt: 1000, transcript: 50000 };

function cleanBody(body) {
  const out = {};
  for (const f of FIELDS) {
    let v = body && typeof body[f] === 'string' ? body[f].trim() : '';
    const max = MAXLEN[f] ?? 1000;
    if (v.length > max) v = v.slice(0, max);
    if (f === 'date' && v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const m = v.match(/^(\d{4})?-?(\d{2})?-?(\d{2})?/);
      if (m) {
        const y = m[1];
        const mo = m[2] || '01';
        const d = m[3] || '01';
        v = `${y}-${mo}-${d}`;
      }
    }
    out[f] = v;
  }
  if (!out.speaker) out.speaker = 'Unknown';
  if (!out.type) out.type = 'Lecture';
  if (!out.title) return null;
  return out;
}

function buildQuery(query) {
  const conditions = [];
  const from = ['lectures l'];
  const args = [];
  const { type, location, year, has_audio, q } = query;

  if (type) {
    conditions.push('l.type = ?');
    args.push(type);
  }
  if (location) {
    conditions.push('l.location = ?');
    args.push(location);
  }
  if (year) {
    conditions.push("l.date != '' AND substr(l.date, 1, 4) = ?");
    args.push(year);
  }
  if (has_audio === 'yes') conditions.push("l.audio_file != ''");
  if (has_audio === 'no') conditions.push("l.audio_file = ''");
  if (q) {
    const like = `%${String(q).trim()}%`;
    conditions.push(
      '(l.title LIKE ? OR l.excerpt LIKE ? OR l.transcript LIKE ? OR l.speaker LIKE ?)'
    );
    args.push(like, like, like, like);
  }

  return {
    conditions,
    from: from.join(' '),
    args,
    where: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '',
  };
}

export function router(express) {
  const r = express.Router();

  // GET /api/lectures?type=&location=&year=&has_audio=&q=&page=&limit=
  r.get('/', async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const { conditions, from, args, where } = buildQuery(req.query);

    const total = await get(`SELECT COUNT(*) AS c FROM ${from} ${where}`, args);
    const rows = await all(
      `SELECT l.* FROM ${from} ${where} ORDER BY COALESCE(l.date,'') DESC, l.id DESC LIMIT ? OFFSET ?`,
      [...args, limit, (page - 1) * limit]
    );

    res.json({ records: rows, total: total.c, page, limit });
  });

  r.get('/stats', async (req, res) => {
    const lectures = await get('SELECT COUNT(*) AS c FROM lectures');
    const hasAudio = await get("SELECT COUNT(*) AS c FROM lectures WHERE audio_file != ''");
    const byType = await all('SELECT type, COUNT(*) AS c FROM lectures GROUP BY type ORDER BY c DESC');
    res.json({ lectures: lectures.c, hasAudio: hasAudio.c, byType });
  });

  r.get('/filters', async (req, res) => {
    const types = await all(
      'SELECT type, COUNT(*) AS c FROM lectures GROUP BY type ORDER BY c DESC'
    );
    const years = await all(
      "SELECT DISTINCT substr(date, 1, 4) AS y FROM lectures WHERE date != '' ORDER BY y DESC"
    );
    const locations = await all(
      "SELECT location, COUNT(*) AS c FROM lectures WHERE location != '' GROUP BY location ORDER BY location"
    );
    res.json({ types, years: years.map((x) => x.y), locations });
  });

  r.get('/:id', async (req, res) => {
    const row = await get('SELECT * FROM lectures WHERE id = ?', [Number(req.params.id)]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({ lecture: row });
  });

  r.post('/', requireAdmin, async (req, res) => {
    const data = cleanBody(req.body);
    if (!data) return res.status(400).json({ error: 'Title is required' });
    const info = await run(
      `INSERT INTO lectures (${FIELDS.join(',')}) VALUES (${FIELDS.map(() => '?').join(',')})`,
      FIELDS.map((f) => data[f])
    );
    res.json({ id: info.lastInsertRowid });
  });

  r.put('/:id', requireAdmin, async (req, res) => {
    const data = cleanBody(req.body);
    if (!data) return res.status(400).json({ error: 'Title is required' });
    const sets = FIELDS.map((f) => `${f} = ?`).join(', ');
    const info = await run(
      `UPDATE lectures SET ${sets}, updated_at = datetime('now') WHERE id = ?`,
      [...FIELDS.map((f) => data[f]), Number(req.params.id)]
    );
    if (!info.changes) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  });

  r.delete('/:id', requireAdmin, async (req, res) => {
    const info = await run('DELETE FROM lectures WHERE id = ?', [Number(req.params.id)]);
    if (!info.changes) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  });

  return r;
}