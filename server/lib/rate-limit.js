const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const buckets = new Map();

export function rateLimitIp(ip) {
  const now = Date.now();
  const hits = (buckets.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_ATTEMPTS) return false;
  hits.push(now);
  buckets.set(ip, hits);
  if (hits.length > MAX_ATTEMPTS * 2) buckets.set(ip, hits);
  return true;
}

export function clearExpired() {
  const now = Date.now();
  for (const [ip, hits] of buckets) {
    const kept = hits.filter((t) => now - t < WINDOW_MS);
    if (kept.length) buckets.set(ip, kept);
    else buckets.delete(ip);
  }
}

setInterval(clearExpired, 60 * 1000);
