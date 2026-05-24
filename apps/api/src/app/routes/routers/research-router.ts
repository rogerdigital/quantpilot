import type { GatewayRouteContext } from '../types.js';
import { controlPlaneContext } from '../../../../../../packages/control-plane-store/src/context.js';
import { createExperimentRegistry } from '../../../../../../packages/control-plane-store/src/experiment-registry.js';
import { createResearchWorkspaceStore } from '../../../../../../packages/control-plane-store/src/research-workspace-store.js';
import {
  getResearchEvaluationSummary,
  listResearchEvaluations,
} from '../../../domains/research/services/evaluation-service.js';
import {
  getResearchReportSummary,
  listResearchReports,
} from '../../../domains/research/services/report-service.js';
import {
  getResearchHubSnapshot,
  getResearchTaskDetail,
  getResearchTaskSummary,
  listResearchTasks,
} from '../../../domains/research/services/task-service.js';
import {
  getResearchWorkbenchSnapshot,
  listResearchGovernanceActions,
  runResearchGovernanceAction,
} from '../../../domains/research/services/workbench-service.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';

export async function handleResearchRoutes({ req, reqUrl, res, readJsonBody, writeJson }: GatewayRouteContext) {
  const writeForbidden = (permission: string, action = '') =>
    writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/hub') {
    writeJson(
      res,
      200,
      getResearchHubSnapshot({
        hours: reqUrl.searchParams.get('hours'),
        limit: reqUrl.searchParams.get('limit'),
      })
    );
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/workbench') {
    writeJson(
      res,
      200,
      getResearchWorkbenchSnapshot({
        hours: reqUrl.searchParams.get('hours'),
        limit: reqUrl.searchParams.get('limit'),
      })
    );
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/governance/actions') {
    writeJson(
      res,
      200,
      listResearchGovernanceActions({
        hours: reqUrl.searchParams.get('hours'),
        limit: reqUrl.searchParams.get('limit'),
      })
    );
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/research/governance/actions') {
    const body = (await readJsonBody(req)) as Record<string, any> | undefined;
    if (body?.action === 'promote_strategies' || body?.action === 'queue_backtests') {
      if (!(await hasPermission('strategy:write', req.headers.authorization))) {
        writeForbidden('strategy:write', 'run research governance strategy actions');
        return true;
      }
    }
    if (body?.action === 'evaluate_runs' && !(await hasPermission('risk:review', req.headers.authorization))) {
      writeForbidden('risk:review', 'run research governance evaluation actions');
      return true;
    }
    const result = runResearchGovernanceAction(body as any);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/tasks') {
    writeJson(
      res,
      200,
      listResearchTasks({
        hours: reqUrl.searchParams.get('hours'),
        limit: reqUrl.searchParams.get('limit'),
        taskType: reqUrl.searchParams.get('taskType'),
        status: reqUrl.searchParams.get('status'),
        strategyId: reqUrl.searchParams.get('strategyId'),
        workflowRunId: reqUrl.searchParams.get('workflowRunId'),
        runId: reqUrl.searchParams.get('runId'),
      })
    );
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/tasks/summary') {
    writeJson(
      res,
      200,
      getResearchTaskSummary({
        hours: reqUrl.searchParams.get('hours'),
        limit: reqUrl.searchParams.get('limit'),
        taskType: reqUrl.searchParams.get('taskType'),
        strategyId: reqUrl.searchParams.get('strategyId'),
      })
    );
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/research/tasks/')) {
    const taskId = reqUrl.pathname.split('/').at(-1);
    const result = getResearchTaskDetail(taskId as string);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/evaluations') {
    writeJson(
      res,
      200,
      listResearchEvaluations({
        hours: reqUrl.searchParams.get('hours'),
        limit: reqUrl.searchParams.get('limit'),
        runId: reqUrl.searchParams.get('runId'),
        resultId: reqUrl.searchParams.get('resultId'),
        strategyId: reqUrl.searchParams.get('strategyId'),
        verdict: reqUrl.searchParams.get('verdict'),
      })
    );
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/evaluations/summary') {
    writeJson(
      res,
      200,
      getResearchEvaluationSummary({
        hours: reqUrl.searchParams.get('hours'),
        limit: reqUrl.searchParams.get('limit'),
        strategyId: reqUrl.searchParams.get('strategyId'),
        verdict: reqUrl.searchParams.get('verdict'),
      })
    );
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/reports') {
    writeJson(
      res,
      200,
      listResearchReports({
        hours: reqUrl.searchParams.get('hours'),
        limit: reqUrl.searchParams.get('limit'),
        evaluationId: reqUrl.searchParams.get('evaluationId'),
        workflowRunId: reqUrl.searchParams.get('workflowRunId'),
        runId: reqUrl.searchParams.get('runId'),
        resultId: reqUrl.searchParams.get('resultId'),
        strategyId: reqUrl.searchParams.get('strategyId'),
        verdict: reqUrl.searchParams.get('verdict'),
      })
    );
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/reports/summary') {
    writeJson(
      res,
      200,
      getResearchReportSummary({
        hours: reqUrl.searchParams.get('hours'),
        limit: reqUrl.searchParams.get('limit'),
        strategyId: reqUrl.searchParams.get('strategyId'),
        verdict: reqUrl.searchParams.get('verdict'),
      })
    );
    return true;
  }

  // ── Research Workspace Routes ────────────────────────────

  function getStore() {
    return controlPlaneContext?.store || { readCollection: () => [], writeCollection: () => {} };
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/workspaces') {
    const wsStore = createResearchWorkspaceStore(getStore() as any);
    writeJson(res, 200, { ok: true, workspaces: wsStore.listWorkspaces() });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/research/workspaces') {
    return (async () => {
      const body = (await readJsonBody(req)) as Record<string, any> | undefined;
      if (!body || !body.id || !body.title || !body.owner) {
        writeJson(res, 400, { ok: false, error: 'Missing required fields: id, title, owner' });
        return true;
      }
      const wsStore = createResearchWorkspaceStore(getStore() as any);
      const workspace = wsStore.createWorkspace({
        ...body,
        ownerRole: body.ownerRole || 'researcher',
        status: body.status || 'active',
        ideas: body.ideas || [],
        createdAt: body.createdAt || new Date().toISOString(),
        updatedAt: body.updatedAt || new Date().toISOString(),
        metadata: body.metadata || {},
      } as any);
      writeJson(res, 201, { ok: true, workspace });
      return true;
    })();
  }

  const wsDetailMatch = reqUrl.pathname.match(/^\/api\/research\/workspaces\/([^/]+)$/);
  if (wsDetailMatch && req.method === 'GET') {
    const wsStore = createResearchWorkspaceStore(getStore() as any);
    const workspace = wsStore.getWorkspace(wsDetailMatch[1]);
    if (!workspace) {
      writeJson(res, 404, { ok: false, error: 'Workspace not found' });
      return true;
    }
    writeJson(res, 200, { ok: true, workspace });
    return true;
  }

  const wsIdeasMatch = reqUrl.pathname.match(/^\/api\/research\/workspaces\/([^/]+)\/ideas$/);
  if (wsIdeasMatch && req.method === 'POST') {
    return (async () => {
      const body = (await readJsonBody(req)) as Record<string, any> | undefined;
      if (!body || !body.id || !body.title || !body.hypothesis) {
        writeJson(res, 400, {
          ok: false,
          error: 'Missing required fields: id, title, hypothesis',
        });
        return true;
      }
      const wsStore = createResearchWorkspaceStore(getStore() as any);
      const idea = wsStore.attachIdea(wsIdeasMatch[1], {
        ...body,
        workspaceId: wsIdeasMatch[1],
        status: body.status || 'idea',
        owner: body.owner || 'unknown',
        ownerRole: body.ownerRole || 'researcher',
        tags: body.tags || [],
        decisionRecords: body.decisionRecords || [],
        linkedDatasetIds: body.linkedDatasetIds || [],
        linkedFeatureSetIds: body.linkedFeatureSetIds || [],
        linkedExperimentIds: body.linkedExperimentIds || [],
        linkedBacktestIds: body.linkedBacktestIds || [],
        createdAt: body.createdAt || new Date().toISOString(),
        updatedAt: body.updatedAt || new Date().toISOString(),
        metadata: body.metadata || {},
      } as any);
      writeJson(res, 201, { ok: true, idea });
      return true;
    })();
  }

  const ideaTransitionsMatch = reqUrl.pathname.match(
    /^\/api\/research\/ideas\/([^/]+)\/transitions$/
  );
  if (ideaTransitionsMatch && req.method === 'POST') {
    return (async () => {
      const body = (await readJsonBody(req)) as Record<string, any> | undefined;
      if (!body || !body.workspaceId || !body.nextStatus || !body.reason || !body.actor) {
        writeJson(res, 400, {
          ok: false,
          error: 'Missing required fields: workspaceId, nextStatus, reason, actor',
        });
        return true;
      }
      const wsStore = createResearchWorkspaceStore(getStore() as any);
      const idea = wsStore.transitionIdea(
        body.workspaceId,
        ideaTransitionsMatch[1],
        body.nextStatus,
        body.reason,
        body.actor,
        body.role || 'researcher'
      );
      writeJson(res, 200, { ok: true, idea });
      return true;
    })();
  }

  const ideaDecisionsMatch = reqUrl.pathname.match(/^\/api\/research\/ideas\/([^/]+)\/decisions$/);
  if (ideaDecisionsMatch && req.method === 'POST') {
    return (async () => {
      const body = (await readJsonBody(req)) as Record<string, any> | undefined;
      if (!body || !body.workspaceId || !body.id || !body.actor || !body.reason) {
        writeJson(res, 400, {
          ok: false,
          error: 'Missing required fields: workspaceId, id, actor, reason',
        });
        return true;
      }
      const wsStore = createResearchWorkspaceStore(getStore() as any);
      const decision = wsStore.recordDecision(body.workspaceId, ideaDecisionsMatch[1], {
        id: body.id,
        actor: body.actor,
        role: body.role || 'researcher',
        action: body.action || 'note',
        reason: body.reason,
        evidenceLinks: body.evidenceLinks || [],
        timestamp: body.timestamp || new Date().toISOString(),
        metadata: body.metadata || {},
      } as any);
      writeJson(res, 200, { ok: true, decision });
      return true;
    })();
  }

  // ── Experiment Routes ────────────────────────────────────

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/experiments') {
    const expRegistry = createExperimentRegistry(getStore() as any);
    writeJson(res, 200, { ok: true, experiments: expRegistry.listExperiments() });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/research/experiments') {
    return (async () => {
      const body = (await readJsonBody(req)) as Record<string, any> | undefined;
      if (!body || !body.id || !body.name) {
        writeJson(res, 400, { ok: false, error: 'Missing required fields: id, name' });
        return true;
      }
      const expRegistry = createExperimentRegistry(getStore() as any);
      const experiment = expRegistry.registerExperiment({
        ...body,
        workspaceId: body.workspaceId || '',
        status: body.status || 'draft',
        runs: body.runs || [],
        candidateRunId: body.candidateRunId || null,
        createdAt: body.createdAt || new Date().toISOString(),
        updatedAt: body.updatedAt || new Date().toISOString(),
        metadata: body.metadata || {},
      } as any);
      writeJson(res, 201, { ok: true, experiment });
      return true;
    })();
  }

  const expRunsMatch = reqUrl.pathname.match(/^\/api\/research\/experiments\/([^/]+)\/runs$/);
  if (expRunsMatch && req.method === 'POST') {
    return (async () => {
      const body = (await readJsonBody(req)) as Record<string, any> | undefined;
      if (!body || !body.id || !body.snapshot) {
        writeJson(res, 400, { ok: false, error: 'Missing required fields: id, snapshot' });
        return true;
      }
      const expRegistry = createExperimentRegistry(getStore() as any);
      const run = expRegistry.createRun(expRunsMatch[1], {
        ...body,
        experimentId: expRunsMatch[1],
        status: body.status || 'queued',
        metrics: body.metrics || [],
        artifactIds: body.artifactIds || [],
        isCandidate: false,
        startedAt: body.startedAt || new Date().toISOString(),
        completedAt: body.completedAt || '',
        createdAt: body.createdAt || new Date().toISOString(),
        metadata: body.metadata || {},
      } as any);
      writeJson(res, 201, { ok: true, run });
      return true;
    })();
  }

  return false;
}
