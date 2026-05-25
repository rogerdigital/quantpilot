import type { RuntimeConfig } from '@shared-types/trading.ts';
import { API_PREFIX } from '../api/http.ts';

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function tradingModeFromEnv(value: string | undefined): RuntimeConfig['tradingMode'] {
  return value === 'paper' || value === 'live' ? value : 'simulated';
}

export const runtimeConfig: RuntimeConfig = {
  refreshMs: numberFromEnv(import.meta.env.VITE_REFRESH_MS, 5000),
  tradingMode: tradingModeFromEnv(import.meta.env.VITE_TRADING_MODE),
  marketDataProvider: (import.meta.env.VITE_MARKET_DATA_PROVIDER ||
    'simulated') as RuntimeConfig['marketDataProvider'],
  marketDataHttpUrl: import.meta.env.VITE_MARKET_DATA_HTTP_URL || '',
  brokerProvider: (import.meta.env.VITE_BROKER_PROVIDER ||
    'simulated') as RuntimeConfig['brokerProvider'],
  brokerHttpUrl: import.meta.env.VITE_BROKER_HTTP_URL || '',
  alpacaProxyBase: import.meta.env.VITE_ALPACA_PROXY_BASE || `${API_PREFIX}/alpaca`,
};
