// @ts-nocheck
import { SignJWT, jwtVerify } from 'jose';

function getKey() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'dev-secret-change-in-prod-min-32-chars'
  );
}

export async function signToken(
  payload,
  expiresIn = '8h'
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getKey());
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, getKey());
  return payload;
}
