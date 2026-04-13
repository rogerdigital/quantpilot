import type { BrokerOrder, TradingState } from '@shared-types/trading.ts';
import { executeStrategy as sharedExecuteStrategy } from '../../../../../../packages/trading-engine/src/runtime.js';

export function executeStrategy(
  state: TradingState,
  brokerSupportsRemoteExecution: boolean
): { liveIntents: BrokerOrder[] } {
  return sharedExecuteStrategy(state, brokerSupportsRemoteExecution);
}
