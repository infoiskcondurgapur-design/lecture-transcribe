import { getSession } from './lib/sessions.js';

export function isAdmin(req) {
  const token = req.cookies && req.cookies.lsid;
  return !!getSession(token);
}

export function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  return res.status(401).json({ error: 'Not authorized' });
}