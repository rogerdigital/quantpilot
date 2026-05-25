import {
  evaluateToolPolicy,
  filterAllowedFromRequest,
  getAllowedTools,
  getForbiddenTools,
} from '../../../../../../packages/control-plane-runtime/src/agent-tool-policy.js';
import {
  executeAgentReviewWorkflow,
  isValidReviewType,
} from '../../../../../../packages/task-workflow-engine/src/agent-review-workflows.js';
import type { AgentReviewType } from '../../../../../../packages/task-workflow-engine/src/agent-review-workflows.js';
import {
  approveAgentActionRequest,
  createSessionActionRequest,
  listAgentActionRequests,
  queueAgentActionRequest,
  rejectAgentActionRequest,
} from '../../../domains/agent/services/action-request-service.js';
import { runAgentAnalysis } from '../../../domains/agent/services/analysis-service.js';
import { createAgentInstruction } from '../../../domains/agent/services/instruction-service.js';
import { parseAgentIntent } from '../../../domains/agent/services/intent-service.js';
import { createAgentPlan } from '../../../domains/agent/services/planning-service.js';
import {
  resolveAgentAuthority,
  saveAgentPolicy,
} from '../../../domains/agent/services/policy-service.js';
import {
  listAgentDailyRuns,
  queueAgentDailyRun,
} from '../../../domains/agent/services/runtime-service.js';
import {
  getAgentSessionDetail,
  listAgentSessionsSnapshot,
} from '../../../domains/agent/services/session-service.js';
import { executeAgentTool, listAgentTools } from '../../../domains/agent/services/tools-service.js';
import {
  getAgentOperatorTimeline,
  getAgentWorkbench,
} from '../../../domains/agent/services/workbench-service.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';
import type { GatewayRouteContext } from '../types.js';

export async function handleAgentRoutes({ req, reqUrl, res, readJsonBody, writeJson }: GatewayRouteContext) {
  const writeForbidden = (permission: string, action = '') =>
    writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/authority') {
    writeJson(
      res,
      200,
      resolveAgentAuthority({
        accountId: reqUrl.searchParams.get('accountId') || 'all',
        strategyId: reqUrl.searchParams.get('strategyId') || 'all',
        actionType: reqUrl.searchParams.get('actionType') || 'all',
        environment: reqUrl.searchParams.get('environment') || 'paper',
        riskMode: reqUrl.searchParams.get('riskMode') || 'healthy',
        anomalyMode: reqUrl.searchParams.get('anomalyMode') || 'healthy',
      })
    );
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/policies') {
    const body = await readJsonBody(req);
    writeJson(res, 200, saveAgentPolicy(body || {}));
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/instructions') {
    const body = await readJsonBody(req);
    writeJson(res, 200, createAgentInstruction((body || {}) as Record<string, unknown>));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/tools') {
    writeJson(res, 200, listAgentTools());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/tools/execute') {
    const body = await readJsonBody(req);
    const result = await executeAgentTool(body as Record<string, unknown> | undefined);
    writeJson(res, result.ok ? 200 : 403, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/tools/policy') {
    writeJson(res, 200, {
      ok: true,
      allowed: getAllowedTools(),
      forbidden: getForbiddenTools(),
    });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/tools/policy/evaluate') {
    const body = (await readJsonBody(req)) as Record<string, unknown> | null;
    if (!body?.tools || !Array.isArray(body.tools)) {
      writeJson(res, 400, { ok: false, error: 'Missing required field: tools (array)' });
      return true;
    }
    const result = filterAllowedFromRequest(body.tools as string[]);
    writeJson(res, 200, { ok: true, ...result });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/reviews') {
    const body = (await readJsonBody(req)) as Record<string, unknown> | null;
    if (!body?.reviewType || !isValidReviewType(body.reviewType as string)) {
      writeJson(res, 400, {
        ok: false,
        error:
          'Missing or invalid reviewType. Valid: research_idea_critique, backtest_overfit_review, risk_violation_explanation, promotion_memo_draft, execution_incident_summary',
      });
      return true;
    }
    if (!body.targetId) {
      writeJson(res, 400, { ok: false, error: 'Missing required field: targetId' });
      return true;
    }
    const result = await executeAgentReviewWorkflow(
      {
        reviewType: body.reviewType as AgentReviewType,
        targetId: body.targetId as string,
        requestedBy: (body.requestedBy as string) || 'api',
        context: body.context as Record<string, unknown> | undefined,
      },
      {}
    );
    writeJson(res, result.ok ? 200 : 500, result);
    return true;
  }

  // LLM-powered intent parsing (now async)
  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/intent') {
    const body = await readJsonBody(req);
    const result = await parseAgentIntent(body as Parameters<typeof parseAgentIntent>[0]);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  // LLM-powered plan creation (now async)
  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/plans') {
    const body = await readJsonBody(req);
    const result = await createAgentPlan(body as Parameters<typeof createAgentPlan>[0]);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  // LLM-powered analysis with tool-use loop (now async)
  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/analysis-runs') {
    const body = await readJsonBody(req);
    const result = await runAgentAnalysis(body as Parameters<typeof runAgentAnalysis>[0]);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/sessions') {
    writeJson(res, 200, listAgentSessionsSnapshot(Number(reqUrl.searchParams.get('limit') || 20)));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/workbench') {
    writeJson(
      res,
      200,
      getAgentWorkbench({
        limit: reqUrl.searchParams.get('limit'),
        hours: reqUrl.searchParams.get('hours'),
      })
    );
    return true;
  }

  if (
    req.method === 'GET' &&
    reqUrl.pathname.endsWith('/timeline') &&
    reqUrl.pathname.startsWith('/api/agent/sessions/')
  ) {
    const sessionId = reqUrl.pathname.split('/').at(-2);
    const result = getAgentOperatorTimeline(sessionId, {
      limit: reqUrl.searchParams.get('limit'),
      hours: reqUrl.searchParams.get('hours'),
    });
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/agent/sessions/')) {
    const sessionId = reqUrl.pathname.split("/").at(-1)!;
    const result = getAgentSessionDetail(sessionId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (
    req.method === 'POST' &&
    reqUrl.pathname.endsWith('/action-requests') &&
    reqUrl.pathname.startsWith('/api/agent/sessions/')
  ) {
    if (!(await hasPermission('strategy:write', req.headers.authorization))) {
      writeForbidden('strategy:write', 'create agent session action requests');
      return true;
    }
    const sessionId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = createSessionActionRequest(sessionId, body as Record<string, unknown> | undefined);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/action-requests') {
    writeJson(res, 200, listAgentActionRequests());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/action-requests') {
    if (!(await hasPermission('strategy:write', req.headers.authorization))) {
      writeForbidden('strategy:write', 'queue agent action requests');
      return true;
    }
    const body = await readJsonBody(req);
    const result = queueAgentActionRequest(body as Record<string, unknown> | undefined);
    writeJson(res, result.ok ? 200 : 403, result);
    return true;
  }

  if (
    req.method === 'POST' &&
    reqUrl.pathname.endsWith('/approve') &&
    reqUrl.pathname.startsWith('/api/agent/action-requests/')
  ) {
    if (!(await hasPermission('risk:review', req.headers.authorization))) {
      writeForbidden('risk:review', 'approve agent action requests');
      return true;
    }
    const requestId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = approveAgentActionRequest(requestId, body as Record<string, unknown> | undefined);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (
    req.method === 'POST' &&
    reqUrl.pathname.endsWith('/reject') &&
    reqUrl.pathname.startsWith('/api/agent/action-requests/')
  ) {
    if (!(await hasPermission('risk:review', req.headers.authorization))) {
      writeForbidden('risk:review', 'reject agent action requests');
      return true;
    }
    const requestId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = rejectAgentActionRequest(requestId, body as Record<string, unknown> | undefined);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/daily-runs') {
    if (!(await hasPermission('strategy:write', req.headers.authorization))) {
      writeForbidden('strategy:write', 'queue agent daily runs');
      return true;
    }
    const body = await readJsonBody(req);
    writeJson(res, 200, queueAgentDailyRun(body || {}));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/daily-runs') {
    const limit = Number(reqUrl.searchParams.get('limit') || 20);
    writeJson(res, 200, listAgentDailyRuns(limit));
    return true;
  }

  return false;
}
