// @ts-nocheck
import { hasPermission } from '../../../modules/auth/service.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { getResearchHubSnapshot, getResearchTaskDetail, getResearchTaskSummary, listResearchTasks } from '../../../domains/research/services/task-service.js';
import { getResearchEvaluationSummary, listResearchEvaluations } from '../../../domains/research/services/evaluation-service.js';
import { getResearchReportSummary, listResearchReports } from '../../../domains/research/services/report-service.js';
import { getResearchWorkbenchSnapshot, listResearchGovernanceActions, runResearchGovernanceAction } from '../../../domains/research/services/workbench-service.js';

export async function handleResearchRoutes({ req, reqUrl, res, readJsonBody, writeJson }) {
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/hub') {
    writeJson(res, 200, getResearchHubSnapshot({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/workbench') {
    writeJson(res, 200, getResearchWorkbenchSnapshot({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/governance/actions') {
    writeJson(res, 200, listResearchGovernanceActions({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
    }));
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/research/governance/actions') {
    const body = await readJsonBody(req);
    if (body.action === 'promote_strategies' || body.action === 'queue_backtests') {
      if (!hasPermission('strategy:write')) { writeForbidden('strategy:write', 'run research governance strategy actions'); return true; }
    }
    if (body.action === 'evaluate_runs' && !hasPermission('risk:review')) {
      writeForbidden('risk:review', 'run research governance evaluation actions'); return true;
    }
    const result = runResearchGovernanceAction(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/tasks') {
    writeJson(res, 200, listResearchTasks({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      taskType: reqUrl.searchParams.get('taskType'),
      status: reqUrl.searchParams.get('status'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      workflowRunId: reqUrl.searchParams.get('workflowRunId'),
      runId: reqUrl.searchParams.get('runId'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/tasks/summary') {
    writeJson(res, 200, getResearchTaskSummary({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      taskType: reqUrl.searchParams.get('taskType'),
      strategyId: reqUrl.searchParams.get('strategyId'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/research/tasks/')) {
    const taskId = reqUrl.pathname.split('/').at(-1);
    const result = getResearchTaskDetail(taskId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/evaluations') {
    writeJson(res, 200, listResearchEvaluations({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      runId: reqUrl.searchParams.get('runId'),
      resultId: reqUrl.searchParams.get('resultId'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      verdict: reqUrl.searchParams.get('verdict'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/evaluations/summary') {
    writeJson(res, 200, getResearchEvaluationSummary({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      verdict: reqUrl.searchParams.get('verdict'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/reports') {
    writeJson(res, 200, listResearchReports({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      evaluationId: reqUrl.searchParams.get('evaluationId'),
      workflowRunId: reqUrl.searchParams.get('workflowRunId'),
      runId: reqUrl.searchParams.get('runId'),
      resultId: reqUrl.searchParams.get('resultId'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      verdict: reqUrl.searchParams.get('verdict'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/reports/summary') {
    writeJson(res, 200, getResearchReportSummary({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      verdict: reqUrl.searchParams.get('verdict'),
    }));
    return true;
  }

  return false;
}
