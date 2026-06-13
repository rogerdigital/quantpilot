import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { OverviewPage } from './console/routes/OverviewPage.tsx';

const mockGoToSettings = vi.fn();

const stockStates = [
  {
    symbol: 'AAPL',
    name: 'Apple',
    price: 210,
    prevClose: 200,
    signal: 'BUY',
    score: 84.2,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft',
    price: 390,
    prevClose: 400,
    signal: 'SELL',
    score: 38.6,
  },
  {
    symbol: 'NVDA',
    name: 'Nvidia',
    price: 920,
    prevClose: 900,
    signal: 'HOLD',
    score: 59.1,
  },
];

const accountState = {
  nav: 100_000,
  cash: 50_000,
  exposure: 42.5,
  holdings: {},
  orders: [],
  equitySeries: [],
};

vi.mock('../store/trading-system/TradingSystemProvider.tsx', () => ({
  useTradingSystem: () => ({
    state: {
      marketClock: '2026-06-14 10:00',
      mode: 'autopilot',
      engineStatus: 'LIVE EXECUTION',
      riskLevel: 'NORMAL',
      decisionSummary: 'Hold risk posture',
      decisionCopy: 'No execution handoff requires escalation.',
      routeCopy: 'Monitor the command desk before submitting new plans.',
      toggles: {
        autoTrade: true,
        liveTrade: false,
        riskGuard: true,
        manualApproval: true,
      },
      stockStates,
      accounts: {
        paper: { ...accountState, nav: 120_000, exposure: 35.2 },
        live: { ...accountState, nav: 80_000, exposure: 28.4 },
      },
      approvalQueue: [{ id: 'approval-1' }],
      activityLog: [{ id: 'activity-1', title: 'Risk scan completed' }],
      integrationStatus: {
        marketData: { connected: true },
        broker: { connected: true },
      },
      controlPlane: {
        lastSyncAt: '2026-06-14T10:00:00.000Z',
      },
    },
  }),
}));

vi.mock('../modules/console/console.i18n.tsx', async () => {
  const actual = await vi.importActual<typeof import('../modules/console/console.i18n.tsx')>(
    '../modules/console/console.i18n.tsx'
  );
  return {
    ...actual,
    useLocale: () => ({ locale: 'zh' as const }),
  };
});

vi.mock('../modules/console/console.hooks.ts', async () => {
  const actual = await vi.importActual<typeof import('../modules/console/console.hooks.ts')>(
    '../modules/console/console.hooks.ts'
  );
  return {
    ...actual,
    useSettingsNavigation: () => mockGoToSettings,
    useSummary: () => ({
      paper: { nav: 120_000, exposure: 35.2 },
      live: { nav: 80_000, exposure: 28.4 },
      totalNav: 200_000,
      totalPnlPct: 2.35,
      positionCount: 5,
    }),
  };
});

vi.mock('../hooks/useLatestBrokerSnapshot.ts', () => ({
  useLatestBrokerSnapshot: () => ({
    snapshot: {
      connected: true,
      account: { equity: 80_000 },
    },
  }),
}));

vi.mock('../hooks/useMarketProviderStatus.ts', () => ({
  useMarketProviderStatus: () => ({
    status: {
      connected: true,
      fallback: false,
    },
  }),
}));

vi.mock('../hooks/useMonitoringStatus.ts', () => ({
  useMonitoringStatus: () => ({
    loading: false,
    status: {
      status: 'healthy',
      generatedAt: '2026-06-14T10:00:00.000Z',
      services: {
        worker: { lagSeconds: 1 },
        workflows: { queued: 0, running: 1, retryScheduled: 0 },
        queues: { pendingNotificationJobs: 0, pendingRiskScanJobs: 0 },
      },
      alerts: [],
      recent: {
        latestWorkerHeartbeat: { createdAt: '2026-06-14T10:00:00.000Z' },
      },
    },
  }),
}));

vi.mock('../components/layout/ConsoleChrome.tsx', () => ({
  ChartCanvas: ({ kind }: { kind: string }) => <div data-chart-kind={kind} />,
  EmptyState: ({ message }: { message: string }) => <div>{message}</div>,
  TopMeta: () => <div data-testid="top-meta" />,
}));

describe('UI workflow polish', () => {
  it('renders one primary portfolio summary before secondary command details', () => {
    const html = renderToStaticMarkup(<OverviewPage />);

    expect(html).toContain('data-overview-primary-summary="true"');
    expect(html.match(/¥200,000/g) || []).toHaveLength(1);
    expect(html).toContain('运行指令');
  });
});
