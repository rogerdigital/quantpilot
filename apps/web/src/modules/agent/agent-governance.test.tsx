import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import AgentPage from './AgentPage.tsx';

vi.mock('../../store/trading-system/TradingSystemProvider.tsx', () => ({
  useTradingSystem: () => ({
    state: {
      marketClock: '2026-04-07 09:00',
      riskLevel: 'HEALTHY',
    },
    session: {
      user: {
        id: 'operator-demo',
      },
    },
  }),
}));

vi.mock('../console/console.i18n.tsx', async () => {
  const actual = await vi.importActual<typeof import('../console/console.i18n.tsx')>('../console/console.i18n.tsx');
  return {
    ...actual,
    useLocale: () => ({ locale: 'en' as const }),
  };
});

vi.mock('../../components/layout/ConsoleChrome.tsx', () => ({
  EmptyState: ({ message }: { message: string }) => <div>{message}</div>,
  SectionHeader: () => <div>SectionHeader</div>,
  TopMeta: () => <div>TopMeta</div>,
}));

const mockUseAgentTools = vi.fn();

vi.mock('./useAgentTools.ts', () => ({
  useAgentTools: () => mockUseAgentTools(),
}));

const baseWorkbenchWithGovernance = {
  ok: true,
  summary: {
    runningSessions: 0,
    pendingActionRequests: 0,
    completedSessions: 1,
    latestUpdatedAt: '2026-04-07T09:00:00.000Z',
  },
  queues: {
    recentSessions: [],
    pendingActionRequests: [],
    recentAnalysisRuns: [],
  },
  runbook: [],
  recentExplanations: [],
  authorityState: {
    mode: 'ask_first',
    reason: 'Derived from 1 matching policy record.',
    policies: [
      {
        id: 'policy-1',
        accountId: 'paper-main',
        strategyId: 'all',
        actionType: 'all',
        environment: 'paper',
        authority: 'ask_first',
        createdAt: '2026-04-07T08:00:00.000Z',
        updatedAt: '2026-04-07T08:00:00.000Z',
      },
    ],
  },
  dailyBias: {
    instructions: [
      {
        id: 'instruction-1',
        kind: 'daily_bias',
        title: 'Trade lighter today',
        body: 'Prefer fewer new entries and keep stops tight.',
        requestedBy: 'operator-demo',
        activeUntil: '2026-04-07T23:59:59.000Z',
        createdAt: '2026-04-07T08:30:00.000Z',
      },
    ],
    latestUpdatedAt: '2026-04-07T08:30:00.000Z',
  },
  authorityEvents: [],
  dailyRuns: [],
};

const baseToolsState = {
  tools: [],
  workbench: baseWorkbenchWithGovernance,
  sessionDetail: null,
  selectedSessionId: '',
  loading: false,
  running: false,
  requestingAction: false,
  error: '',
  refresh: () => Promise.resolve(null),
  selectSession: () => undefined,
  runPrompt: () => Promise.resolve(null),
  requestAction: () => Promise.resolve(null),
};

describe('AgentPage governance panel', () => {
  it('renders the Agent Governance panel with authority mode and daily bias', () => {
    mockUseAgentTools.mockReturnValue(baseToolsState);

    const html = renderToStaticMarkup(<AgentPage />);

    expect(html).toContain('Agent Governance');
    expect(html).toContain('Authority Mode');
    expect(html).toContain('ask_first');
    expect(html).toContain('Daily Bias');
    expect(html).toContain('Trade lighter today');
    expect(html).toContain('Prefer fewer new entries and keep stops tight.');
  });

  it('shows manual_only fallback when no governance data is present', () => {
    mockUseAgentTools.mockReturnValue({
      ...baseToolsState,
      workbench: {
        ...baseWorkbenchWithGovernance,
        authorityState: null,
        dailyBias: null,
      },
    });

    const html = renderToStaticMarkup(<AgentPage />);

    expect(html).toContain('Agent Governance');
    expect(html).toContain('manual_only');
  });
});
