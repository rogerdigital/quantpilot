import type { ControlPlaneResolution, TradingState } from '@shared-types/trading.ts';
import { applyBrokerSnapshot, applyRemoteOrderSubmissions } from './execution.ts';
import { computeAccount, logEvent } from './shared.ts';

export function applyControlPlaneResolution(state: TradingState, resolution: ControlPlaneResolution) {
  const previousCycleId = state.controlPlane.lastCycleId;
  state.controlPlane = {
    ...resolution.controlPlane,
  };

  state.integrationStatus.broker.connected = resolution.brokerHealth.connected;
  state.integrationStatus.broker.message = resolution.brokerHealth.connected
    ? `Control plane verified broker adapter ${resolution.brokerHealth.adapter}.`
    : `Control plane marked broker adapter ${resolution.brokerHealth.adapter} as degraded.`;

  applyRemoteOrderSubmissions(state, resolution.brokerExecution.submittedOrders || []);
  (resolution.brokerExecution.rejectedOrders || []).forEach((order) => {
    logEvent(state, 'info', `Remote order rejected ${order.symbol}`, `${order.side} ${order.qty} shares were rejected by broker.`);
  });
  applyBrokerSnapshot(state, resolution.brokerExecution.snapshot);
  computeAccount(state.accounts.paper, state.stockStates);
  computeAccount(state.accounts.live, state.stockStates);

  if (resolution.controlPlane.routeHint) {
    state.routeCopy = resolution.controlPlane.routeHint;
  }

  if (resolution.cycle.id !== previousCycleId) {
    logEvent(
      state,
      'info',
      `Control plane synced cycle ${resolution.cycle.cycle}`,
      resolution.controlPlane.routeHint || `Control plane status ${resolution.controlPlane.lastStatus}.`
    );
  }
}
