import type { GatewayRouteContext } from '../types.js';
import { PromotionStore } from '../../../../../../packages/control-plane-store/src/promotion-store.js';

const store = new PromotionStore();

export function handlePromotionRoutes({ req, reqUrl, res, readJsonBody, writeJson }: GatewayRouteContext) {
  const pathname = reqUrl.pathname;

  if (req.method === 'GET' && pathname === '/api/promotions') {
    const strategyId = reqUrl.searchParams?.get('strategyId');
    const list = strategyId ? store.listByStrategy(strategyId) : store.list();
    writeJson(res, 200, { ok: true, promotions: list });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/promotions') {
    return (async () => {
      const body = (await readJsonBody(req)) as Record<string, any> | undefined;
      if (!body?.strategyCandidateId || !body?.strategyVersionId || !body?.requestedBy) {
        writeJson(res, 400, {
          ok: false,
          error: 'Missing required fields: strategyCandidateId, strategyVersionId, requestedBy',
        });
        return true;
      }
      const request = {
        id: `promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        strategyCandidateId: body.strategyCandidateId,
        strategyVersionId: body.strategyVersionId,
        status: 'draft',
        gates: [],
        decisions: [],
        requestedBy: body.requestedBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: body.metadata || {},
      };
      const created = store.create(request as any);
      writeJson(res, 201, { ok: true, promotion: created });
      return true;
    })();
  }

  const idMatch = pathname.match(/^\/api\/promotions\/([^/]+)$/);
  if (idMatch && req.method === 'GET') {
    const promotion = store.get(idMatch[1]);
    if (!promotion) {
      writeJson(res, 404, { ok: false, error: 'Promotion not found' });
      return true;
    }
    writeJson(res, 200, { ok: true, promotion });
    return true;
  }

  const submitMatch = pathname.match(/^\/api\/promotions\/([^/]+)\/submit$/);
  if (submitMatch && req.method === 'POST') {
    const result = store.submit(submitMatch[1]);
    if (!result) {
      writeJson(res, 404, { ok: false, error: 'Promotion not found' });
      return true;
    }
    writeJson(res, 200, { ok: true, promotion: result });
    return true;
  }

  const approvePaperMatch = pathname.match(/^\/api\/promotions\/([^/]+)\/approve-paper$/);
  if (approvePaperMatch && req.method === 'POST') {
    return (async () => {
      const body = (await readJsonBody(req)) as Record<string, any> | undefined;
      if (!body?.actor || !body?.reason) {
        writeJson(res, 400, { ok: false, error: 'Missing actor or reason' });
        return true;
      }
      const decision = {
        id: `dec-${Date.now()}`,
        promotionRequestId: approvePaperMatch[1],
        actor: body.actor,
        actorType: body.actorType || 'human',
        role: body.role || 'reviewer',
        action: 'approve_paper',
        reason: body.reason,
        evidenceLinks: body.evidenceLinks || [],
        timestamp: new Date().toISOString(),
        metadata: {},
      };
      const result = store.approvePaper(approvePaperMatch[1], decision as any);
      if (!result) {
        writeJson(res, 409, { ok: false, error: 'Cannot approve paper from current state' });
        return true;
      }
      writeJson(res, 200, { ok: true, promotion: result });
      return true;
    })();
  }

  const approveLiveMatch = pathname.match(/^\/api\/promotions\/([^/]+)\/approve-live$/);
  if (approveLiveMatch && req.method === 'POST') {
    return (async () => {
      const body = (await readJsonBody(req)) as Record<string, any> | undefined;
      if (!body?.actor || !body?.reason) {
        writeJson(res, 400, { ok: false, error: 'Missing actor or reason' });
        return true;
      }
      const decision = {
        id: `dec-${Date.now()}`,
        promotionRequestId: approveLiveMatch[1],
        actor: body.actor,
        actorType: body.actorType || 'human',
        role: body.role || 'reviewer',
        action: 'approve_live',
        reason: body.reason,
        evidenceLinks: body.evidenceLinks || [],
        timestamp: new Date().toISOString(),
        metadata: {},
      };
      const result = store.approveLive(approveLiveMatch[1], decision as any);
      if (!result) {
        writeJson(res, 409, { ok: false, error: 'Cannot approve live from current state' });
        return true;
      }
      writeJson(res, 200, { ok: true, promotion: result });
      return true;
    })();
  }

  const rejectMatch = pathname.match(/^\/api\/promotions\/([^/]+)\/reject$/);
  if (rejectMatch && req.method === 'POST') {
    return (async () => {
      const body = (await readJsonBody(req)) as Record<string, any> | undefined;
      if (!body?.actor || !body?.reason) {
        writeJson(res, 400, { ok: false, error: 'Missing actor or reason' });
        return true;
      }
      const decision = {
        id: `dec-${Date.now()}`,
        promotionRequestId: rejectMatch[1],
        actor: body.actor,
        actorType: body.actorType || 'human',
        role: body.role || 'reviewer',
        action: 'reject',
        reason: body.reason,
        evidenceLinks: body.evidenceLinks || [],
        timestamp: new Date().toISOString(),
        metadata: {},
      };
      const result = store.reject(rejectMatch[1], decision as any);
      if (!result) {
        writeJson(res, 409, { ok: false, error: 'Cannot reject: missing reason or invalid state' });
        return true;
      }
      writeJson(res, 200, { ok: true, promotion: result });
      return true;
    })();
  }

  const suspendMatch = pathname.match(/^\/api\/promotions\/([^/]+)\/suspend$/);
  if (suspendMatch && req.method === 'POST') {
    return (async () => {
      const body = (await readJsonBody(req)) as Record<string, any> | undefined;
      if (!body?.actor || !body?.reason) {
        writeJson(res, 400, { ok: false, error: 'Missing actor or reason' });
        return true;
      }
      const decision = {
        id: `dec-${Date.now()}`,
        promotionRequestId: suspendMatch[1],
        actor: body.actor,
        actorType: body.actorType || 'human',
        role: body.role || 'reviewer',
        action: 'suspend',
        reason: body.reason,
        evidenceLinks: body.evidenceLinks || [],
        timestamp: new Date().toISOString(),
        metadata: {},
      };
      const result = store.suspend(suspendMatch[1], decision as any);
      if (!result) {
        writeJson(res, 409, { ok: false, error: 'Cannot suspend: missing reason' });
        return true;
      }
      writeJson(res, 200, { ok: true, promotion: result });
      return true;
    })();
  }

  return false;
}
