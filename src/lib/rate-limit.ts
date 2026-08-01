import db from './db';

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return realIp?.trim() || 'unknown';
}

export async function checkRateLimit(
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
      await db.run('DELETE FROM rate_limits WHERE reset_at <= ?', now);
    } catch (e) {
      console.error('Rate limit cleanup error:', e);
    }
  }

  // Retrieve current rate limit status
  const current = await db.get<{ count: number; reset_at: number }>(
    'SELECT count, reset_at FROM rate_limits WHERE key = ?',
    key
  );

  if (!current || current.reset_at <= now) {
    const resetAt = now + windowMs;
    await db.run('INSERT OR REPLACE INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)', key, resetAt);
    return { allowed: true as const, remaining: limit - 1, resetAt };
  }

  if (current.count >= limit) {
    return { allowed: false as const, remaining: 0, resetAt: current.reset_at };
  }

  const nextCount = current.count + 1;
  await db.run('UPDATE rate_limits SET count = ? WHERE key = ?', nextCount, key);
  return { allowed: true as const, remaining: limit - nextCount, resetAt: current.reset_at };
}