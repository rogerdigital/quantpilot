import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';

function parseLimit(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours: any) {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

function countBy(items: any[], predicate: (item: any) => boolean) {
  return items.reduce((count: number, item: any) => (predicate(item) ? count + 1 : count), 0);
}

function matchesSession(session: any, item: any, keys: string[] = []) {
  if (!session || !item) return false;
  if (
    item.id &&
    [
      session.id,
      session.latestPlanId,
      session.latestAnalysisRunId,
      session.latestActionRequestId,
    ].includes(item.id)
  )
    return true;

  return keys.some((key) => {
    const value = item?.metadata?.[key];
    return (
      value &&
      [
        session.id,
        session.latestPlanId,
        session.latestAnalysisRunId,
        session.latestActionRequestId,
      ].includes(value)
    );
  });
}

function buildSessionTimeline(session: any, options: Record<string, any> = {}) {
  const limit = parseLimit(options.limit, 20);
  const since = resolveSince(options.hours);
  const auditRecords = controlPlaneRuntime.listAuditRecords(limit * 4, { since });
  const notifications = controlPlaneRuntime.listNotifications(limit * 4, { since });
  const operatorActions = controlPlaneRuntime.listOperatorActions(limit * 4, { since });
  const actionRequests = controlPlaneRuntime.listAgentActionRequests(limit * 4);

  const relatedRequestIds = actionRequests
    .filter(
      (item: any) =>
        item.id === session.latestActionRequestId ||
        item.metadata?.agentSessionId === session.id ||
        (session.latestIntent?.targetId &&
          item.targetId === session.latestIntent.targetId &&
          item.requestedBy === session.requestedBy)
    )
    .map((item: any) => item.id);

  const items = [
    ...auditRecords
      .filter((item: any) =>
        matchesSession(session, item, ['agentSessionId', 'agentPlanId', 'agentAnalysisRunId'])
      )
      .map((item: any) => ({
        id: `audit-${item.id}`,
        lane: 'audit',
        title: item.title,
        detail: item.detail,
        status: item.type,
        actor: item.actor,
        at: item.createdAt,
        metadata: item.metadata || {},
      })),
    ...notifications
      .filter(
        (item: any) =>
          matchesSession(session, item, ['agentActionRequestId']) ||
          (session.latestActionRequestId &&
            item.metadata?.agentActionRequestId === session.latestActionRequestId)
      )
      .map((item: any) => ({
        id: `notification-${item.id}`,
        lane: 'notification',
        title: item.title,
        detail: item.message,
        status: item.level,
        actor: item.source,
        at: item.createdAt,
        metadata: item.metadata || {},
      })),
    ...operatorActions
      .filter(
        (item: any) =>
          relatedRequestIds.includes(item.metadata?.agentActionRequestId) ||
          (session.latestIntent?.targetId &&
            item.metadata?.targetId === session.latestIntent.targetId &&
            item.type?.includes('agent-request'))
      )
      .map((item: any) => ({
        id: `action-${item.id}`,
        lane: 'operator',
        title: item.title,
        detail: item.detail,
        status: item.level,
        actor: item.actor,
        at: item.createdAt,
        metadata: item.metadata || {},
      })),
    ...actionRequests
      .filter((item: any) => relatedRequestIds.includes(item.id))
      .map((item: any) => ({
        id: `request-${item.id}`,
        lane: 'request',
        title: `Action request: ${item.requestType}`,
        detail: item.summary,
        status: item.status,
        actor: item.requestedBy,
        at: item.updatedAt || item.createdAt,
        metadata: {
          ...item.metadata,
          agentActionRequestId: item.id,
        },
      })),
  ];

  return items
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
    .slice(0, limit);
}

function buildRecentExplanations(runs: any[] = []) {
  return runs
    .filter((item: any) => item.explanation?.thesis)
    .slice(0, 5)
    .map((item: any) => ({
      sessionId: item.sessionId,
      analysisRunId: item.id,
      thesis: item.explanation.thesis,
      summary: item.summary,
      recommendedNextStep: item.explanation.recommendedNextStep,
      warningCount: Array.isArray(item.explanation.warnings) ? item.explanation.warnings.length : 0,
      createdAt: item.createdAt,
    }));
}

function buildRunbook(summary: Record<string, any>) {
  const items = [];
  if (summary.pendingActionRequests > 0) {
    items.push({
      key: 'review-pending-agent-requests',
      priority: summary.pendingActionRequests >= 3 ? 'now' : 'next',
      title: 'Review pending agent requests',
      detail:
        'Pending agent action requests are waiting for operator review and should be triaged from the workbench.',
      count: summary.pendingActionRequests,
    });
  }
  if (summary.failedAnalyses > 0) {
    items.push({
      key: 'replay-failed-analyses',
      priority: 'next',
      title: 'Replay failed analyses',
      detail:
        'Some agent analyses failed and should be replayed or refined before operators rely on them.',
      count: summary.failedAnalyses,
    });
  }
  if (summary.completedSessions > 0) {
    items.push({
      key: 'review-latest-explanations',
      priority: 'next',
      title: 'Review latest explanations',
      detail:
        'Recent completed sessions now have structured explanations and evidence trails available for operator review.',
      count: summary.completedSessions,
    });
  }
  return items;
}

export function getAgentWorkbench(options: Record<string, any> = {}) {
  const limit = parseLimit(options.limit, 20);
  const sessions = controlPlaneRuntime.listAgentSessions(limit * 3);
  const runs = controlPlaneRuntime.listAgentAnalysisRuns(limit * 3);
  const requests = controlPlaneRuntime.listAgentActionRequests(limit * 3);
  const governance = controlPlaneRuntime.getAgentGovernanceSnapshot({
    eventLimit: limit,
    instructionLimit: limit,
    runLimit: limit,
  });
  const notifications = controlPlaneRuntime
    .listNotifications(limit * 4)
    .filter((item: any) => item.source === 'agent-control' || item.metadata?.agentActionRequestId);
  const auditRecords = controlPlaneRuntime
    .listAuditRecords(limit * 6)
    .filter((item: any) =>
      ['agent-session', 'agent-plan', 'agent-analysis-run', 'agent-action-request'].includes(
        item.type
      )
    );
  const operatorActions = controlPlaneRuntime
    .listOperatorActions(limit * 4)
    .filter(
      (item: any) => item.type === 'approve-agent-request' || item.type === 'reject-agent-request'
    );

  const summary = {
    sessions: sessions.length,
    completedSessions: countBy(sessions, (item: any) => item.status === 'completed'),
    runningSessions: countBy(sessions, (item: any) => item.status === 'running'),
    failedAnalyses: countBy(runs, (item: any) => item.status === 'failed'),
    pendingActionRequests: countBy(requests, (item: any) => item.status === 'pending_review'),
    latestUpdatedAt: sessions[0]?.updatedAt || runs[0]?.updatedAt || new Date().toISOString(),
  };

  return {
    ok: true,
    asOf: summary.latestUpdatedAt,
    summary,
    authorityState: governance.authorityState,
    dailyBias: governance.dailyBias,
    authorityEvents: governance.authorityEvents,
    dailyRuns: governance.dailyRuns,
    lanes: [
      {
        key: 'sessions',
        title: 'Sessions',
        status: summary.runningSessions > 0 ? 'warn' : 'healthy',
        detail: `${summary.sessions} agent sessions are currently tracked with ${summary.completedSessions} completed.`,
        primaryCount: summary.runningSessions,
        secondaryCount: summary.completedSessions,
        updatedAt: sessions[0]?.updatedAt || summary.latestUpdatedAt,
      },
      {
        key: 'analysis',
        title: 'Analysis',
        status: summary.failedAnalyses > 0 ? 'warn' : 'healthy',
        detail: `${runs.length} analysis runs have been recorded with ${summary.failedAnalyses} failures.`,
        primaryCount: summary.failedAnalyses,
        secondaryCount: countBy(runs, (item: any) => item.status === 'completed'),
        updatedAt: runs[0]?.updatedAt || summary.latestUpdatedAt,
      },
      {
        key: 'requests',
        title: 'Requests',
        status: summary.pendingActionRequests > 0 ? 'warn' : 'healthy',
        detail: `${summary.pendingActionRequests} action requests are waiting for operator review.`,
        primaryCount: summary.pendingActionRequests,
        secondaryCount: countBy(
          requests,
          (item: any) => item.status === 'approved' || item.status === 'rejected'
        ),
        updatedAt: requests[0]?.updatedAt || summary.latestUpdatedAt,
      },
      {
        key: 'trail',
        title: 'Operator Trail',
        status: operatorActions.length > 0 || notifications.length > 0 ? 'warn' : 'healthy',
        detail: `${auditRecords.length} audit events, ${notifications.length} notifications, and ${operatorActions.length} operator actions are linked to agent activity.`,
        primaryCount: notifications.length,
        secondaryCount: operatorActions.length,
        updatedAt:
          notifications[0]?.createdAt ||
          operatorActions[0]?.createdAt ||
          auditRecords[0]?.createdAt ||
          summary.latestUpdatedAt,
      },
    ],
    runbook: buildRunbook(summary),
    queues: {
      pendingActionRequests: requests
        .filter((item: any) => item.status === 'pending_review')
        .slice(0, limit),
      recentSessions: sessions.slice(0, limit),
      recentAnalysisRuns: runs.slice(0, limit),
    },
    recentExplanations: buildRecentExplanations(runs),
    operatorTimeline: [
      ...auditRecords.slice(0, 8).map((item: any) => ({
        lane: 'audit',
        title: item.title,
        detail: item.detail,
        actor: item.actor,
        at: item.createdAt,
      })),
      ...operatorActions.slice(0, 8).map((item: any) => ({
        lane: 'operator',
        title: item.title,
        detail: item.detail,
        actor: item.actor,
        at: item.createdAt,
      })),
    ]
      .sort((left: any, right: any) => new Date(right.at).getTime() - new Date(left.at).getTime())
      .slice(0, limit),
  };
}

export function getAgentOperatorTimeline(sessionId: string | undefined, options: Record<string, any> = {}) {
  const session = controlPlaneRuntime.getAgentSession(sessionId);
  if (!session) {
    return {
      ok: false,
      error: 'agent_session_not_found',
      message: `Unknown agent session: ${sessionId || 'missing sessionId'}`,
    };
  }

  return {
    ok: true,
    sessionId,
    asOf: session.updatedAt || new Date().toISOString(),
    timeline: buildSessionTimeline(session, options),
  };
}

export function getAgentSessionLinkedArtifacts(sessionId: string, options: Record<string, any> = {}) {
  const session = controlPlaneRuntime.getAgentSession(sessionId);
  if (!session) {
    return {
      ok: false,
      error: 'agent_session_not_found',
      message: `Unknown agent session: ${sessionId || 'missing sessionId'}`,
    };
  }

  const limit = parseLimit(options.limit, 20);
  const requests = controlPlaneRuntime
    .listAgentActionRequests(limit * 4)
    .filter(
      (item: any) =>
        item.id === session.latestActionRequestId ||
        item.metadata?.agentSessionId === session.id ||
        (session.latestIntent?.targetId &&
          item.targetId === session.latestIntent.targetId &&
          item.requestedBy === session.requestedBy)
    )
    .slice(0, limit);
  const notifications = controlPlaneRuntime
    .listNotifications(limit * 4)
    .filter((item: any) =>
      requests.some((request: any) => request.id === item.metadata?.agentActionRequestId)
    )
    .slice(0, limit);
  const operatorActions = controlPlaneRuntime
    .listOperatorActions(limit * 4)
    .filter((item: any) =>
      requests.some((request: any) => request.id === item.metadata?.agentActionRequestId)
    )
    .slice(0, limit);

  return {
    ok: true,
    sessionId,
    requests,
    notifications,
    operatorActions,
  };
}
