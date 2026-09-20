import crypto from 'node:crypto';

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function secret() {
  return process.env.SESSION_SECRET || 'dev-session-secret-change-me';
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

function createSession() {
  const iat = Date.now();
  const exp = iat + TTL_MS;
  const payload = `${iat}-${crypto.randomBytes(12).toString('hex')}-${exp}`;
  return `${payload}.${sign(payload)}`;
}

function getSession(token) {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expect = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const exp = Number(payload.split('-').pop());
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  return token;
}

function destroySession() {
  /* stateless cookies: nothing to destroy server-side */
}

export { createSession, getSession, destroySession };