import type { BrokerProvider, MarketDataProvider, TradingState } from '@shared-types/trading.ts';
import { advanceLocalState as sharedAdvanceLocalState } from '../../../../../../packages/trading-engine/src/runtime.js';

export async function advanceState(
  previousState: TradingState,
  providers: { marketData: MarketDataProvider; broker: BrokerProvider }
): Promise<TradingState> {
  const marketSnapshot = await providers.marketData.getQuotePatch(previousState.stockStates);
  return sharedAdvanceLocalState(previousState, {
    marketSnapshot: {
      label: providers.marketData.label,
      connected: marketSnapshot.connected,
      message: marketSnapshot.message,
      quotes: marketSnapshot.quotes || [],
    },
    brokerSupportsRemoteExecution: providers.broker.supportsRemoteExecution,
  });
}
