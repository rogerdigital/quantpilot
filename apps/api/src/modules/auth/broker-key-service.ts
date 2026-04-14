// @ts-nocheck
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * AES-256-GCM encryption for broker API keys.
 *
 * BROKER_KEY_ENCRYPTION_KEY env var must be a 64-char hex string (32 bytes).
 * In development a deterministic zero-key is used — change before production.
 */
function getEncKey() {
  const hex = process.env.BROKER_KEY_ENCRYPTION_KEY ?? '0'.repeat(64);
  return Buffer.from(hex, 'hex');
}

export function encryptBrokerKey(plaintext) {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', getEncKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptBrokerKey(ciphertext) {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) return ciphertext; // not encrypted, return as-is
  const [ivHex, tagHex, dataHex] = parts;
  try {
    const decipher = createDecipheriv('aes-256-gcm', getEncKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return decipher.update(Buffer.from(dataHex, 'hex')).toString('utf8') + decipher.final('utf8');
  } catch {
    return ciphertext;
  }
}

/** Returns last 4 chars with the rest masked — safe for API responses. */
export function maskBrokerKey(ciphertext) {
  const plaintext = decryptBrokerKey(ciphertext);
  if (plaintext.length <= 4) return '****';
  return `****${plaintext.slice(-4)}`;
}
