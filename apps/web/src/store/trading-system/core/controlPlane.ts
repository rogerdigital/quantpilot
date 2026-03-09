import type { ControlPlaneResolution, TradingState } from '@shared-types/trading.ts';
import { logEvent } from './shared.ts';

export function applyControlPlaneResolution(state: TradingState, resolution: ControlPlaneResolution) {
  const previousCycleId = state.controlPlane.lastCycleId;
  state.controlPlane = {
    ...resolution.controlPlane,
  };

  state.integrationStatus.broker.connected = resolution.brokerHealth.connected;
  state.integrationStatus.broker.message = resolution.brokerHealth.connected
    ? `Control plane verified broker adapter ${resolution.brokerHealth.adapter}.`
    : `Control plane marked broker adapter ${resolution.brokerHealth.adapter} as degraded.`;

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
