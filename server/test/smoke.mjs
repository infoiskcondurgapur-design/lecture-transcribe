import { createApp } from '../app.js';

function listen(app) {
  return new Promise((resolve) => {
    const srv = app.listen(0, () => {
      resolve({ srv, base: `http://localhost:${srv.address().port}` });
    });
  });
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(5000) });
  const body = await res.text();
  try { return JSON.parse(body); } catch { return body; }
}

async function main() {
  let failed = 0;
  const check = (name, cond) => { if (!cond) { console.log('FAIL', name); failed++; } else { console.log('ok', name); } };

  const app = await createApp();
  const { srv, base } = await listen(app);
  try {
  check('meta object', typeof (await fetchJson(base + '/api/upload/meta')) === 'object');
  check('lectures array', Array.isArray((await fetchJson(base + '/api/lectures')).records));
  check('stats numeric', typeof (await fetchJson(base + '/api/lectures/stats')).lectures === 'number');
  check('filters array', Array.isArray((await fetchJson(base + '/api/lectures/filters')).types));
  check('lecture detail', (await fetchJson(base + '/api/lectures/3')).lecture !== undefined);
    check('me unauthed', (await fetchJson(base + '/api/auth/me')).authed === false);
    check('login ok', (await fetchJson(base + '/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: process.env.ADMIN_PASSWORD || 'changeme123' }),
    })).ok === true);
  } finally {
    srv.close();
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
