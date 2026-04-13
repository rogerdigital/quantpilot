// @ts-nocheck
import {
  computeAccount,
  createAccount,
  createInitialStockStates,
  DEFAULT_ENGINE_CONFIG,
  logEvent,
} from '../../../../packages/trading-engine/src/runtime.js';

export function createTradingState() {
  const stockStates = createInitialStockStates(DEFAULT_ENGINE_CONFIG);
  const paper = createAccount('paper', 'Paper', 120000, {
    AAPL: { shares: 42, avgCost: 198.6 },
    NVDA: { shares: 12, avgCost: 801.2 },
  });
  const live = createAccount('live', 'Live Account', 80000, {
    MSFT: { shares: 18, avgCost: 401.5 },
  });

  const state = {
    config: {
      refreshMs: 6000,
      ...DEFAULT_ENGINE_CONFIG,
    },
    mode: 'autopilot',
    toggles: {
      autoTrade: true,
      liveTrade: false,
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
        provider: 'simulated',
        label: 'Simulated Market',
        connected: true,
        message: 'Waiting for test market sync.',
      },
      broker: {
        provider: 'simulated',
        label: 'Simulated Broker',
        connected: true,
        message: 'Waiting for test broker sync.',
      },
    },
    stockStates,
    accounts: {
      paper,
      live,
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

  computeAccount(state.accounts.paper, state.stockStates);
  computeAccount(state.accounts.live, state.stockStates);
  logEvent(state, 'info', 'System Started', 'Test state initialized for API integration routes.');

  return state;
}
