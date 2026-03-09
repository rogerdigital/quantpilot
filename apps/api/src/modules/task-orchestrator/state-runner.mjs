import {
  advanceLocalState,
  applyControlPlaneResolution,
  buildCyclePayload,
} from '../../../../../packages/trading-engine/src/runtime.mjs';
import { queueRiskScan } from '../risk/service.mjs';
import { completeWorkflow, failWorkflow, startWorkflow } from './service.mjs';
import { runCycle } from './cycle-runner.mjs';

function getBrokerProvider(state) {
  return state?.integrationStatus?.broker?.provider || 'simulated';
}

function getMarketProvider(state) {
  return state?.integrationStatus?.marketData?.provider || 'simulated';
}

function getTrackedSymbols(state) {
  return Array.isArray(state?.stockStates)
    ? state.stockStates.map((stock) => stock.symbol).filter(Boolean)
    : [];
}

export async function runStateCycle(previousState, context) {
  const workflow = startWorkflow({
    workflowId: 'task-orchestrator.state-run',
    workflowType: 'task-orchestrator',
    actor: 'state-runner',
    trigger: 'api',
    payload: {
      cycle: Number(previousState?.cycle || 0) + 1,
      mode: previousState?.mode || 'autopilot',
    },
    maxAttempts: Number(previousState?.controlPlane?.maxAttempts || 3),
    steps: [
      { key: 'load-market-snapshot', status: 'running' },
      { key: 'advance-local-state', status: 'pending' },
      { key: 'resolve-cycle', status: 'pending' },
      { key: 'enqueue-risk-scan', status: 'pending' },
    ],
  });

  try {
    const marketSnapshot = await context.getMarketSnapshot({
      provider: getMarketProvider(previousState),
      symbols: getTrackedSymbols(previousState),
    });

    const state = advanceLocalState(previousState, {
      marketSnapshot,
      brokerSupportsRemoteExecution: getBrokerProvider(previousState) !== 'simulated',
    });

    const resolution = await runCycle(buildCyclePayload(state), context);
    applyControlPlaneResolution(state, resolution);
    queueRiskScan({
      cycle: state.cycle,
      mode: state.mode,
      riskLevel: state.riskLevel,
      pendingApprovals: state.approvalQueue.length,
      brokerConnected: state.integrationStatus.broker.connected,
      marketConnected: state.integrationStatus.marketData.connected,
      paperExposure: state.accounts.paper.exposure,
      liveExposure: state.accounts.live.exposure,
      routeHint: state.controlPlane.routeHint,
      source: 'state-runner',
    });

    const persistedWorkflow = completeWorkflow(workflow.id, {
      steps: [
        { key: 'load-market-snapshot', status: 'completed' },
        { key: 'advance-local-state', status: 'completed', cycle: state.cycle },
        { key: 'resolve-cycle', status: 'completed', workflowId: resolution.workflow?.id || '' },
        { key: 'enqueue-risk-scan', status: 'completed' },
      ],
      result: {
        ok: true,
        cycle: state.cycle,
        lastStatus: state.controlPlane.lastStatus,
        riskLevel: state.riskLevel,
      },
    });

    return {
      ok: true,
      state,
      resolution,
      workflow: persistedWorkflow,
    };
  } catch (error) {
    const failedWorkflow = failWorkflow(workflow.id, error instanceof Error ? error.message : 'unknown state workflow error', {
      steps: [
        { key: 'load-market-snapshot', status: 'failed' },
        { key: 'advance-local-state', status: 'skipped' },
        { key: 'resolve-cycle', status: 'skipped' },
        { key: 'enqueue-risk-scan', status: 'skipped' },
      ],
    });
    throw Object.assign(error instanceof Error ? error : new Error('state workflow failed'), {
      workflowId: failedWorkflow?.id,
    });
  }
}
