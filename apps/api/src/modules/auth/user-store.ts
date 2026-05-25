import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { loadMap, persistMap } from '../../lib/persist.js';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'suspended' | 'pending';
  mfaEnabled: boolean;
  mfaSecret?: string;
  recoveryCodes: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
  refreshExpiresAt: string;
  createdAt: string;
  revokedAt?: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
}

const users = new Map<string, User>();
const sessions = new Map<string, Session>();
const resetTokens = new Map<string, PasswordResetToken>();
const emailIndex = new Map<string, string>();

loadMap<string, User>('users.json', users);
loadMap<string, Session>('sessions.json', sessions);
loadMap<string, PasswordResetToken>('reset-tokens.json', resetTokens);
for (const [id, user] of users) {
  emailIndex.set(user.email, id);
}

function save() {
  persistMap('users.json', users);
  persistMap('sessions.json', sessions);
  persistMap('reset-tokens.json', resetTokens);
}

export function seedDefaultAdmin() {
  if (users.size > 0) return;
  const salt = generateSalt();
  const user: User = {
    id: 'user-default-admin',
    email: 'admin@quantpilot.local',
    passwordHash: hashPassword('changeme', salt),
    salt,
    name: 'Admin',
    role: 'owner',
    status: 'active',
    mfaEnabled: false,
    recoveryCodes: Array.from({ length: 8 }, () => randomBytes(4).toString('hex')),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  users.set(user.id, user);
  emailIndex.set(user.email, user.id);
  save();
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex');
}

function generateSalt(): string {
  return randomBytes(32).toString('hex');
}

function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8)
    return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password))
    return { valid: false, message: 'Password must contain an uppercase letter' };
  if (!/[a-z]/.test(password))
    return { valid: false, message: 'Password must contain a lowercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain a digit' };
  return { valid: true };
}

export function createUser(
  email: string,
  password: string,
  name: string
): User | { error: string } {
  if (emailIndex.has(email.toLowerCase())) {
    return { error: 'Email already registered' };
  }

  const strength = validatePasswordStrength(password);
  if (!strength.valid) return { error: strength.message! };

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  const recoveryCodes = Array.from({ length: 8 }, () => randomBytes(4).toString('hex'));

  const user: User = {
    id: `user-${Date.now()}`,
    email: email.toLowerCase(),
    passwordHash,
    salt,
    name,
    role: 'member',
    status: 'active',
    mfaEnabled: false,
    recoveryCodes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.set(user.id, user);
  emailIndex.set(user.email, user.id);
  save();
  return user;
}

export function authenticateUser(email: string, password: string): User | null {
  const userId = emailIndex.get(email.toLowerCase());
  if (!userId) return null;

  const user = users.get(userId);
  if (!user || user.status !== 'active') return null;

  const hash = hashPassword(password, user.salt);
  const hashBuffer = Buffer.from(hash, 'hex');
  const storedBuffer = Buffer.from(user.passwordHash, 'hex');

  if (!timingSafeEqual(hashBuffer, storedBuffer)) return null;

  user.lastLoginAt = new Date().toISOString();
  user.updatedAt = new Date().toISOString();
  save();
  return user;
}

export function getUserById(userId: string): User | null {
  return users.get(userId) ?? null;
}

export function getUserByEmail(email: string): User | null {
  const userId = emailIndex.get(email.toLowerCase());
  return userId ? (users.get(userId) ?? null) : null;
}

export function createSession(
  userId: string,
  token: string,
  refreshToken: string,
  expiresInMs: number = 8 * 60 * 60 * 1000
): Session {
  const now = new Date();
  const session: Session = {
    id: `session-${Date.now()}`,
    userId,
    token,
    refreshToken,
    expiresAt: new Date(now.getTime() + expiresInMs).toISOString(),
    refreshExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: now.toISOString(),
  };
  sessions.set(session.id, session);
  save();
  return session;
}

export function getSessionByToken(token: string): Session | null {
  for (const session of sessions.values()) {
    if (session.token === token && !session.revokedAt) {
      if (new Date(session.expiresAt) > new Date()) return session;
    }
  }
  return null;
}

export function getSessionByRefreshToken(refreshToken: string): Session | null {
  for (const session of sessions.values()) {
    if (session.refreshToken === refreshToken && !session.revokedAt) {
      if (new Date(session.refreshExpiresAt) > new Date()) return session;
    }
  }
  return null;
}

export function revokeSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  session.revokedAt = new Date().toISOString();
  save();
  return true;
}

export function revokeAllUserSessions(userId: string): number {
  let count = 0;
  for (const session of sessions.values()) {
    if (session.userId === userId && !session.revokedAt) {
      session.revokedAt = new Date().toISOString();
      count++;
      save();
    }
  }
  return count;
}

export function createPasswordResetToken(userId: string): PasswordResetToken {
  const token = randomBytes(32).toString('hex');
  const resetToken: PasswordResetToken = {
    id: `reset-${Date.now()}`,
    userId,
    token,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
  resetTokens.set(resetToken.id, resetToken);
  save();
  return resetToken;
}

export function validatePasswordResetToken(token: string): PasswordResetToken | null {
  for (const resetToken of resetTokens.values()) {
    if (resetToken.token === token && !resetToken.usedAt) {
      if (new Date(resetToken.expiresAt) > new Date()) return resetToken;
    }
  }
  return null;
}

export function usePasswordResetToken(
  token: string,
  newPassword: string
): User | { error: string } {
  const resetToken = validatePasswordResetToken(token);
  if (!resetToken) return { error: 'Invalid or expired reset token' };

  const user = users.get(resetToken.userId);
  if (!user) return { error: 'User not found' };

  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) return { error: strength.message! };

  const salt = generateSalt();
  user.passwordHash = hashPassword(newPassword, salt);
  user.salt = salt;
  user.updatedAt = new Date().toISOString();
  resetToken.usedAt = new Date().toISOString();
  save();

  return user;
}

export function enableMfa(userId: string, secret: string): User | null {
  const user = users.get(userId);
  if (!user) return null;
  user.mfaEnabled = true;
  user.mfaSecret = secret;
  user.updatedAt = new Date().toISOString();
  save();
  return user;
}

export function verifyMfa(_userId: string, _code: string): boolean {
  return false;
}

export function useRecoveryCode(userId: string, code: string): boolean {
  const user = users.get(userId);
  if (!user) return false;
  const index = user.recoveryCodes.indexOf(code);
  if (index === -1) return false;
  user.recoveryCodes.splice(index, 1);
  user.updatedAt = new Date().toISOString();
  save();
  return true;
}

export function getUserCount(): number {
  return users.size;
}
