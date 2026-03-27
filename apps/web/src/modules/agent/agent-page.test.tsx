import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import AgentPage from './AgentPage.tsx';

const mockUseAgentTools = vi.fn();

vi.mock('../../store/trading-system/TradingSystemProvider.tsx', () => ({
  useTradingSystem: () => ({
    state: {
      marketClock: '2026-03-26 10:00',
      riskLevel: 'REVIEW',
    },
    session: {
      user: {
        id: 'operator-demo',
      },
    },
  }),
}));

vi.mock('../../pages/console/i18n.tsx', async () => {
  const actual = await vi.importActual<typeof import('../../pages/console/i18n.tsx')>('../../pages/console/i18n.tsx');
  return {
    ...actual,
    useLocale: () => ({ locale: 'en' as const }),
  };
});

vi.mock('../../pages/console/components/ConsoleChrome.tsx', () => ({
  SectionHeader: () => <div>SectionHeader</div>,
  TopMeta: () => <div>TopMeta</div>,
}));

vi.mock('./useAgentTools.ts', () => ({
  useAgentTools: () => mockUseAgentTools(),
}));

describe('AgentPage', () => {
  it('renders the collaboration workbench with prompt studio and timeline', () => {
    mockUseAgentTools.mockReturnValue({
      tools: [
        { name: 'risk.events.list', description: 'Read risk events', category: 'risk', access: 'read' },
      ],
      workbench: {
        summary: {
          runningSessions: 1,
          pendingActionRequests: 2,
          completedSessions: 4,
        },
        queues: {
          recentSessions: [
            { id: 'agent-session-1', title: 'Review risk posture', prompt: 'Explain the latest risk posture.', status: 'completed' },
          ],
          pendingActionRequests: [
            { id: 'request-1', requestType: 'prepare_execution_plan', summary: 'Pending review', approvalState: 'required', riskStatus: 'review' },
          ],
        },
        runbook: [
          { key: 'review-pending-agent-requests', title: 'Review pending agent requests', detail: 'Pending requests need review.', priority: 'now' },
        ],
        recentExplanations: [
          { sessionId: 'agent-session-1', analysisRunId: 'analysis-1', thesis: 'Risk posture is elevated.', recommendedNextStep: 'Review risk console.', warningCount: 1 },
        ],
      },
      sessionDetail: {
        session: {
          id: 'agent-session-1',
          status: 'completed',
          latestIntent: {
            kind: 'request_risk_explanation',
          },
        },
        latestPlan: {
          status: 'completed',
        },
        latestAnalysisRun: {
          summary: 'Risk posture summary.',
          explanation: {
            thesis: 'Risk posture is elevated.',
            rationale: ['Recent risk events remain active.'],
            warnings: ['Do not bypass review.'],
            recommendedNextStep: 'Review the risk console.',
          },
        },
        latestActionRequest: {
          id: 'request-1',
          requestType: 'prepare_execution_plan',
          targetId: 'ema-cross-us',
          status: 'pending_review',
          approvalState: 'required',
          riskStatus: 'review',
          summary: 'Review pending agent request.',
          rationale: 'Risk review is still required.',
          requestedBy: 'agent',
          metadata: {},
        },
        timeline: [
          { id: 'timeline-1', lane: 'operator', title: 'Approved agent request', detail: 'Operator approved the request.', actor: 'risk-operator' },
        ],
      },
      selectedSessionId: 'agent-session-1',
      loading: false,
      running: false,
      requestingAction: false,
      error: '',
      refresh: () => Promise.resolve(null),
      selectSession: () => undefined,
      runPrompt: () => Promise.resolve(null),
      requestAction: () => Promise.resolve(null),
    });

    const html = renderToStaticMarkup(<AgentPage />);

    expect(html).toContain('Prompt Studio');
    expect(html).toContain('Refresh Workbench');
    expect(html).toContain('Recent Sessions');
    expect(html).toContain('Pending Requests');
    expect(html).toContain('Operator Timeline');
    expect(html).toContain('Risk posture is elevated.');
    expect(html).toContain('Review pending agent requests');
    expect(html).toContain('Action Request');
    expect(html).toContain('#agent-explanation');
    expect(html).toContain('#agent-timeline');
  });

  it('renders workbench alerts and empty explanation states clearly', () => {
    mockUseAgentTools.mockReturnValue({
      tools: [],
      workbench: {
        summary: {
          runningSessions: 0,
          pendingActionRequests: 0,
          completedSessions: 0,
        },
        queues: {
          recentSessions: [],
          pendingActionRequests: [],
        },
        runbook: [],
        recentExplanations: [],
      },
      sessionDetail: {
        session: {
          id: 'agent-session-2',
          status: 'planned',
          latestIntent: {
            kind: 'read_only_analysis',
          },
        },
        latestPlan: {
          status: 'planned',
        },
        latestAnalysisRun: {
          summary: '',
          explanation: {
            thesis: '',
            rationale: [],
            warnings: [],
            recommendedNextStep: '',
          },
        },
        latestActionRequest: null,
        timeline: [],
      },
      selectedSessionId: 'agent-session-2',
      loading: false,
      running: false,
      requestingAction: false,
      error: 'Missing permission: agent:read.',
      refresh: () => Promise.resolve(null),
      selectSession: () => undefined,
      runPrompt: () => Promise.resolve(null),
      requestAction: () => Promise.resolve(null),
    });

    const html = renderToStaticMarkup(<AgentPage />);

    expect(html).toContain('Workbench Alert');
    expect(html).toContain('Missing permission: agent:read.');
    expect(html).toContain('No additional rationale items are available for this explanation yet.');
    expect(html).toContain('No warning items have been raised for this explanation yet.');
    expect(html).toContain('No allowlisted tools are available right now.');
  });
});
