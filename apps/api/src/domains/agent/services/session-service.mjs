import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';
import { getAgentOperatorTimeline, getAgentSessionLinkedArtifacts } from './workbench-service.mjs';

export function listAgentSessionsSnapshot(limit = 20) {
  const sessions = controlPlaneRuntime.listAgentSessions(limit);
  return {
    ok: true,
    asOf: sessions[0]?.updatedAt || new Date().toISOString(),
    sessions,
  };
}

export function getAgentSessionDetail(sessionId) {
  const session = controlPlaneRuntime.getAgentSession(sessionId);
  if (!session) {
    return {
      ok: false,
      error: 'agent_session_not_found',
      message: `Unknown agent session: ${sessionId || 'missing sessionId'}`,
    };
  }

  const latestPlan = session.latestPlanId ? controlPlaneRuntime.getAgentPlan(session.latestPlanId) : null;
  const latestAnalysisRun = session.latestAnalysisRunId ? controlPlaneRuntime.getAgentAnalysisRun(session.latestAnalysisRunId) : null;
  const plans = controlPlaneRuntime.listAgentPlans(20, { sessionId });
  const analysisRuns = controlPlaneRuntime.listAgentAnalysisRuns(20, { sessionId });
  const timeline = getAgentOperatorTimeline(sessionId, { limit: 20 }).timeline;
  const linked = getAgentSessionLinkedArtifacts(sessionId, { limit: 20 });

  return {
    ok: true,
    session,
    latestPlan,
    latestAnalysisRun,
    plans,
    analysisRuns,
    linkedRequests: linked.requests,
    linkedNotifications: linked.notifications,
    linkedOperatorActions: linked.operatorActions,
    timeline,
  };
}
