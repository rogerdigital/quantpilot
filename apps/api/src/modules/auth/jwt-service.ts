import type { JWTPayload } from 'jose';
import { jwtVerify, SignJWT } from 'jose';

/**
 * Resolve the JWT signing key from the environment.
 *
 * No hardcoded fallback: callers that present a token must have it validated
 * against a real secret. A missing secret only matters when a token is
 * actually presented (authenticate() skips verification when no Authorization
 * header is sent), so we throw lazily rather than failing at module load —
 * this keeps local-first unauthenticated usage working.
 */
function getKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured; token verification is unavailable.');
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(
  payload: Record<string, unknown>,
  expiresIn = '8h'
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getKey());
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getKey());
  return payload;
}
