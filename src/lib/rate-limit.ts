import db from './db';

db.exec(`
  CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
  );
`);

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return realIp?.trim() || 'unknown';
}

export function checkRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number
) {
  const now = Date.now();
  const key = `${scope}:${getClientIp(request)}`;

  // Cleanup expired entries periodically (10% of requests)
  if (Math.random() < 0.1) {
    try {
      db.prepare('DELETE FROM rate_limits WHERE reset_at <= ?').run(now);
    } catch (e) {
      console.error('Rate limit cleanup error:', e);
    }
  }

  // Retrieve current rate limit status
  const current = db.prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?').get(key) as 
    { count: number; reset_at: number } | undefined;

  if (!current || current.reset_at <= now) {
    const resetAt = now + windowMs;
    db.prepare('INSERT OR REPLACE INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)')
      .run(key, resetAt);
    return { allowed: true as const, remaining: limit - 1, resetAt };
  }

  if (current.count >= limit) {
    return { allowed: false as const, remaining: 0, resetAt: current.reset_at };
  }

  const nextCount = current.count + 1;
  db.prepare('UPDATE rate_limits SET count = ? WHERE key = ?')
    .run(nextCount, key);
  return { allowed: true as const, remaining: limit - nextCount, resetAt: current.reset_at };
}