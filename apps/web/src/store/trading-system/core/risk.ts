import type { BrokerOrder, TradingState } from '@shared-types/trading.ts';
import { riskOffIfNeeded as sharedRiskOffIfNeeded } from '../../../../../../packages/trading-engine/src/runtime.js';

export function riskOffIfNeeded(state: TradingState, brokerSupportsRemoteExecution: boolean): BrokerOrder[] {
  return sharedRiskOffIfNeeded(state, brokerSupportsRemoteExecution);
}
