import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';

const RETRY_LIMIT = 2;

function hasExecutionLink(incident, detail) {
  return Array.isArray(incident?.links) && incident.links.some((link) => (
    (link?.executionPlanId && String(link.executionPlanId) === String(detail.plan.id))
    || (link?.executionRunId && String(link.executionRunId) === String(detail.executionRun?.id || ''))
    || (link?.workflowRunId && String(link.workflowRunId) === String(detail.plan.workflowRunId || ''))
    || (link?.brokerEventId && String(link.brokerEventId) === String(detail.brokerEvents?.[0]?.id || ''))
  ));
}

function mergeIncidentLinks(detail, policy, brokerEvent = null) {
  const links = [
    {
      kind: 'execution-plan',
      executionPlanId: detail.plan.id,
      executionRunId: detail.executionRun?.id || '',
      workflowRunId: detail.plan.workflowRunId || '',
      strategyId: detail.plan.strategyId || '',
    },
  ];

  if (detail.plan.workflowRunId) {
    links.push({
      kind: 'workflow-run',
      workflowRunId: detail.plan.workflowRunId,
      workflowId: detail.workflow?.workflowId || '',
    });
  }

  if (brokerEvent?.id || policy.latestBrokerEventId) {
    links.push({
      kind: 'broker-event',
      brokerEventId: brokerEvent?.id || policy.latestBrokerEventId || '',
      brokerEventType: brokerEvent?.eventType || policy.latestBrokerEventType || '',
    });
  }

  return links;
}

export function listLinkedExecutionIncidents(detail, options = {}) {
  const incidents = controlPlaneRuntime.listIncidents(Number(options.limit || 120), {
    source: options.source || '',
  });

  return incidents.filter((incident) => hasExecutionLink(incident, detail));
}

export function buildExecutionExceptionPolicy(detail) {
  const brokerEvents = Array.isArray(detail.brokerEvents) ? detail.brokerEvents : [];
  const orderStates = Array.isArray(detail.orderStates) ? detail.orderStates : [];
  const linkedIncidents = Array.isArray(detail.linkedIncidents)
    ? detail.linkedIncidents
    : listLinkedExecutionIncidents(detail, { limit: 120 });
  const openIncident = linkedIncidents.find((incident) => incident.status !== 'resolved') || null;
  const rejectedEvents = brokerEvents.filter((item) => item.eventType === 'rejected');
  const cancelledEvents = brokerEvents.filter((item) => item.eventType === 'cancelled');
  const fillEvents = brokerEvents.filter((item) => item.eventType === 'partial_fill' || item.eventType === 'filled');
  const workflowRetryScheduled = detail.workflow?.status === 'retry_scheduled';
  const workflowFailed = detail.workflow?.status === 'failed' || detail.workflow?.status === 'canceled';
  const reconciliationStatus = detail.reconciliation?.status || 'missing_snapshot';
  const hardReconciliationDrift = reconciliationStatus === 'drift';
  const attentionReconciliation = reconciliationStatus === 'attention' || reconciliationStatus === 'missing_snapshot';
  const openOrders = orderStates.filter((item) => ['submitted', 'acknowledged'].includes(item.lifecycleStatus)).length;
  const filledOrders = orderStates.filter((item) => item.lifecycleStatus === 'filled').length;
  const retryCount = rejectedEvents.length + cancelledEvents.length;
  const remainingRetries = Math.max(0, RETRY_LIMIT - retryCount);
  const latestBrokerEvent = brokerEvents[0] || null;

  const reasons = [];
  let status = 'stable';
  let category = 'none';
  let recommendedAction = 'none';
  let retryEligible = false;
  let incidentRecommended = false;

  if (workflowRetryScheduled) {
    status = 'retrying';
    category = 'workflow_retry';
    recommendedAction = 'resume_workflow';
    reasons.push('The linked execution workflow is already retry scheduled.');
  }

  if (workflowFailed && status === 'stable') {
    status = 'retrying';
    category = 'workflow_retry';
    recommendedAction = 'resume_workflow';
    reasons.push(`The linked workflow is ${detail.workflow.status} and needs execution recovery.`);
  }

  if ((rejectedEvents.length > 0 || cancelledEvents.length > 0) && status === 'stable') {
    category = rejectedEvents.length > 0 ? 'broker_reject' : 'broker_cancel';
    reasons.push(
      rejectedEvents.length > 0
        ? `Broker reported ${rejectedEvents.length} reject event(s).`
        : `Broker reported ${cancelledEvents.length} cancel event(s).`,
    );

    if (filledOrders > 0 || fillEvents.length > 0) {
      status = 'compensation';
      recommendedAction = 'reconcile';
      incidentRecommended = true;
      reasons.push('Execution already has fills, so compensation needs reconciliation and incident tracking.');
    } else if (remainingRetries > 0) {
      status = 'retrying';
      recommendedAction = 'reroute_orders';
      retryEligible = true;
      reasons.push(`Retry budget is still available (${remainingRetries}/${RETRY_LIMIT} remaining).`);
    } else {
      status = 'incident';
      recommendedAction = 'open_incident';
      incidentRecommended = true;
      reasons.push('Retry budget is exhausted and the exception should be escalated into incident handling.');
    }
  }

  if (hardReconciliationDrift) {
    status = openIncident ? 'incident' : 'compensation';
    category = category === 'none' ? 'reconciliation_drift' : 'mixed';
    recommendedAction = openIncident ? 'reconcile' : 'open_incident';
    incidentRecommended = true;
    reasons.push('Execution reconciliation is in drift and needs operator compensation.');
  } else if (attentionReconciliation && status === 'stable') {
    status = 'attention';
    category = 'reconciliation_drift';
    recommendedAction = 'reconcile';
    reasons.push(`Execution reconciliation is ${reconciliationStatus}.`);
  }

  if (openIncident) {
    status = 'incident';
    recommendedAction = hardReconciliationDrift ? 'reconcile' : 'open_incident';
    incidentRecommended = true;
    reasons.push(`Linked incident ${openIncident.id} is still ${openIncident.status}.`);
  }

  if (status === 'stable' && detail.plan.lifecycleStatus === 'filled' && openOrders === 0) {
    reasons.push('Execution lifecycle is filled with no open orders and no active broker exceptions.');
  }

  let headline = 'Execution exception posture is stable.';
  if (status === 'retrying') {
    headline = retryEligible
      ? 'Execution can be retried inside the current guardrails.'
      : 'Execution retry handling is active.';
  } else if (status === 'compensation') {
    headline = 'Execution needs compensation review before it can be considered stable.';
  } else if (status === 'incident') {
    headline = openIncident
      ? 'Execution exception is being tracked through an incident.'
      : 'Execution exception should be escalated into an incident.';
  } else if (status === 'attention') {
    headline = 'Execution needs follow-up review.';
  }

  return {
    status,
    category,
    retryEligible,
    retryCount,
    retryLimit: RETRY_LIMIT,
    remainingRetries,
    recommendedAction,
    incidentRecommended,
    linkedIncidentId: openIncident?.id || '',
    linkedIncidentStatus: openIncident?.status || '',
    linkedIncidentCount: linkedIncidents.length,
    latestBrokerEventId: latestBrokerEvent?.id || '',
    latestBrokerEventType: latestBrokerEvent?.eventType || '',
    headline,
    reasons,
  };
}

export function syncExecutionExceptionState(detail, options = {}) {
  const actor = options.actor || 'execution-desk';
  const now = options.now || new Date().toISOString();
  const policy = buildExecutionExceptionPolicy(detail);
  const metadataPatch = {
    exceptionPolicy: policy,
    exceptionUpdatedAt: now,
  };

  controlPlaneRuntime.updateExecutionPlan(detail.plan.id, {
    metadata: {
      ...(detail.plan.metadata || {}),
      ...metadataPatch,
    },
    updatedAt: now,
  });

  if (detail.executionRun?.id) {
    controlPlaneRuntime.updateExecutionRun(detail.executionRun.id, {
      metadata: {
        ...(detail.executionRun.metadata || {}),
        ...metadataPatch,
      },
      updatedAt: now,
    });
  }

  const linkedIncidents = listLinkedExecutionIncidents(detail, { limit: 120 });
  const existingOpenIncident = linkedIncidents.find((incident) => incident.status !== 'resolved') || null;
  let incident = existingOpenIncident;

  if ((policy.incidentRecommended || policy.recommendedAction === 'open_incident') && !existingOpenIncident) {
    incident = controlPlaneRuntime.recordIncident({
      title: `Execution exception: ${detail.plan.strategyName}`,
      summary: policy.headline,
      severity: policy.category === 'reconciliation_drift' || detail.reconciliation?.status === 'drift' ? 'critical' : 'warn',
      source: 'execution',
      status: 'investigating',
      owner: detail.executionRun?.owner || actor,
      actor,
      links: mergeIncidentLinks(detail, policy, options.brokerEvent || null),
      createdAt: now,
      updatedAt: now,
      metadata: {
        executionPlanId: detail.plan.id,
        executionRunId: detail.executionRun?.id || '',
        workflowRunId: detail.plan.workflowRunId || '',
        strategyId: detail.plan.strategyId,
        exceptionPolicy: policy,
      },
    });
  } else if (existingOpenIncident && policy.status !== 'stable') {
    incident = controlPlaneRuntime.transitionIncident(existingOpenIncident.id, {
      actor,
      status: existingOpenIncident.status === 'open' ? 'investigating' : existingOpenIncident.status,
      severity: policy.category === 'reconciliation_drift' || detail.reconciliation?.status === 'drift' ? 'critical' : existingOpenIncident.severity,
      summary: policy.headline,
      links: mergeIncidentLinks(detail, policy, options.brokerEvent || null),
      updatedAt: now,
      metadata: {
        ...(existingOpenIncident.metadata || {}),
        executionPlanId: detail.plan.id,
        executionRunId: detail.executionRun?.id || '',
        workflowRunId: detail.plan.workflowRunId || '',
        exceptionPolicy: policy,
      },
    });
  } else if (existingOpenIncident && options.resolveOnStable && policy.status === 'stable') {
    incident = controlPlaneRuntime.transitionIncident(existingOpenIncident.id, {
      actor,
      status: 'mitigated',
      summary: 'Execution recovered and is back inside the current exception guardrails.',
      updatedAt: now,
    });
  }

  const syncedPolicy = incident
    ? {
        ...policy,
        linkedIncidentId: incident.id,
        linkedIncidentStatus: incident.status,
      }
    : policy;

  controlPlaneRuntime.updateExecutionPlan(detail.plan.id, {
    metadata: {
      ...(detail.plan.metadata || {}),
      exceptionPolicy: syncedPolicy,
      exceptionUpdatedAt: now,
    },
    updatedAt: now,
  });

  if (detail.executionRun?.id) {
    controlPlaneRuntime.updateExecutionRun(detail.executionRun.id, {
      metadata: {
        ...(detail.executionRun.metadata || {}),
        exceptionPolicy: syncedPolicy,
        exceptionUpdatedAt: now,
      },
      updatedAt: now,
    });
  }

  return {
    policy: syncedPolicy,
    incident,
  };
}
