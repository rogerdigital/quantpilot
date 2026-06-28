import type { IncomingMessage, ServerResponse } from 'node:http';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 100);

const store = new Map<string, RateLimitEntry>();

/**
 * Periodic eviction of expired entries to prevent unbounded Map growth.
 * A maintenance sweep also runs inline on each request.
 */
const EVICTION_INTERVAL_MS = 5 * 60_000;
let lastEviction = 0;

function evictExpired(now: number): void {
  for (const [ip, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(ip);
    }
  }
}

/**
 * Sliding-window rate limiter keyed by IP address for the native http gateway.
 * Returns true when the request is allowed, false (and writes a 429) when the
 * limit is exceeded.
 */
export function rateLimitHttp(req: IncomingMessage, res: ServerResponse): boolean {
  const now = Date.now();
  if (now - lastEviction > EVICTION_INTERVAL_MS) {
    evictExpired(now);
    lastEviction = now;
  }

  const ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.headers['x-real-ip']?.toString() ||
    'unknown';

  const entry = store.get(ip);
  if (entry && entry.resetAt > now) {
    if (entry.count >= MAX_REQUESTS) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, message: 'Too many requests. Please try again later.' }));
      return false;
    }
    entry.count++;
  } else {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  return true;
}
