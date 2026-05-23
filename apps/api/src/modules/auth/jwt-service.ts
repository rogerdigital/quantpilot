import type { JWTPayload } from 'jose';
import { jwtVerify, SignJWT } from 'jose';

function getKey(): Uint8Array {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'dev-secret-change-in-prod-min-32-chars'
  );
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
