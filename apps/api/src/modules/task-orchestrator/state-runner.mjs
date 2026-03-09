import {
  advanceLocalState,
  applyControlPlaneResolution,
  buildCyclePayload,
} from '../../../../../packages/trading-engine/src/runtime.mjs';
import { queueRiskScan } from '../risk/service.mjs';
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

  return {
    ok: true,
    state,
    resolution,
  };
}
