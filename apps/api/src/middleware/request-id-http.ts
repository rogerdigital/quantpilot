import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Inject a request id into the response. Reuses an inbound `X-Request-Id`
 * header when present, otherwise generates a fresh UUID.
 *
 * Returns the resolved request id so callers (logging, error responses) can
 * reference it.
 */
export function requestIdHttp(req: IncomingMessage, res: ServerResponse): string {
  const reqId = req.headers['x-request-id']?.toString() || randomUUID();
  res.setHeader('X-Request-Id', reqId);
  return reqId;
}
