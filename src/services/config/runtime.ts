import type { RuntimeConfig } from '../../shared/types/trading.ts';

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const runtimeConfig: RuntimeConfig = {
  refreshMs: numberFromEnv(import.meta.env.VITE_REFRESH_MS, 1800),
  marketDataProvider: (import.meta.env.VITE_MARKET_DATA_PROVIDER || 'simulated') as RuntimeConfig['marketDataProvider'],
  marketDataHttpUrl: import.meta.env.VITE_MARKET_DATA_HTTP_URL || '',
  brokerProvider: (import.meta.env.VITE_BROKER_PROVIDER || 'simulated') as RuntimeConfig['brokerProvider'],
  brokerHttpUrl: import.meta.env.VITE_BROKER_HTTP_URL || '',
  alpacaProxyBase: import.meta.env.VITE_ALPACA_PROXY_BASE || '/api/alpaca',
};
