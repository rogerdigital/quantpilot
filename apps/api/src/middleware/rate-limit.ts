import type { Context, Next } from 'hono';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 100);

/**
 * Sliding-window rate limiter keyed by IP address.
 * Returns 429 when the limit is exceeded.
 */
export function rateLimit() {
  return async (c: Context, next: Next) => {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown';
    const now = Date.now();
    const entry = store.get(ip);

    if (entry && entry.resetAt > now) {
      if (entry.count >= MAX_REQUESTS) {
        return c.json(
          { ok: false, message: 'Too many requests. Please try again later.' },
          429
        );
      }
      entry.count++;
    } else {
      store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }

    await next();
  };
}
