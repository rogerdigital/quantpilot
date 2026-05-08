// @ts-nocheck

import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';

export async function handleCollaborationRoutes({ req, reqUrl, res, readJsonBody, writeJson, userAccount }) {
  const writeForbidden = (permission, action = '') =>
    writeForbiddenJson(writeJson, res, permission, action);

  const store = controlPlaneRuntime.getStore();
  const collaborationRepo = store.createCollaborationRepository();

  // POST /api/strategies/:id/share - share strategy
  if (
    req.method === 'POST' &&
    reqUrl.pathname.startsWith('/api/strategies/') &&
    reqUrl.pathname.endsWith('/share')
  ) {
    const parts = reqUrl.pathname.split('/');
    const strategyId = parts[parts.length - 2];
    const body = await readJsonBody(req);
    const userId = userAccount?.id || 'anonymous';
    const userName = userAccount?.name || 'Anonymous';

    if (!body.userId || !body.permission) {
      writeJson(res, 400, { ok: false, message: 'userId and permission are required' });
      return true;
    }

    try {
      const share = collaborationRepo.shareStrategy(
        strategyId,
        body.userId,
        body.userName || 'User',
        body.permission,
        userId
      );

      writeJson(res, 200, { ok: true, share });
    } catch (err) {
      writeJson(res, 400, { ok: false, message: err.message });
    }
    return true;
  }

  // DELETE /api/strategies/:id/share/:userId - revoke share
  if (
    req.method === 'DELETE' &&
    reqUrl.pathname.startsWith('/api/strategies/') &&
    reqUrl.pathname.includes('/share/')
  ) {
    const parts = reqUrl.pathname.split('/');
    const strategyId = parts[parts.length - 3];
    const targetUserId = parts[parts.length - 1];

    collaborationRepo.revokeShare(strategyId, targetUserId);
    writeJson(res, 200, { ok: true });
    return true;
  }

  // GET /api/strategies/:id/shares - list shares
  if (
    req.method === 'GET' &&
    reqUrl.pathname.startsWith('/api/strategies/') &&
    reqUrl.pathname.endsWith('/shares')
  ) {
    const parts = reqUrl.pathname.split('/');
    const strategyId = parts[parts.length - 2];

    const shares = collaborationRepo.getShares(strategyId);
    writeJson(res, 200, { ok: true, shares });
    return true;
  }

  // POST /api/strategies/:id/comments - add comment
  if (
    req.method === 'POST' &&
    reqUrl.pathname.startsWith('/api/strategies/') &&
    reqUrl.pathname.endsWith('/comments')
  ) {
    const parts = reqUrl.pathname.split('/');
    const strategyId = parts[parts.length - 2];
    const body = await readJsonBody(req);
    const userId = userAccount?.id || 'anonymous';
    const userName = userAccount?.name || 'Anonymous';

    if (!body.content || body.content.trim().length === 0) {
      writeJson(res, 400, { ok: false, message: 'Comment content is required' });
      return true;
    }

    try {
      const comment = collaborationRepo.addComment(
        strategyId,
        userId,
        userName,
        body.content,
        body.parentId
      );

      writeJson(res, 200, { ok: true, comment });
    } catch (err) {
      writeJson(res, 400, { ok: false, message: err.message });
    }
    return true;
  }

  // GET /api/strategies/:id/comments - list comments
  if (
    req.method === 'GET' &&
    reqUrl.pathname.startsWith('/api/strategies/') &&
    reqUrl.pathname.endsWith('/comments')
  ) {
    const parts = reqUrl.pathname.split('/');
    const strategyId = parts[parts.length - 2];
    const limit = parseInt(reqUrl.searchParams.get('limit') || '50', 10);

    const comments = collaborationRepo.getComments(strategyId, limit);
    writeJson(res, 200, { ok: true, comments });
    return true;
  }

  // POST /api/strategies/comments/:id/resolve - resolve comment
  if (
    req.method === 'POST' &&
    reqUrl.pathname.startsWith('/api/strategies/comments/') &&
    reqUrl.pathname.endsWith('/resolve')
  ) {
    const parts = reqUrl.pathname.split('/');
    const commentId = parts[parts.length - 2];
    const userId = userAccount?.id || 'anonymous';

    try {
      const comment = collaborationRepo.resolveComment(commentId, userId);
      writeJson(res, 200, { ok: true, comment });
    } catch (err) {
      writeJson(res, 400, { ok: false, message: err.message });
    }
    return true;
  }

  // GET /api/strategies/:id/activity - get activity log
  if (
    req.method === 'GET' &&
    reqUrl.pathname.startsWith('/api/strategies/') &&
    reqUrl.pathname.endsWith('/activity')
  ) {
    const parts = reqUrl.pathname.split('/');
    const strategyId = parts[parts.length - 2];
    const limit = parseInt(reqUrl.searchParams.get('limit') || '50', 10);
    const userId = reqUrl.searchParams.get('userId') || undefined;
    const action = reqUrl.searchParams.get('action') || undefined;
    const since = reqUrl.searchParams.get('since') || undefined;

    const activity = collaborationRepo.getActivity(strategyId, limit, { userId, action, since });
    writeJson(res, 200, { ok: true, activity });
    return true;
  }

  return false;
}
