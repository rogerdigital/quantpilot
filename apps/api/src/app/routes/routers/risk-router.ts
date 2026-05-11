// @ts-nocheck

import {
  assessExecution as riskAssessExecution,
  assessPromotion as riskAssessPromotion,
} from '../../../../../../packages/trading-engine/src/risk/assessment.js';
import { getRiskEvent, listRiskEvents } from '../../../domains/risk/services/feed-service.js';
import {
  getRiskParameters,
  resetRiskParameters,
  updateRiskParameters,
} from '../../../domains/risk/services/parameters-service.js';
import { runRiskPolicyAction } from '../../../domains/risk/services/policy-action-service.js';
import { getRiskWorkbench } from '../../../domains/risk/services/workbench-service.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';

const riskPolicies = [];
const killSwitch = { active: false, activatedAt: null, activatedBy: null, reason: null };

export async function handleRiskRoutes({ req, reqUrl, res, readJsonBody, writeJson }) {
  const writeForbidden = (permission, action = '') =>
    writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/risk/parameters') {
    writeJson(res, 200, { ok: true, parameters: getRiskParameters() });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/risk/parameters') {
    if (!hasPermission('risk:review')) {
      writeForbidden('risk:review', 'update risk parameters');
      return true;
    }
    const body = await readJsonBody(req);
    const updated = updateRiskParameters(body);
    writeJson(res, 200, { ok: true, parameters: updated });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/risk/parameters/reset') {
    if (!hasPermission('risk:review')) {
      writeForbidden('risk:review', 'reset risk parameters');
      return true;
    }
    const reset = resetRiskParameters();
    writeJson(res, 200, { ok: true, parameters: reset });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/risk/events') {
    writeJson(res, 200, { ok: true, events: listRiskEvents() });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/risk/workbench') {
    writeJson(
      res,
      200,
      getRiskWorkbench({
        hours: reqUrl.searchParams.get('hours'),
        limit: reqUrl.searchParams.get('limit'),
      })
    );
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/risk/actions') {
    if (!hasPermission('risk:review')) {
      writeForbidden('risk:review', 'run risk policy actions');
      return true;
    }
    const body = await readJsonBody(req);
    const result = runRiskPolicyAction(body);
    writeJson(res, result?.ok === false ? 400 : 200, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/risk/events/')) {
    const eventId = reqUrl.pathname.split('/').at(-1);
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
    if (!hasPermission('risk:review')) {
      writeForbidden('risk:review', 'create risk policy');
      return true;
    }
    const body = await readJsonBody(req);
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
    const body = await readJsonBody(req);
    if (!body?.entityId || !body?.portfolio) {
      writeJson(res, 400, { ok: false, error: 'Missing entityId or portfolio' });
      return true;
    }
    const activePolicy = riskPolicies.find((p) => p.isActive);
    const rules = activePolicy?.rules || [];
    const result = riskAssessPromotion({ ...body, rules, mode: body.mode || 'paper' });
    writeJson(res, 200, { ok: true, assessment: result });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/risk/assess/execution') {
    const body = await readJsonBody(req);
    if (!body?.entityId || !body?.orderPlan) {
      writeJson(res, 400, { ok: false, error: 'Missing entityId or orderPlan' });
      return true;
    }
    const activePolicy = riskPolicies.find((p) => p.isActive);
    const rules = activePolicy?.rules || [];
    const portfolio = body.portfolio || {
      positions: [],
      grossExposure: 0,
      netExposure: 0,
      leverage: 1,
      drawdownPct: 0,
      dailyLossPct: 0,
      turnoverPct: 0,
    };
    const result = riskAssessExecution({
      entityId: body.entityId,
      orderPlan: body.orderPlan,
      portfolio,
      rules,
    });
    writeJson(res, 200, { ok: true, assessment: result });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/risk/kill-switch') {
    if (!hasPermission('risk:review')) {
      writeForbidden('risk:review', 'toggle kill switch');
      return true;
    }
    const body = await readJsonBody(req);
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
