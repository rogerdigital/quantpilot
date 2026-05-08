// @ts-nocheck
import { createHash } from 'node:crypto';
import { signToken, verifyToken } from '../../../modules/auth/jwt-service.js';
import { listPermissionDescriptors } from '../../../modules/auth/permission-catalog.js';
import { getSession } from '../../../modules/auth/service.js';
import {
  authenticateUser,
  createPasswordResetToken,
  createSession,
  createUser,
  getSessionByRefreshToken,
  getUserById,
  revokeAllUserSessions,
  revokeSession,
  usePasswordResetToken,
} from '../../../modules/auth/user-store.js';

function sha256hex(value) {
  return createHash('sha256').update(value).digest('hex');
}

export async function handleAuthRoutes({ req, reqUrl, res, readJsonBody, writeJson }) {
  if (req.method === 'GET' && reqUrl.pathname === '/api/auth/session') {
    writeJson(res, 200, getSession());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/auth/permissions') {
    writeJson(res, 200, { ok: true, permissions: listPermissionDescriptors() });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/auth/register') {
    const body = await readJsonBody(req);
    const { email, password, name } = body || {};

    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
      writeJson(res, 400, { ok: false, message: 'Missing required fields: email, password, name' });
      return true;
    }

    const result = createUser(email, password, name);
    if ('error' in result) {
      writeJson(res, 400, { ok: false, message: result.error });
      return true;
    }

    const permissions = ['dashboard:read', 'strategy:write', 'risk:review'];
    const token = await signToken({ userId: result.id, permissions }, '8h');
    const refreshToken = await signToken({ userId: result.id, type: 'refresh' }, '7d');
    createSession(result.id, token, refreshToken);

    writeJson(res, 201, {
      ok: true,
      user: { id: result.id, email: result.email, name: result.name, role: result.role },
      token,
      refreshToken,
    });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/auth/login') {
    const body = await readJsonBody(req);
    const { username, password, email } = body || {};

    // Support both legacy username and new email login
    const loginId = email || username;

    if (typeof loginId !== 'string' || typeof password !== 'string') {
      writeJson(res, 400, { ok: false, message: 'Missing credentials' });
      return true;
    }

    // Try user store first
    const user = authenticateUser(loginId, password);
    if (user) {
      const permissions = [
        'dashboard:read',
        'strategy:write',
        'risk:review',
        'execution:approve',
        'account:write',
      ];
      const token = await signToken({ userId: user.id, permissions }, '8h');
      const refreshToken = await signToken({ userId: user.id, type: 'refresh' }, '7d');
      createSession(user.id, token, refreshToken);

      writeJson(res, 200, {
        ok: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token,
        refreshToken,
      });
      return true;
    }

    // Fallback to legacy demo auth
    const expectedUsername = process.env.DEMO_USERNAME ?? 'admin';
    const expectedPasswordHash = sha256hex(process.env.DEMO_PASSWORD ?? 'changeme');

    if (loginId !== expectedUsername || sha256hex(password) !== expectedPasswordHash) {
      writeJson(res, 401, { ok: false, message: 'Invalid credentials' });
      return true;
    }

    const permissions = [
      'dashboard:read',
      'strategy:write',
      'risk:review',
      'execution:approve',
      'account:write',
    ];
    const expiresIn = '8h';
    const token = await signToken({ userId: loginId, permissions }, expiresIn);
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    writeJson(res, 200, { ok: true, token, expiresAt });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/auth/refresh') {
    const body = await readJsonBody(req);
    const { refreshToken } = body || {};

    if (typeof refreshToken !== 'string') {
      writeJson(res, 400, { ok: false, message: 'Missing refreshToken' });
      return true;
    }

    const session = getSessionByRefreshToken(refreshToken);
    if (!session) {
      writeJson(res, 401, { ok: false, message: 'Invalid or expired refresh token' });
      return true;
    }

    const user = getUserById(session.userId);
    if (!user) {
      writeJson(res, 401, { ok: false, message: 'User not found' });
      return true;
    }

    // Rotate tokens
    revokeSession(session.id);
    const permissions = [
      'dashboard:read',
      'strategy:write',
      'risk:review',
      'execution:approve',
      'account:write',
    ];
    const newToken = await signToken({ userId: user.id, permissions }, '8h');
    const newRefreshToken = await signToken({ userId: user.id, type: 'refresh' }, '7d');
    createSession(user.id, newToken, newRefreshToken);

    writeJson(res, 200, { ok: true, token: newToken, refreshToken: newRefreshToken });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/auth/logout') {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = await verifyToken(authHeader.slice(7));
        if (payload.userId) {
          revokeAllUserSessions(String(payload.userId));
        }
      } catch {
        // Token invalid, still return success
      }
    }
    writeJson(res, 200, { ok: true, message: 'Logged out' });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/auth/password-reset') {
    const body = await readJsonBody(req);
    const { email, token, newPassword } = body || {};

    // Request reset
    if (email && !token) {
      const { getUserByEmail } = await import('../../../modules/auth/user-store.js');
      const user = getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        writeJson(res, 200, {
          ok: true,
          message: 'If the email exists, a reset link has been sent',
        });
        return true;
      }
      const resetToken = createPasswordResetToken(user.id);
      // In production, send email with resetToken.token
      writeJson(res, 200, {
        ok: true,
        message: 'If the email exists, a reset link has been sent',
        debug_token: resetToken.token,
      });
      return true;
    }

    // Confirm reset
    if (token && newPassword) {
      const result = usePasswordResetToken(token, newPassword);
      if ('error' in result) {
        writeJson(res, 400, { ok: false, message: result.error });
        return true;
      }
      writeJson(res, 200, { ok: true, message: 'Password reset successfully' });
      return true;
    }

    writeJson(res, 400, { ok: false, message: 'Missing email or token+newPassword' });
    return true;
  }

  // Team management routes
  if (req.method === 'POST' && reqUrl.pathname === '/api/auth/teams') {
    const body = await readJsonBody(req);
    const { name, description } = body || {};
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      writeJson(res, 401, { ok: false, message: 'Authentication required' });
      return true;
    }

    const { createTeam } = await import('../../../modules/auth/team-store.js');
    const team = createTeam(name || 'My Team', description || '', 'current-user');
    writeJson(res, 201, { ok: true, team });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/auth/teams') {
    const { getUserTeams } = await import('../../../modules/auth/team-store.js');
    const userTeams = getUserTeams('current-user');
    writeJson(res, 200, { ok: true, teams: userTeams });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/auth/teams/invite') {
    const body = await readJsonBody(req);
    const { teamId, email, role } = body || {};
    if (!teamId || !email) {
      writeJson(res, 400, { ok: false, message: 'Missing teamId or email' });
      return true;
    }

    const { createInvite } = await import('../../../modules/auth/team-store.js');
    const invite = createInvite(teamId, email, role || 'member', 'current-user');
    writeJson(res, 201, { ok: true, invite });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/auth/teams/accept') {
    const body = await readJsonBody(req);
    const { token } = body || {};
    if (!token) {
      writeJson(res, 400, { ok: false, message: 'Missing invite token' });
      return true;
    }

    const { acceptInvite, addTeamMember } = await import('../../../modules/auth/team-store.js');
    const invite = acceptInvite(token);
    if (!invite) {
      writeJson(res, 400, { ok: false, message: 'Invalid or expired invite' });
      return true;
    }

    addTeamMember(invite.teamId, 'current-user', invite.role, invite.invitedBy);
    writeJson(res, 200, { ok: true, message: 'Invite accepted' });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/auth/api-keys') {
    const body = await readJsonBody(req);
    const { teamId, name, permissions, expiresInDays } = body || {};
    if (!teamId || !name) {
      writeJson(res, 400, { ok: false, message: 'Missing teamId or name' });
      return true;
    }

    const { createApiKey } = await import('../../../modules/auth/team-store.js');
    const apiKey = createApiKey(
      teamId,
      name,
      permissions || ['read'],
      'current-user',
      expiresInDays
    );
    writeJson(res, 201, {
      ok: true,
      apiKey: { id: apiKey.id, name: apiKey.name, key: apiKey.key },
    });
    return true;
  }

  return false;
}
