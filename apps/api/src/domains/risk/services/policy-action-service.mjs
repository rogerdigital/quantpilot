import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';
import { getRiskWorkbench } from './workbench-service.mjs';

const RISK_POLICY_ACTION_KEYS = new Set([
  'review-risk-off',
  'clear-review-queue',
  'inspect-live-exposure',
  'triage-risk-incidents',
  'review-scheduler-drift',
  'check-compliance-alerts',
  'release-emergency-brake',
]);

function resolveTargets(actionKey, workbench) {
  if (actionKey === 'review-risk-off') {
    return {
      riskEvents: workbench.reviewQueue.riskEvents.filter((item) => item.status === 'risk-off'),
      executionPlans: workbench.reviewQueue.executionPlans.filter((item) => item.riskStatus === 'blocked'),
      backtestRuns: [],
      incidents: workbench.reviewQueue.incidents,
      schedulerTicks: [],
    };
  }

  if (actionKey === 'clear-review-queue') {
    return {
      riskEvents: [],
      executionPlans: workbench.reviewQueue.executionPlans,
      backtestRuns: workbench.reviewQueue.backtestRuns,
      incidents: workbench.reviewQueue.incidents,
      schedulerTicks: [],
    };
  }

  if (actionKey === 'inspect-live-exposure') {
    return {
      riskEvents: workbench.recent.riskEvents.filter((item) => item.source === 'risk-monitor'),
      executionPlans: workbench.reviewQueue.executionPlans.slice(0, 2),
      backtestRuns: [],
      incidents: workbench.reviewQueue.incidents,
      schedulerTicks: [],
    };
  }

  if (actionKey === 'triage-risk-incidents') {
    return {
      riskEvents: [],
      executionPlans: [],
      backtestRuns: [],
      incidents: workbench.reviewQueue.incidents,
      schedulerTicks: [],
    };
  }

  if (actionKey === 'review-scheduler-drift') {
    return {
      riskEvents: workbench.linkage.queue.riskEvents,
      executionPlans: workbench.reviewQueue.executionPlans.filter((item) => item.riskStatus === 'review' || item.approvalState === 'required'),
      backtestRuns: [],
      incidents: workbench.linkage.queue.incidents,
      schedulerTicks: workbench.reviewQueue.schedulerTicks,
    };
  }

  if (actionKey === 'check-compliance-alerts') {
    return {
      riskEvents: workbench.reviewQueue.riskEvents.filter((item) => {
        const message = `${item.title} ${item.message}`.toLowerCase();
        return message.includes('compliance') || message.includes('policy');
      }),
      executionPlans: workbench.reviewQueue.executionPlans,
      backtestRuns: workbench.reviewQueue.backtestRuns,
      incidents: workbench.reviewQueue.incidents,
      schedulerTicks: [],
    };
  }

  return {
    riskEvents: workbench.reviewQueue.riskEvents.filter((item) => item.status === 'risk-off'),
    executionPlans: workbench.reviewQueue.executionPlans.filter((item) => item.riskStatus === 'blocked' || item.status === 'blocked'),
    backtestRuns: [],
    incidents: workbench.reviewQueue.incidents,
    schedulerTicks: workbench.reviewQueue.schedulerTicks,
  };
}

function buildDescriptor(actionKey, workbench, targets) {
  const hasCriticalIncident = targets.incidents.some((item) => item.severity === 'critical');
  const hasRiskOff = targets.riskEvents.some((item) => item.status === 'risk-off');
  const hasCompliance = targets.riskEvents.some((item) => `${item.title} ${item.message}`.toLowerCase().includes('compliance') || `${item.title} ${item.message}`.toLowerCase().includes('policy'));
  const schedulerPhase = targets.schedulerTicks[0]?.phase || workbench.linkage.summary.activePhase || 'INTRADAY';

  if (actionKey === 'review-risk-off') {
    return {
      level: hasRiskOff || hasCriticalIncident ? 'critical' : 'warn',
      title: 'Review risk-off escalations',
      detail: 'Risk-off events were moved into an active middleware review so the operator can explain the block and decide the next mitigation step.',
      riskLevel: hasRiskOff ? 'RISK OFF' : 'REVIEW',
      schedulerPhase: schedulerPhase || 'INTRADAY',
    };
  }
  if (actionKey === 'clear-review-queue') {
    return {
      level: targets.executionPlans.length || targets.backtestRuns.length ? 'warn' : 'info',
      title: 'Clear review queue',
      detail: 'Execution approvals and backtest review backlog were gathered into one risk-policy pass to keep the review queue from drifting.',
      riskLevel: 'REVIEW',
      schedulerPhase,
    };
  }
  if (actionKey === 'inspect-live-exposure') {
    return {
      level: workbench.summary.liveExposurePct >= 60 || workbench.summary.concentrationPct >= 20 ? 'warn' : 'info',
      title: 'Inspect live exposure',
      detail: 'Live exposure and concentration were reviewed against the current risk guardrails to confirm whether portfolio posture still fits the active policy.',
      riskLevel: 'REVIEW',
      schedulerPhase,
    };
  }
  if (actionKey === 'triage-risk-incidents') {
    return {
      level: hasCriticalIncident ? 'critical' : 'warn',
      title: 'Triage risk incidents',
      detail: 'Risk incidents were moved into an active triage pass so ownership, mitigation notes, and next actions are explicit on the middleware path.',
      riskLevel: 'REVIEW',
      schedulerPhase,
    };
  }
  if (actionKey === 'review-scheduler-drift') {
    return {
      level: targets.schedulerTicks.length ? 'warn' : 'info',
      title: 'Review scheduler drift',
      detail: `Scheduler-linked risk posture was reviewed for the ${schedulerPhase} window so timing drift does not silently distort the risk middleware path.`,
      riskLevel: 'REVIEW',
      schedulerPhase,
    };
  }
  if (actionKey === 'check-compliance-alerts') {
    return {
      level: hasCompliance ? 'critical' : 'warn',
      title: 'Check compliance alerts',
      detail: 'Compliance-linked signals were gathered into a formal policy review so remaining constraints are visible before execution or promotion proceeds.',
      riskLevel: 'REVIEW',
      schedulerPhase,
    };
  }
  return {
    level: targets.executionPlans.length || hasRiskOff ? 'critical' : 'warn',
    title: 'Review emergency brake',
    detail: 'Blocked execution plans and risk-off posture were reviewed as one emergency-brake decision so the operator can decide whether to keep or release the block.',
    riskLevel: hasRiskOff ? 'RISK OFF' : 'REVIEW',
    schedulerPhase,
  };
}

function buildIncidentLinks(targets) {
  return [
    ...targets.riskEvents.map((item) => ({ kind: 'risk-event', riskEventId: item.id, source: item.source })),
    ...targets.executionPlans.map((item) => ({ kind: 'execution-plan', planId: item.id, strategyId: item.strategyId })),
    ...targets.backtestRuns.map((item) => ({ kind: 'backtest-run', runId: item.id, strategyId: item.strategyId })),
    ...targets.schedulerTicks.map((item) => ({ kind: 'scheduler-tick', tickId: item.id, phase: item.phase })),
  ].slice(0, 12);
}

function upsertRiskIncidents(actor, descriptor, targets) {
  const touched = [];
  const noteBody = `${descriptor.title} policy action executed by ${actor}. ${descriptor.detail}`;
  const existing = targets.incidents.filter((item) => item.status !== 'resolved');

  existing.forEach((incident) => {
    const transitioned = controlPlaneRuntime.transitionIncident(incident.id, {
      actor,
      owner: incident.owner || actor,
      status: incident.status === 'open' ? 'investigating' : incident.status,
      summary: incident.summary || descriptor.detail,
    });
    if (!transitioned) return;
    touched.push(transitioned);
    controlPlaneRuntime.recordIncidentNote(transitioned.id, {
      author: actor,
      body: noteBody,
      metadata: {
        riskPolicyAction: descriptor.title,
      },
    });
  });

  if (!touched.length && descriptor.level !== 'info') {
    const incident = controlPlaneRuntime.recordIncident({
      title: `${descriptor.title} requires follow-up`,
      summary: descriptor.detail,
      severity: descriptor.level === 'critical' ? 'critical' : 'warn',
      source: 'risk',
      status: 'investigating',
      owner: actor,
      actor,
      links: buildIncidentLinks(targets),
      tags: ['risk', 'policy', descriptor.schedulerPhase.toLowerCase()].filter(Boolean),
      metadata: {
        riskPolicyAction: descriptor.title,
        schedulerPhase: descriptor.schedulerPhase,
      },
    });
    if (incident) {
      touched.push(incident);
      controlPlaneRuntime.recordIncidentNote(incident.id, {
        author: actor,
        body: noteBody,
        metadata: {
          riskPolicyAction: descriptor.title,
          autoCreated: true,
        },
      });
    }
  }

  return touched;
}

export function runRiskPolicyAction(payload = {}) {
  const actionKey = String(payload.actionKey || '').trim();
  if (!RISK_POLICY_ACTION_KEYS.has(actionKey)) {
    return {
      ok: false,
      message: 'unknown risk policy action',
    };
  }

  const actor = String(payload.actor || 'operator').trim() || 'operator';
  const workbench = getRiskWorkbench({
    hours: payload.hours,
    limit: payload.limit,
  });
  const targets = resolveTargets(actionKey, workbench);
  const descriptor = buildDescriptor(actionKey, workbench, targets);
  const incidents = upsertRiskIncidents(actor, descriptor, targets);
  const linkedIncidentIds = incidents.map((item) => item.id);
  const linkedRiskEventIds = targets.riskEvents.map((item) => item.id);
  const linkedExecutionPlanIds = targets.executionPlans.map((item) => item.id);
  const linkedBacktestRunIds = targets.backtestRuns.map((item) => item.id);
  const linkedSchedulerTickIds = targets.schedulerTicks.map((item) => item.id);

  const operatorAction = controlPlaneRuntime.recordOperatorAction({
    type: `risk.policy.${actionKey}`,
    actor,
    title: descriptor.title,
    detail: descriptor.detail,
    level: descriptor.level,
    metadata: {
      incidentIds: linkedIncidentIds,
      riskEventIds: linkedRiskEventIds,
      executionPlanIds: linkedExecutionPlanIds,
      backtestRunIds: linkedBacktestRunIds,
      schedulerTickIds: linkedSchedulerTickIds,
      schedulerPhase: descriptor.schedulerPhase,
    },
  });

  const riskEvent = controlPlaneRuntime.appendRiskEvent({
    title: `${descriptor.title} policy action`,
    message: descriptor.detail,
    cycle: Number(targets.riskEvents[0]?.cycle || 0),
    riskLevel: descriptor.riskLevel,
    status: 'healthy',
    level: descriptor.level === 'critical' ? 'warn' : descriptor.level,
    source: 'risk-policy',
    metadata: {
      policyAction: actionKey,
      actor,
      incidentIds: linkedIncidentIds,
      executionPlanIds: linkedExecutionPlanIds,
      backtestRunIds: linkedBacktestRunIds,
      schedulerTickIds: linkedSchedulerTickIds,
    },
  });

  controlPlaneRuntime.enqueueNotification({
    level: descriptor.level === 'critical' ? 'critical' : 'warn',
    source: 'risk-policy',
    title: descriptor.title,
    message: descriptor.detail,
    metadata: {
      riskEventId: riskEvent.id,
      incidentIds: linkedIncidentIds,
      policyAction: actionKey,
    },
  });

  return {
    ok: true,
    action: {
      key: actionKey,
      actor,
      title: descriptor.title,
      detail: descriptor.detail,
      level: descriptor.level,
      executedAt: operatorAction.createdAt,
      linkedIncidentIds,
      linkedRiskEventIds,
      linkedExecutionPlanIds,
      linkedBacktestRunIds,
      linkedSchedulerTickIds,
    },
    operatorAction,
    riskEvent,
    incidents,
    workbench: getRiskWorkbench({
      hours: payload.hours,
      limit: payload.limit,
    }),
  };
}
