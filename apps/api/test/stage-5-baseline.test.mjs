import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeGatewayRoute } from './helpers/invoke-gateway.mjs';

const namespace = `stage-5-baseline-test-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const [{ createGatewayHandler }, { createControlPlaneContext }, { createControlPlaneStore }] = await Promise.all([
  import('../src/gateways/alpaca.mjs'),
  import('../../../packages/control-plane-store/src/context.mjs'),
  import('../../../packages/control-plane-store/src/store.mjs'),
]);

const handler = createGatewayHandler({
  getBrokerHealth: async () => ({
    adapter: 'simulated',
    connected: true,
    customBrokerConfigured: false,
    alpacaConfigured: false,
  }),
  executeBrokerCycle: async () => ({
    connected: true,
    message: 'stage 5 baseline broker ok',
    submittedOrders: [],
    rejectedOrders: [],
    snapshot: {
      connected: true,
      message: 'stage 5 baseline snapshot ok',
      account: { cash: 85000, buyingPower: 92000, equity: 110000 },
      positions: [{ symbol: 'AAPL', qty: 20, avgCost: 172.5, marketValue: 3600 }],
      orders: [],
    },
  }),
  getMarketSnapshot: async () => ({
    label: 'Stage 5 Baseline Market',
    connected: true,
    message: 'stage 5 baseline market ok',
    quotes: [],
  }),
});
const context = createControlPlaneContext(createControlPlaneStore({ namespace }));

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

test('stage 5 baseline exposes agent sessions, intent, plan, and analysis run contracts', async () => {
  // POST /api/agent/analysis-runs — full pipeline: intent → plan → analysis
  const analysisRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/analysis-runs',
    body: {
      prompt: 'Explain the current risk posture and suggest next steps.',
      requestedBy: 'stage5-operator',
    },
  });

  assert.equal(analysisRes.statusCode, 200);
  assert.equal(analysisRes.json.ok, true);
  assert.equal(typeof analysisRes.json.session.id, 'string');
  assert.equal(typeof analysisRes.json.intent.kind, 'string');
  assert.equal(typeof analysisRes.json.plan.id, 'string');
  assert.equal(analysisRes.json.plan.status, 'completed');
  assert.equal(typeof analysisRes.json.run.id, 'string');
  assert.equal(analysisRes.json.run.status, 'completed');
  assert.equal(Array.isArray(analysisRes.json.run.evidence), true);
  assert.equal(typeof analysisRes.json.run.explanation, 'object');
  assert.equal(typeof analysisRes.json.run.explanation.thesis, 'string');

  const sessionId = analysisRes.json.session.id;
  const planId = analysisRes.json.plan.id;
  const runId = analysisRes.json.run.id;

  // Session list exposes the newly created session
  const sessionListRes = await invokeGatewayRoute(handler, {
    path: '/api/agent/sessions?limit=5',
  });

  assert.equal(sessionListRes.statusCode, 200);
  assert.equal(sessionListRes.json.ok, true);
  assert.equal(Array.isArray(sessionListRes.json.sessions), true);
  assert.equal(sessionListRes.json.sessions.some(s => s.id === sessionId), true);

  // Session detail exposes latest plan, analysis run, and message thread
  const detailRes = await invokeGatewayRoute(handler, {
    path: `/api/agent/sessions/${sessionId}`,
  });

  assert.equal(detailRes.statusCode, 200);
  assert.equal(detailRes.json.ok, true);
  assert.equal(detailRes.json.session.id, sessionId);
  assert.equal(detailRes.json.latestPlan.id, planId);
  assert.equal(detailRes.json.latestAnalysisRun.id, runId);
  assert.equal(Array.isArray(detailRes.json.plans), true);
  assert.equal(Array.isArray(detailRes.json.analysisRuns), true);
  assert.equal(Array.isArray(detailRes.json.messages), true);
  assert.equal(detailRes.json.messages.some(m => m.role === 'user' && m.kind === 'prompt'), true);
  assert.equal(detailRes.json.messages.some(m => m.role === 'assistant' && m.kind === 'analysis_result'), true);
});

test('stage 5 baseline exposes agent workbench collaboration queues', async () => {
  const analysisRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/analysis-runs',
    body: {
      prompt: 'Explain the risk posture for ema-cross-us.',
      requestedBy: 'stage5-operator',
    },
  });
  assert.equal(analysisRes.statusCode, 200);

  // Seed a pending action request in the workbench queue
  const request = context.agentActionRequests.appendAgentActionRequest({
    requestType: 'prepare_execution_plan',
    targetId: 'stage5-strategy',
    status: 'pending_review',
    approvalState: 'required',
    riskStatus: 'review',
    summary: 'Stage 5 pending review request.',
    rationale: 'Risk review still required.',
    requestedBy: 'agent',
  });
  context.agentSessions.updateAgentSession(analysisRes.json.session.id, {
    latestActionRequestId: request.id,
  });

  const workbenchRes = await invokeGatewayRoute(handler, {
    path: '/api/agent/workbench?hours=168&limit=10',
  });

  assert.equal(workbenchRes.statusCode, 200);
  assert.equal(workbenchRes.json.ok, true);
  assert.equal(typeof workbenchRes.json.summary.sessions, 'number');
  assert.equal(typeof workbenchRes.json.summary.pendingActionRequests, 'number');
  assert.equal(workbenchRes.json.summary.pendingActionRequests >= 1, true);
  assert.equal(typeof workbenchRes.json.queues, 'object');
  assert.equal(Array.isArray(workbenchRes.json.queues.recentSessions), true);
  assert.equal(Array.isArray(workbenchRes.json.queues.pendingActionRequests), true);
  assert.equal(workbenchRes.json.queues.pendingActionRequests.some(r => r.id === request.id), true);
  assert.equal(Array.isArray(workbenchRes.json.runbook), true);
  assert.equal(Array.isArray(workbenchRes.json.recentExplanations), true);
  assert.equal(workbenchRes.json.recentExplanations.some(e => e.analysisRunId === analysisRes.json.run.id), true);
  assert.equal(Array.isArray(workbenchRes.json.operatorTimeline), true);
});

test('stage 5 baseline exposes controlled action handoff from completed session', async () => {
  // Create a completed session via context (session-action-request route requires completed status)
  const session = context.agentSessions.appendAgentSession({
    title: 'Stage 5 execution prep handoff',
    prompt: 'Prepare execution plan for ema-cross-us.',
    requestedBy: 'stage5-operator',
    status: 'completed',
    latestIntent: {
      kind: 'request_execution_prep',
      summary: 'Prepare execution plan.',
      targetType: 'strategy',
      targetId: 'ema-cross-us',
      urgency: 'normal',
      requiresApproval: true,
      requestedMode: 'prepare_action',
      metadata: {},
    },
  });
  const plan = context.agentPlans.appendAgentPlan({
    sessionId: session.id,
    status: 'completed',
    summary: 'Read strategy context and prepare handoff.',
    requiresApproval: true,
    requestedBy: 'stage5-operator',
    steps: [
      {
        kind: 'request_action',
        title: 'Prepare handoff',
        status: 'completed',
        toolName: '',
        description: 'Controlled action handoff.',
        outputSummary: 'Ready for operator approval.',
        metadata: { proposedActionRequestType: 'prepare_execution_plan' },
      },
    ],
    metadata: {},
  });
  const run = context.agentAnalysisRuns.appendAgentAnalysisRun({
    sessionId: session.id,
    planId: plan.id,
    status: 'completed',
    summary: 'Execution readiness confirmed.',
    conclusion: 'Submit controlled execution-plan request.',
    requestedBy: 'stage5-operator',
    toolCalls: [],
    evidence: [],
    explanation: {
      thesis: 'Execution readiness confirmed.',
      rationale: ['Strategy posture is available.'],
      warnings: [],
      recommendedNextStep: 'Submit a controlled execution-plan request.',
    },
    metadata: {},
    completedAt: new Date().toISOString(),
  });
  context.agentSessions.updateAgentSession(session.id, {
    latestPlanId: plan.id,
    latestAnalysisRunId: run.id,
  });

  // Create controlled action request from the completed session
  const handoffRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/agent/sessions/${session.id}/action-requests`,
    body: { requestedBy: 'stage5-operator' },
  });

  assert.equal(handoffRes.statusCode, 200);
  assert.equal(handoffRes.json.ok, true);
  assert.equal(typeof handoffRes.json.handoff.requestType, 'string');
  assert.equal(handoffRes.json.session.status, 'waiting_approval');
  assert.equal(typeof handoffRes.json.workflow.workflowId, 'string');

  // Action request appears in the list
  const actionListRes = await invokeGatewayRoute(handler, {
    path: '/api/agent/action-requests',
  });
  assert.equal(actionListRes.statusCode, 200);
  assert.equal(Array.isArray(actionListRes.json.requests), true);

  // Operator timeline for the session is accessible
  const timelineRes = await invokeGatewayRoute(handler, {
    path: `/api/agent/sessions/${session.id}/timeline`,
  });
  assert.equal(timelineRes.statusCode, 200);
  assert.equal(timelineRes.json.ok, true);
  assert.equal(Array.isArray(timelineRes.json.timeline), true);
});

test('stage 5 baseline exposes approval and rejection of agent action requests with downstream linking', async () => {
  // Seed an approvable request directly
  const approveRequest = context.agentActionRequests.appendAgentActionRequest({
    requestType: 'prepare_execution_plan',
    targetId: 'stage5-approve-target',
    status: 'pending_review',
    approvalState: 'required',
    riskStatus: 'review',
    summary: 'Stage 5 approval test.',
    rationale: 'Testing approval downstream linking.',
    requestedBy: 'agent',
  });

  const approveRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/agent/action-requests/${approveRequest.id}/approve`,
    body: { approvedBy: 'stage5-risk-operator', mode: 'paper', capital: 50000 },
  });

  assert.equal(approveRes.statusCode, 200);
  assert.equal(approveRes.json.ok, true);
  assert.equal(approveRes.json.request.approvalState, 'approved');
  assert.equal(typeof approveRes.json.request.id, 'string');

  // Seed a rejectable request directly
  const rejectRequest = context.agentActionRequests.appendAgentActionRequest({
    requestType: 'prepare_execution_plan',
    targetId: 'stage5-reject-target',
    status: 'pending_review',
    approvalState: 'required',
    riskStatus: 'review',
    summary: 'Stage 5 rejection test.',
    rationale: 'Testing rejection downstream linking.',
    requestedBy: 'agent',
  });

  const rejectRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/agent/action-requests/${rejectRequest.id}/reject`,
    body: { rejectedBy: 'stage5-risk-operator', reason: 'Risk posture is not yet cleared.' },
  });

  assert.equal(rejectRes.statusCode, 200);
  assert.equal(rejectRes.json.ok, true);
  assert.equal(rejectRes.json.request.approvalState, 'rejected');
  assert.equal(typeof rejectRes.json.request.id, 'string');
});

test('stage 5 baseline enforces risk:review permission guardrail on action request approval', async () => {
  const request = context.agentActionRequests.appendAgentActionRequest({
    requestType: 'prepare_execution_plan',
    targetId: 'stage5-guard-target',
    status: 'pending_review',
    approvalState: 'required',
    riskStatus: 'review',
    summary: 'Permission guard test.',
    rationale: 'Agent cannot self-approve.',
    requestedBy: 'agent',
  });

  // Strip risk:review permission
  context.userAccount.updateUserAccess({
    role: 'operator',
    status: 'active',
    permissions: ['dashboard:read', 'strategy:write'],
  });

  const unauthorizedApprove = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/agent/action-requests/${request.id}/approve`,
    body: { reviewedBy: 'unauthorized-user' },
  });

  assert.equal(unauthorizedApprove.statusCode, 403);
  assert.equal(unauthorizedApprove.json.ok, false);
  assert.equal(unauthorizedApprove.json.missingPermission, 'risk:review');

  const unauthorizedReject = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/agent/action-requests/${request.id}/reject`,
    body: { reviewedBy: 'unauthorized-user', reason: 'No.' },
  });

  assert.equal(unauthorizedReject.statusCode, 403);
  assert.equal(unauthorizedReject.json.ok, false);
  assert.equal(unauthorizedReject.json.missingPermission, 'risk:review');

  // Restore full permissions
  context.userAccount.updateUserAccess({
    role: 'admin',
    status: 'active',
    permissions: ['dashboard:read', 'strategy:write', 'risk:review', 'execution:approve', 'account:write'],
  });
});
