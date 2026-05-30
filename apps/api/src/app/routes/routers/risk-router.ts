import {
  assessExecution as riskAssessExecution,
  assessPromotion as riskAssessPromotion,
} from '../../../../../../packages/trading-engine/src/risk/assessment.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';
import {
  appendRiskEvent,
  getRiskEvent,
  getRiskParameters,
  getRiskWorkbench,
  listRiskEvents,
  resetRiskParameters,
  updateRiskParameters,
} from '../core-data.js';
import type { GatewayRouteContext } from '../types.js';

interface RiskPolicy {
  id: string;
  name: string;
  description: string;
  rules: unknown[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

const riskPolicies: RiskPolicy[] = [];
const killSwitch: {
  active: boolean;
  activatedAt: string | null;
  activatedBy: string | null;
  reason: string | null;
} = { active: false, activatedAt: null, activatedBy: null, reason: null };

export async function handleRiskRoutes({
  req,
  reqUrl,
  res,
  readJsonBody,
  writeJson,
}: GatewayRouteContext) {
  const writeForbidden = (permission: string, action = '') =>
    writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/risk/parameters') {
    writeJson(res, 200, { ok: true, parameters: getRiskParameters() });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/risk/parameters') {
    if (!(await hasPermission('risk:review', req.headers.authorization))) {
      writeForbidden('risk:review', 'update risk parameters');
      return true;
    }
    const body = await readJsonBody(req);
    writeJson(res, 200, {
      ok: true,
      parameters: updateRiskParameters(body as Record<string, unknown>),
    });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/risk/parameters/reset') {
    if (!(await hasPermission('risk:review', req.headers.authorization))) {
      writeForbidden('risk:review', 'reset risk parameters');
      return true;
    }
    writeJson(res, 200, { ok: true, parameters: resetRiskParameters() });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/risk/events') {
    writeJson(res, 200, { ok: true, events: listRiskEvents() });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/risk/workbench') {
    writeJson(res, 200, getRiskWorkbench());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/risk/actions') {
    if (!(await hasPermission('risk:review', req.headers.authorization))) {
      writeForbidden('risk:review', 'run risk policy actions');
      return true;
    }
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    writeJson(res, 200, { ok: true, event: appendRiskEvent(body) });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/risk/events/')) {
    const eventId = reqUrl.pathname.split('/').at(-1)!;
    const event = getRiskEvent(eventId);
    writeJson(
      res,
      event ? 200 : 404,
      event ? { ok: true, event } : { ok: false, message: 'risk event not found' }
    );
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/risk/policies') {
    writeJson(res, 200, { ok: true, policies: riskPolicies });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/risk/policies') {
    if (!(await hasPermission('risk:review', req.headers.authorization))) {
      writeForbidden('risk:review', 'create risk policy');
      return true;
    }
    const body = (await readJsonBody(req)) as {
      name?: string;
      rules?: unknown[];
      description?: string;
      metadata?: Record<string, unknown>;
    } | null;
    if (!body?.name || !body?.rules) {
      writeJson(res, 400, { ok: false, error: 'Missing name or rules' });
      return true;
    }
    const policy = {
      id: `rp-${Date.now()}`,
      name: body.name,
      description: body.description || '',
      rules: body.rules,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: body.metadata || {},
    };
    riskPolicies.push(policy);
    writeJson(res, 201, { ok: true, policy });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/risk/assess/promotion') {
    const body = (await readJsonBody(req)) as {
      entityId?: string;
      portfolio?: unknown;
      mode?: 'paper' | 'live';
    } | null;
    if (!body?.entityId || !body?.portfolio) {
      writeJson(res, 400, { ok: false, error: 'Missing entityId or portfolio' });
      return true;
    }
    const activePolicy = riskPolicies.find((p) => p.isActive);
    const result = riskAssessPromotion({
      entityId: body.entityId,
      portfolio: body.portfolio as Parameters<typeof riskAssessPromotion>[0]['portfolio'],
      rules: (activePolicy?.rules || []) as Parameters<typeof riskAssessPromotion>[0]['rules'],
      mode: body.mode || 'paper',
    });
    writeJson(res, 200, { ok: true, assessment: result });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/risk/assess/execution') {
    const body = (await readJsonBody(req)) as {
      entityId?: string;
      orderPlan?: unknown;
      portfolio?: unknown;
    } | null;
    if (!body?.entityId || !body?.orderPlan) {
      writeJson(res, 400, { ok: false, error: 'Missing entityId or orderPlan' });
      return true;
    }
    const activePolicy = riskPolicies.find((p) => p.isActive);
    const result = riskAssessExecution({
      entityId: body.entityId,
      orderPlan: body.orderPlan as Parameters<typeof riskAssessExecution>[0]['orderPlan'],
      portfolio: (body.portfolio || {
        positions: [],
        grossExposure: 0,
        netExposure: 0,
        leverage: 1,
        drawdownPct: 0,
        dailyLossPct: 0,
        turnoverPct: 0,
      }) as Parameters<typeof riskAssessExecution>[0]['portfolio'],
      rules: (activePolicy?.rules || []) as Parameters<typeof riskAssessExecution>[0]['rules'],
    });
    writeJson(res, 200, { ok: true, assessment: result });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/risk/kill-switch') {
    if (!(await hasPermission('risk:review', req.headers.authorization))) {
      writeForbidden('risk:review', 'toggle kill switch');
      return true;
    }
    const body = (await readJsonBody(req)) as {
      active?: boolean;
      activatedBy?: string;
      reason?: string;
    } | null;
    killSwitch.active = Boolean(body?.active);
    killSwitch.activatedAt = killSwitch.active ? new Date().toISOString() : null;
    killSwitch.activatedBy = body?.activatedBy || null;
    killSwitch.reason = body?.reason || null;
    writeJson(res, 200, { ok: true, killSwitch });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/risk/kill-switch') {
    writeJson(res, 200, { ok: true, killSwitch });
    return true;
  }

  return false;
}
