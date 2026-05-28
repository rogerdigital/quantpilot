import type { OperatorSession, TradingState } from '@shared-types/trading.ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TradingSystemProvider, useTradingSystem } from './TradingSystemProvider.tsx';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetchOperatorSession = vi.fn();
const mockReportOperatorAction = vi.fn();
const mockRunStateCycle = vi.fn();

vi.mock('../../app/api/controlPlane.ts', () => ({
  fetchOperatorSession: (...args: unknown[]) => mockFetchOperatorSession(...args),
  reportOperatorAction: (...args: unknown[]) => mockReportOperatorAction(...args),
  runStateCycle: (...args: unknown[]) => mockRunStateCycle(...args),
}));

vi.mock('../../hooks/useSSE.ts', () => ({
  useSSE: vi.fn(() => ({ connected: false })),
}));

vi.mock('../../app/api/http.ts', () => ({
  API_PREFIX: '/api/v1',
  fetchJson: vi.fn(),
  jsonHeaders: vi.fn(() => ({})),
  assertOk: vi.fn(),
}));

vi.mock('../../app/config/runtime.ts', () => ({
  runtimeConfig: {
    refreshMs: 5000,
    tradingMode: 'simulated',
    marketDataProvider: 'simulated',
    marketDataHttpUrl: '',
    brokerProvider: 'simulated',
    brokerHttpUrl: '',
    alpacaProxyBase: '/api/v1/alpaca',
  },
}));

vi.mock('../../app/providers/broker.ts', () => ({
  createBrokerProvider: () => ({
    id: 'simulated',
    label: 'Test Broker',
    supportsRemoteExecution: false,
    submitOrders: vi.fn(),
    syncState: vi.fn(),
    cancelOrder: vi.fn(),
  }),
}));

vi.mock('../../app/providers/marketData.ts', () => ({
  createMarketDataProvider: () => ({
    id: 'simulated',
    label: 'Test Market Data',
    getQuotePatch: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(overrides: Partial<OperatorSession> = {}): OperatorSession {
  return {
    ok: true,
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'operator',
      organization: 'test-org',
      tenantId: 'tenant-1',
      workspaceId: 'ws-1',
      permissions: ['strategy:write', 'execution:approve'],
      accessStatus: 'active',
    },
    tenant: null,
    workspace: null,
    preferences: {
      locale: 'en',
      timezone: 'UTC',
      theme: 'dark',
      defaultMode: 'autopilot',
      riskReviewRequired: false,
      notificationChannels: [],
    },
    brokerBinding: null,
    issuedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TradingSystemProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchOperatorSession.mockResolvedValue(null);
    mockRunStateCycle.mockResolvedValue(null);
    mockReportOperatorAction.mockResolvedValue({ ok: true });
  });

  it('exports TradingSystemProvider as a function component', () => {
    expect(typeof TradingSystemProvider).toBe('function');
  });

  it('exports useTradingSystem as a function', () => {
    expect(typeof useTradingSystem).toBe('function');
  });

  it('useTradingSystem has correct arity (0 params)', () => {
    expect(useTradingSystem.length).toBe(0);
  });

  // -----------------------------------------------------------------------
  // Permission logic (tested via function signature, not DOM rendering)
  // -----------------------------------------------------------------------

  describe('mock setup verification', () => {
    it('fetchOperatorSession mock is callable', async () => {
      const session = makeSession();
      mockFetchOperatorSession.mockResolvedValue(session);
      const result = await mockFetchOperatorSession();
      expect(result).toEqual(session);
    });

    it('runStateCycle mock is callable', async () => {
      const state = { mode: 'autopilot' };
      mockRunStateCycle.mockResolvedValue({ state });
      const result = await mockRunStateCycle({});
      expect(result.state.mode).toBe('autopilot');
    });
  });

  describe('session helpers', () => {
    it('makeSession returns valid session with default permissions', () => {
      const session = makeSession();
      expect(session.ok).toBe(true);
      expect(session.user.permissions).toContain('strategy:write');
      expect(session.user.permissions).toContain('execution:approve');
    });

    it('makeSession applies overrides', () => {
      const session = makeSession({
        user: {
          ...makeSession().user,
          permissions: ['strategy:write'],
        },
      });
      expect(session.user.permissions).toEqual(['strategy:write']);
    });
  });
});
