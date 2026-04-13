import type { BrokerProvider, MarketDataProvider, TradingState } from '@shared-types/trading.ts';
import { createInitialStockStates } from '../../../../../../packages/trading-engine/src/runtime.js';
import { runtimeConfig } from '../../../app/config/runtime.ts';
import { APP_CONFIG } from './config.ts';
import { computeAccount, createAccount, logEvent } from './shared.ts';

function initialState(): TradingState {
  return {
    config: APP_CONFIG,
    mode: 'autopilot',
    toggles: {
      autoTrade: true,
      liveTrade: true,
      riskGuard: true,
      manualApproval: true,
    },
    cycle: 0,
    orderSeq: 1,
    marketClock: '',
    engineStatus: 'BOOTING',
    riskLevel: 'NORMAL',
    decisionSummary: '',
    decisionCopy: '',
    routeCopy: '',
    integrationStatus: {
      marketData: {
        provider: runtimeConfig.marketDataProvider,
        label: '',
        connected: true,
        message: '',
      },
      broker: {
        provider: runtimeConfig.brokerProvider,
        label: '',
        connected: true,
        message: '',
      },
    },
    stockStates: createInitialStockStates(APP_CONFIG),
    accounts: {
      paper: createAccount('paper', 'Paper', 120000, {
        AAPL: { shares: 42, avgCost: 198.6 },
        NVDA: { shares: 12, avgCost: 801.2 },
        JPM: { shares: 26, avgCost: 186.7 },
      }),
      live: createAccount('live', 'Live Account', 80000, {
        MSFT: { shares: 18, avgCost: 401.5 },
        AMZN: { shares: 24, avgCost: 171.1 },
      }),
    },
    approvalQueue: [],
    pendingLiveIntents: [],
    brokerOrderStatusMap: {},
    activityLog: [],
    controlPlane: {
      lastCycleId: '',
      lastStatus: 'IDLE',
      operator: 'control-plane',
      notificationCount: 0,
      auditCount: 0,
      routeHint: 'Control plane has not resolved the first cycle yet.',
      lastSyncAt: '',
    },
  };
}

export function createInitialState(providers: {
  marketData: MarketDataProvider;
  broker: BrokerProvider;
}) {
  const base = initialState();
  base.integrationStatus.marketData.label = providers.marketData.label;
  base.integrationStatus.marketData.message = 'Waiting for the first market sync.';
  base.integrationStatus.broker.label = providers.broker.label;
  base.integrationStatus.broker.message = 'Waiting for the first broker sync.';
  computeAccount(base.accounts.paper, base.stockStates);
  computeAccount(base.accounts.live, base.stockStates);
  logEvent(
    base,
    'info',
    'System Started',
    'The trading engine finished universe initialization and account loading.'
  );
  return base;
}
