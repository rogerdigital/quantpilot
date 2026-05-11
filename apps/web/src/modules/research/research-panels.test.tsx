import type { PromotionGate } from '@shared-types/lifecycle.ts';
import type { BacktestRunItem, StrategyCatalogItem } from '@shared-types/trading.ts';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BacktestCandidateStrategyRow } from './BacktestCandidateStrategyRow.tsx';
import { BacktestRunQueueRow } from './BacktestRunQueueRow.tsx';
import { ResearchActionBar, ResearchActionButton } from './ResearchActionBar.tsx';
import { ResearchAuditFeedRow } from './ResearchAuditFeedRow.tsx';
import { ResearchCollectionPanel } from './ResearchCollectionPanel.tsx';
import { ResearchDetailInspectionPanel } from './ResearchDetailInspectionPanel.tsx';
import { ResearchEventInspectionPanel } from './ResearchEventInspectionPanel.tsx';
import { ResearchExecutionPlanRow } from './ResearchExecutionPlanRow.tsx';
import { ResearchRunSummaryRow } from './ResearchRunSummaryRow.tsx';
import { ResearchStatusPanel } from './ResearchStatusPanel.tsx';
import { ResearchTerminalPanel } from './ResearchTerminalPanel.tsx';
import { ResearchTimelineEventRow } from './ResearchTimelineEventRow.tsx';
import { ResearchVersionSnapshotRow } from './ResearchVersionSnapshotRow.tsx';
import { ResearchWorkflowStepRow } from './ResearchWorkflowStepRow.tsx';
import {
  getBacktestCollectionConfigs,
  getStrategyCollectionConfigs,
} from './researchCollectionConfigs.ts';
import {
  getBacktestDetailInspectionConfig,
  getStrategyDetailInspectionConfig,
} from './researchDetailConfigs.ts';
import {
  getStrategyTimelineActionLabel,
  getStrategyTimelineGuidance,
} from './researchEventInspection.tsx';
import {
  getStrategyTimelineInspectionConfig,
  getWorkflowInspectionConfig,
  getWorkflowStepInspectionConfig,
} from './researchInspectionConfigs.ts';
import { getBacktestStatusConfig, getStrategyStatusConfig } from './researchStatusConfigs.ts';
import {
  getBacktestTerminalConfigs,
  getStrategyTerminalConfigs,
} from './researchTerminalConfigs.tsx';
import { StrategyCatalogRow } from './StrategyCatalogRow.tsx';

describe('research panel primitives', () => {
  it('renders status panel metrics and messages', () => {
    const html = renderToStaticMarkup(
      <ResearchStatusPanel
        title="Summary"
        copy="Panel copy"
        badge="SERVICE"
        metrics={[
          { label: 'Buys', value: 3 },
          { label: 'Runs', value: 8 },
        ]}
        messages={['Synced']}
      />
    );

    expect(html).toContain('Summary');
    expect(html).toContain('Buys');
    expect(html).toContain('Runs');
    expect(html).toContain('Synced');
  });

  it('prefers empty state over detail metrics when inspection panel has no selection', () => {
    const html = renderToStaticMarkup(
      <ResearchDetailInspectionPanel
        title="Detail"
        copy="Detail copy"
        badge="--"
        emptyMessage="Select a record first."
        metrics={[{ label: 'Status', value: 'ready' }]}
      >
        <div>Hidden body</div>
      </ResearchDetailInspectionPanel>
    );

    expect(html).toContain('Select a record first.');
    expect(html).not.toContain('Hidden body');
    expect(html).not.toContain('ready');
  });

  it('renders collection loading state before child rows', () => {
    const html = renderToStaticMarkup(
      <ResearchCollectionPanel
        title="Collection"
        copy="Collection copy"
        badge={2}
        terminal
        hasSelection
        loading
        loadingMessage="Loading rows..."
        isEmpty={false}
      >
        <div>Should stay hidden while loading</div>
      </ResearchCollectionPanel>
    );

    expect(html).toContain('Loading rows...');
    expect(html).not.toContain('Should stay hidden while loading');
  });

  it('renders event inspection detail, guidance, and actions together', () => {
    const html = renderToStaticMarkup(
      <ResearchEventInspectionPanel
        title="Event"
        copy="Event copy"
        badge="RUN"
        metrics={[
          { label: 'Type', value: 'run' },
          { label: 'Ref', value: 'run-1' },
        ]}
        detail="Detail message"
        guidance="Next step"
        actions={<button type="button">Open</button>}
      />
    );

    expect(html).toContain('Detail message');
    expect(html).toContain('Next step');
    expect(html).toContain('Open');
  });

  it('renders terminal panel prelude, rows, and footer', () => {
    const html = renderToStaticMarkup(
      <ResearchTerminalPanel
        title="Terminal"
        copy="Terminal copy"
        badge="LIVE"
        prelude={<div>Prelude block</div>}
        footer={<div>Footer block</div>}
      >
        <div>Row body</div>
      </ResearchTerminalPanel>
    );

    expect(html).toContain('Prelude block');
    expect(html).toContain('Row body');
    expect(html).toContain('Footer block');
  });

  it('renders shared research action bar buttons', () => {
    const html = renderToStaticMarkup(
      <ResearchActionBar>
        <ResearchActionButton
          label="Open Strategy Detail"
          priority="primary"
          onClick={() => undefined}
        />
        <ResearchActionButton label="Return to Strategy Timeline" onClick={() => undefined} />
      </ResearchActionBar>
    );

    expect(html).toContain('Open Strategy Detail');
    expect(html).toContain('Return to Strategy Timeline');
    expect(html).toContain('settings-actions');
  });

  it('renders audit feed row metrics and inspect action', () => {
    const html = renderToStaticMarkup(
      <ResearchAuditFeedRow
        locale="en"
        item={{
          id: 'audit-1',
          type: 'backtest.run.reviewed',
          actor: 'risk@desk',
          title: 'Review completed',
          detail: 'Manual review approved the run.',
          createdAt: '2026-03-13T08:30:00.000Z',
        }}
        formatDateTime={(value) => value}
        metrics={[
          { label: 'Type', value: 'backtest.run.reviewed' },
          { label: 'Workflow', value: 'wf-run-1' },
        ]}
        onInspect={() => undefined}
      />
    );

    expect(html).toContain('Review completed');
    expect(html).toContain('risk@desk');
    expect(html).toContain('wf-run-1');
    expect(html).toContain('Inspect');
  });

  it('renders version snapshot row metrics', () => {
    const html = renderToStaticMarkup(
      <ResearchVersionSnapshotRow
        leadTitle="03/13 08:30"
        leadCopy="Version snapshot captured after review."
        metrics={[
          { label: 'Stage', value: 'candidate' },
          { label: 'Return / Drawdown', value: '11.5% / 5.9%' },
          { label: 'Sharpe', value: '1.50' },
        ]}
      />
    );

    expect(html).toContain('03/13 08:30');
    expect(html).toContain('Version snapshot captured after review.');
    expect(html).toContain('candidate');
    expect(html).toContain('11.5% / 5.9%');
  });

  it('renders research run summary row performance metrics', () => {
    const run: BacktestRunItem = {
      id: 'run-2',
      strategyId: 'strategy-2',
      strategyName: 'Breakout',
      status: 'completed',
      summary: 'Momentum breakout finished.',
      windowLabel: '90D',
      startedAt: '2026-03-13T09:00:00.000Z',
      annualizedReturnPct: 18.3,
      maxDrawdownPct: 7.2,
      sharpe: 2.1,
      winRatePct: 58.4,
      turnoverPct: 24.3,
      workflowRunId: 'wf-run-2',
      completedAt: '2026-03-13T10:00:00.000Z',
    };

    const html = renderToStaticMarkup(<ResearchRunSummaryRow locale="en" run={run} />);

    expect(html).toContain('90D');
    expect(html).toContain('completed');
    expect(html).toContain('18.3%');
    expect(html).toContain('wf-run-2');
  });

  it('renders execution plan row with action', () => {
    const html = renderToStaticMarkup(
      <ResearchExecutionPlanRow
        locale="en"
        entry={{
          plan: {
            id: 'plan-1',
            workflowRunId: 'wf-1',
            handoffId: 'handoff-1',
            executionRunId: 'exec-run-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            status: 'ready',
            lifecycleStatus: 'submitted',
            approvalState: 'pending',
            riskStatus: 'approved',
            mode: 'paper',
            capital: 50000,
            orderCount: 3,
            orders: [],
            summary: 'Paper orders ready',
            metadata: {},
            createdAt: '2026-03-13T09:00:00.000Z',
            updatedAt: '2026-03-13T09:01:00.000Z',
          },
          workflow: {
            id: 'wf-1',
            workflowId: 'strategy-execution',
            status: 'completed',
            updatedAt: '2026-03-13T09:01:00.000Z',
            completedAt: '2026-03-13T09:01:00.000Z',
            failedAt: '',
          },
          latestRuntime: {
            id: 'runtime-1',
            cycleId: 'cycle-1',
            cycle: 12,
            executionPlanId: 'plan-1',
            executionRunId: 'exec-run-1',
            mode: 'paper',
            brokerAdapter: 'simulated',
            brokerConnected: true,
            marketConnected: true,
            submittedOrderCount: 3,
            rejectedOrderCount: 0,
            openOrderCount: 1,
            positionCount: 2,
            cash: 100000,
            buyingPower: 90000,
            equity: 101200,
            message: '3 orders staged',
            metadata: {},
            createdAt: '2026-03-13T09:02:00.000Z',
          },
          executionRun: {
            id: 'exec-run-1',
            executionPlanId: 'plan-1',
            workflowRunId: 'wf-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            mode: 'paper',
            lifecycleStatus: 'submitted',
            submittedOrderCount: 3,
            filledOrderCount: 1,
            rejectedOrderCount: 0,
            summary: 'Execution run active',
            owner: 'ops@desk',
            orderCount: 3,
            metadata: {},
            createdAt: '2026-03-13T09:01:00.000Z',
            updatedAt: '2026-03-13T09:02:00.000Z',
            completedAt: '',
          },
          orderStates: [
            {
              id: 'order-1',
              executionPlanId: 'plan-1',
              executionRunId: 'exec-run-1',
              symbol: 'AAPL',
              side: 'BUY',
              qty: 5,
              weight: 0.2,
              lifecycleStatus: 'filled',
              brokerOrderId: 'sim-1',
              avgFillPrice: 182.5,
              filledQty: 5,
              summary: 'Filled',
              submittedAt: '2026-03-13T09:01:00.000Z',
              acknowledgedAt: '2026-03-13T09:01:30.000Z',
              filledAt: '2026-03-13T09:02:00.000Z',
              metadata: {},
              createdAt: '2026-03-13T09:01:00.000Z',
              updatedAt: '2026-03-13T09:02:00.000Z',
            },
          ],
        }}
        onAction={() => undefined}
      />
    );

    expect(html).toContain('Paper orders ready');
    expect(html).toContain('approved');
    expect(html).toContain('3/1');
    expect(html).toContain('Open Execution Detail');
  });

  it('renders timeline event row with lane metrics and inspect state', () => {
    const html = renderToStaticMarkup(
      <ResearchTimelineEventRow
        locale="en"
        id="timeline-1"
        title="Queued run"
        detail="Backtest was queued for review."
        selectedId=""
        onInspect={() => undefined}
        metrics={[
          { label: 'Lane', value: 'Research' },
          { label: 'Time', value: '2026-03-13T12:00:00.000Z' },
        ]}
      />
    );

    expect(html).toContain('Queued run');
    expect(html).toContain('Research');
    expect(html).toContain('Inspect');
  });

  it('returns shared strategy timeline guidance and action labels', () => {
    expect(getStrategyTimelineGuidance('en', 'run')).toContain('research runs panel');
    expect(getStrategyTimelineGuidance('en', 'evaluation')).toContain('evaluation context');
    expect(getStrategyTimelineActionLabel('en', 'workflow')).toBe('Open Research Detail');
    expect(getStrategyTimelineActionLabel('en', 'execution')).toBe('Open Execution Detail');
    expect(getStrategyTimelineActionLabel('en', 'audit')).toBeNull();
  });

  it('builds shared inspection configs for timeline and workflow panels', () => {
    const timelineConfig = getStrategyTimelineInspectionConfig(
      'en',
      { id: 'strategy-1' },
      {
        title: 'Queued run',
        lane: 'Research',
        at: '2026-03-13T12:00:00.000Z',
        reference: 'run-1',
        eventType: 'run',
        detail: 'Backtest queued.',
      },
      (value) => value
    );
    const workflowConfig = getWorkflowInspectionConfig(
      'en',
      { id: 'run-1' },
      {
        id: 'wf-1',
        workflowId: 'backtest',
        workflowType: 'backtest',
        status: 'running',
        actor: 'worker',
        trigger: 'queued',
        attempt: 1,
        maxAttempts: 3,
        nextRunAt: '',
        lockedBy: '',
        lockedAt: '',
        createdAt: '2026-03-13T12:00:00.000Z',
        updatedAt: '2026-03-13T12:05:00.000Z',
        startedAt: '2026-03-13T12:00:00.000Z',
        completedAt: '',
        failedAt: '',
        steps: [],
        payload: {},
        result: null,
        error: null,
        metadata: {},
      },
      (value) => value
    );
    const stepConfig = getWorkflowStepInspectionConfig(
      'en',
      {
        id: 'wf-1',
        workflowId: 'backtest',
        workflowType: 'backtest',
        status: 'running',
        actor: 'worker',
        trigger: 'queued',
        attempt: 1,
        maxAttempts: 3,
        nextRunAt: '',
        lockedBy: '',
        lockedAt: '',
        createdAt: '2026-03-13T12:00:00.000Z',
        updatedAt: '2026-03-13T12:05:00.000Z',
        startedAt: '2026-03-13T12:00:00.000Z',
        completedAt: '',
        failedAt: '',
        steps: [],
        payload: {},
        result: null,
        error: null,
        metadata: {},
      },
      { key: 'risk_review', status: 'completed' }
    );

    expect(timelineConfig.metrics[0]?.value).toBe('Queued run');
    expect(workflowConfig.guidance).toContain('Last updated');
    expect(stepConfig.guidance).toContain('risk_review');
  });

  it('builds shared detail inspection configs for strategy and backtest panels', () => {
    const strategyConfig = getStrategyDetailInspectionConfig(
      'en',
      {
        id: 'strategy-1',
        name: 'Momentum',
        family: 'trend',
        timeframe: '1d',
        universe: 'NASDAQ 100',
        status: 'candidate',
        score: 81,
        expectedReturnPct: 14.2,
        maxDrawdownPct: 6.4,
        sharpe: 1.9,
        summary: 'Candidate momentum strategy',
      },
      {
        id: 'strategy-1',
        name: 'Momentum',
        family: 'trend',
        timeframe: '1d',
        universe: 'NASDAQ 100',
        status: 'candidate',
        score: 81,
        expectedReturnPct: 14.2,
        maxDrawdownPct: 6.4,
        sharpe: 1.9,
        summary: 'Candidate momentum strategy',
      },
      {
        ok: true,
        latestRun: {
          id: 'run-1',
          strategyId: 'strategy-1',
          strategyName: 'Momentum',
          status: 'completed',
          windowLabel: '30D',
          startedAt: '2026-03-13T12:00:00.000Z',
          annualizedReturnPct: 10.5,
          maxDrawdownPct: 4.2,
          sharpe: 1.7,
          winRatePct: 54,
          turnoverPct: 18,
          summary: 'Latest run',
        },
      }
    );
    const backtestConfig = getBacktestDetailInspectionConfig(
      'en',
      {
        id: 'run-1',
        strategyId: 'strategy-1',
        strategyName: 'Momentum',
        status: 'completed',
        windowLabel: '30D',
        startedAt: '2026-03-13T12:00:00.000Z',
        annualizedReturnPct: 10.5,
        maxDrawdownPct: 4.2,
        sharpe: 1.7,
        winRatePct: 54,
        turnoverPct: 18,
        summary: 'Latest run',
      },
      {
        id: 'run-1',
        strategyId: 'strategy-1',
        strategyName: 'Momentum',
        status: 'completed',
        windowLabel: '30D',
        startedAt: '2026-03-13T12:00:00.000Z',
        annualizedReturnPct: 10.5,
        maxDrawdownPct: 4.2,
        sharpe: 1.7,
        winRatePct: 54,
        turnoverPct: 18,
        summary: 'Latest run',
      },
      null,
      {
        ok: true,
        strategy: {
          id: 'strategy-1',
          name: 'Momentum',
          family: 'trend',
          timeframe: '1d',
          universe: 'NASDAQ 100',
          status: 'candidate',
          score: 81,
          expectedReturnPct: 14.2,
          maxDrawdownPct: 6.4,
          sharpe: 1.9,
          summary: 'Candidate momentum strategy',
        },
      },
      (value) => `${value.toFixed(1)}%`
    );

    expect(strategyConfig.metrics[0]?.value).toBe('Momentum');
    expect(strategyConfig.summary).toContain('Candidate momentum strategy');
    expect(backtestConfig.metrics[2]?.value).toBe('10.5%');
    expect(backtestConfig.summary).toContain('Latest run');
  });

  it('builds shared collection configs for strategy and backtest panels', () => {
    const strategyCollections = getStrategyCollectionConfigs('en', true, false, {
      runs: 2,
      execution: 1,
      audit: 3,
      versions: 4,
    });
    const backtestCollections = getBacktestCollectionConfigs('en', true, {
      audit: 2,
      execution: 1,
      versions: 3,
    });

    expect(strategyCollections.runs.badge).toBe(2);
    expect(strategyCollections.execution.emptyMessage).toContain('downstream execution plans');
    expect(backtestCollections.audit.title).toBe('Selected Audit Trail');
    expect(backtestCollections.versions.badge).toBe(3);
  });

  it('builds shared terminal configs for strategy and backtest workspaces', () => {
    const strategyTerminal = getStrategyTerminalConfigs({
      locale: 'en',
      dataSourceBadge: 'SERVICE',
      loading: false,
      auditLoading: true,
      registryFilter: 'all',
      activeCount: 4,
      archivedCount: 2,
      visibleCount: 6,
      activityCount: 3,
      onFilterChange: () => undefined,
    });
    const backtestTerminal = getBacktestTerminalConfigs({
      locale: 'en',
      loading: false,
      auditLoading: true,
      workspaceLoading: false,
      strategyCount: 5,
      filteredRunCount: 7,
      taskCount: 9,
      activeTaskCount: 4,
      auditCount: 3,
      workflowCount: 2,
      windowLabel: '2024-01-01 -> 2026-03-01',
      canReviewBacktest: false,
    });

    const strategyPrelude = renderToStaticMarkup(strategyTerminal.registry.prelude);
    const backtestFooter = renderToStaticMarkup(backtestTerminal.queue.footer);

    expect(strategyTerminal.registry.badge).toBe('SERVICE');
    expect(strategyPrelude).toContain('Active only');
    expect(backtestTerminal.catalog.badge).toBe(5);
    expect(backtestFooter).toContain('read-only');
  });

  it('builds shared status configs for strategy and backtest summaries', () => {
    const strategyStatus = getStrategyStatusConfig({
      locale: 'en',
      catalogSize: 6,
      candidateStrategies: 3,
      promotedCount: 2,
      executionRoute: 'Hybrid',
      canWriteStrategy: false,
      loading: true,
      error: '',
    });
    const backtestStatus = getBacktestStatusConfig({
      locale: 'en',
      dataSourceBadge: 'SERVICE',
      buyCount: 4,
      sellCount: 1,
      portfolioReturn: '12.4%',
      researchMode: 'Hybrid',
      completedRuns: 9,
      reviewQueue: 2,
      decisionCopy: 'Runtime copy',
      actionMessage: '',
      actionError: 'Needs review',
      loading: false,
      error: '',
    });

    expect(strategyStatus.metrics[0]?.value).toBe(6);
    expect(strategyStatus.messages[0]).toContain('read-only');
    expect(backtestStatus.badge).toBe('SERVICE');
    expect(backtestStatus.metrics[2]?.value).toBe('12.4%');
    expect(backtestStatus.messages[2]).toBe('Needs review');
  });

  it('renders workflow step row with selected state', () => {
    const html = renderToStaticMarkup(
      <ResearchWorkflowStepRow
        locale="en"
        step={{ key: 'risk_review', status: 'completed' }}
        selectedStepKey="risk_review"
        onInspect={() => undefined}
      />
    );

    expect(html).toContain('risk_review');
    expect(html).toContain('completed');
    expect(html).toContain('Selected');
  });

  it('renders queue row review action for needs-review runs', () => {
    const run: BacktestRunItem = {
      id: 'run-1',
      strategyId: 'strategy-1',
      strategyName: 'Momentum',
      status: 'needs_review',
      summary: 'Awaiting approval',
      windowLabel: '30D',
      annualizedReturnPct: 12.4,
      maxDrawdownPct: 4.8,
      sharpe: 1.7,
      winRatePct: 54,
      turnoverPct: 18.2,
      startedAt: '2026-03-13T00:00:00.000Z',
    };

    const html = renderToStaticMarkup(
      <BacktestRunQueueRow
        locale="en"
        run={run}
        selectedRunId=""
        canReviewBacktest
        reviewingRunId=""
        formatDateTime={(value) => value || '--'}
        formatPercent={(value) => `${value.toFixed(1)}%`}
        onReview={() => undefined}
        onInspect={() => undefined}
      />
    );

    expect(html).toContain('Momentum');
    expect(html).toContain('Approve Review');
    expect(html).toContain('Inspect');
    expect(html).toContain('12.4%');
  });

  it('renders candidate strategy row queue action', () => {
    const strategy: StrategyCatalogItem = {
      id: 'strategy-1',
      name: 'Momentum',
      family: 'trend',
      timeframe: '1d',
      universe: 'NASDAQ 100',
      status: 'candidate',
      score: 81,
      expectedReturnPct: 14.2,
      maxDrawdownPct: 6.4,
      sharpe: 1.9,
      summary: 'Candidate momentum strategy',
    };

    const html = renderToStaticMarkup(
      <BacktestCandidateStrategyRow
        locale="en"
        item={strategy}
        canQueueBacktest
        submittingStrategyId=""
        formatPercent={(value) => `${value.toFixed(1)}%`}
        onQueue={() => undefined}
      />
    );

    expect(html).toContain('Momentum');
    expect(html).toContain('Queue Backtest');
    expect(html).toContain('6.4%');
    expect(html).toContain('candidate');
  });

  it('renders strategy catalog row promote and archive actions', () => {
    const strategy: StrategyCatalogItem = {
      id: 'strategy-2',
      name: 'Reversion',
      family: 'mean-reversion',
      timeframe: '4h',
      universe: 'SP500',
      status: 'candidate',
      score: 76,
      expectedReturnPct: 11.5,
      maxDrawdownPct: 5.9,
      sharpe: 1.5,
      summary: 'Promotion-ready strategy',
    };

    const html = renderToStaticMarkup(
      <StrategyCatalogRow
        locale="en"
        item={strategy}
        nextStage="paper"
        canWriteStrategy
        saving={false}
        promotingId=""
        selectedStrategyId=""
        onEdit={() => undefined}
        onPromote={() => undefined}
        onArchiveToggle={() => undefined}
        onInspect={() => undefined}
      />
    );

    expect(html).toContain('Reversion');
    expect(html).toContain('Promote to paper');
    expect(html).toContain('Archive');
    expect(html).toContain('Inspect');
  });
});

describe('ResearchIdeaLifecyclePanel', () => {
  it('renders pipeline summary with stage counts', async () => {
    const { ResearchIdeaLifecyclePanel } = await import('./ResearchIdeaLifecyclePanel.tsx');
    const html = renderToStaticMarkup(
      <ResearchIdeaLifecyclePanel
        ideas={[
          {
            id: 'idea-1',
            workspaceId: 'ws-1',
            title: 'Mom Factor',
            hypothesis: {
              statement: 'Momentum works',
              rationale: 'R',
              expectedOutcome: 'E',
              falsificationCriteria: 'F',
              relatedLiterature: [],
            },
            market: 'US',
            assetUniverse: [],
            timeHorizon: '1Y',
            status: 'idea',
            owner: 'r1',
            ownerRole: 'researcher',
            tags: [],
            decisionRecords: [],
            linkedDatasetIds: [],
            linkedFeatureSetIds: [],
            linkedExperimentIds: [],
            linkedBacktestIds: [],
            createdAt: '',
            updatedAt: '',
            metadata: {},
          },
          {
            id: 'idea-2',
            workspaceId: 'ws-1',
            title: 'Value Factor',
            hypothesis: {
              statement: 'Value stocks outperform',
              rationale: 'R',
              expectedOutcome: 'E',
              falsificationCriteria: 'F',
              relatedLiterature: [],
            },
            market: 'US',
            assetUniverse: [],
            timeHorizon: '1Y',
            status: 'experiment_running',
            owner: 'r1',
            ownerRole: 'researcher',
            tags: [],
            decisionRecords: [],
            linkedDatasetIds: ['ds-1'],
            linkedFeatureSetIds: ['fs-1'],
            linkedExperimentIds: ['exp-1'],
            linkedBacktestIds: [],
            createdAt: '',
            updatedAt: '',
            metadata: {},
          },
        ]}
        locale="en"
      />
    );
    expect(html).toContain('Research Pipeline');
    expect(html).toContain('Idea: 1');
    expect(html).toContain('Experiment Running: 1');
    expect(html).toContain('Momentum works');
    expect(html).toContain('Value stocks outperform');
  });

  it('renders empty state', async () => {
    const { ResearchIdeaLifecyclePanel } = await import('./ResearchIdeaLifecyclePanel.tsx');
    const html = renderToStaticMarkup(<ResearchIdeaLifecyclePanel ideas={[]} locale="en" />);
    expect(html).toContain('No research ideas');
  });
});

describe('ResearchEvidencePanel', () => {
  it('renders evidence chain for an idea', async () => {
    const { ResearchEvidencePanel } = await import('./ResearchEvidencePanel.tsx');
    const html = renderToStaticMarkup(
      <ResearchEvidencePanel
        idea={{
          id: 'idea-1',
          workspaceId: 'ws-1',
          title: 'Test',
          hypothesis: {
            statement: 'Momentum persists',
            rationale: 'R',
            expectedOutcome: 'E',
            falsificationCriteria: 'F',
            relatedLiterature: [],
          },
          market: 'US',
          assetUniverse: [],
          timeHorizon: '1Y',
          status: 'experiment_reviewed',
          owner: 'r1',
          ownerRole: 'researcher',
          tags: [],
          decisionRecords: [],
          linkedDatasetIds: ['ds-001', 'ds-002'],
          linkedFeatureSetIds: ['fs-001'],
          linkedExperimentIds: ['exp-001'],
          linkedBacktestIds: ['bt-001'],
          createdAt: '',
          updatedAt: '',
          metadata: {},
        }}
        locale="en"
      />
    );
    expect(html).toContain('Evidence Chain');
    expect(html).toContain('Momentum persists');
    expect(html).toContain('ds-001, ds-002');
    expect(html).toContain('fs-001');
    expect(html).toContain('exp-001');
    expect(html).toContain('bt-001');
  });

  it('renders empty state when no idea selected', async () => {
    const { ResearchEvidencePanel } = await import('./ResearchEvidencePanel.tsx');
    const html = renderToStaticMarkup(<ResearchEvidencePanel idea={null} locale="en" />);
    expect(html).toContain('Select a research idea to view evidence chain');
  });
});

describe('ExperimentComparisonPanel', () => {
  it('renders comparison table with metrics', async () => {
    const { ExperimentComparisonPanel } = await import('./ExperimentComparisonPanel.tsx');
    const html = renderToStaticMarkup(
      <ExperimentComparisonPanel
        runs={[
          {
            id: 'run-001',
            experimentId: 'exp-001',
            status: 'completed',
            snapshot: {
              datasetVersionId: 'dsv-001',
              featureVersionId: 'fv-001',
              codeVersion: 'abc',
              parameters: [],
              seed: 42,
              runtimeEnvironment: 'node-22',
            },
            metrics: [
              {
                name: 'sharpe',
                direction: 'higher_is_better',
                value: { kind: 'scalar', value: 1.5 },
                metadata: {},
              },
            ],
            artifactIds: ['art-001'],
            isCandidate: true,
            startedAt: '',
            completedAt: '',
            createdAt: '',
            metadata: {},
          },
          {
            id: 'run-002',
            experimentId: 'exp-001',
            status: 'completed',
            snapshot: {
              datasetVersionId: 'dsv-001',
              featureVersionId: 'fv-002',
              codeVersion: 'def',
              parameters: [],
              seed: 42,
              runtimeEnvironment: 'node-22',
            },
            metrics: [
              {
                name: 'sharpe',
                direction: 'higher_is_better',
                value: { kind: 'scalar', value: 1.2 },
                metadata: {},
              },
            ],
            artifactIds: [],
            isCandidate: false,
            startedAt: '',
            completedAt: '',
            createdAt: '',
            metadata: {},
          },
        ]}
        locale="en"
      />
    );
    expect(html).toContain('Experiment Comparison');
    expect(html).toContain('run-001');
    expect(html).toContain('run-002');
    expect(html).toContain('sharpe');
    expect(html).toContain('1.5000');
    expect(html).toContain('1.2000');
    expect(html).toContain('dsv-001');
    expect(html).toContain('fv-002');
  });

  it('renders empty state', async () => {
    const { ExperimentComparisonPanel } = await import('./ExperimentComparisonPanel.tsx');
    const html = renderToStaticMarkup(<ExperimentComparisonPanel runs={[]} locale="en" />);
    expect(html).toContain('No experiment runs to compare');
  });
});

describe('StrategyPromotionPanel', () => {
  it('renders empty state', async () => {
    const { StrategyPromotionPanel } = await import('./StrategyPromotionPanel.tsx');
    const html = renderToStaticMarkup(<StrategyPromotionPanel promotion={null} locale="en" />);
    expect(html).toContain('No promotion request');
  });

  it('renders promotion status and decisions', async () => {
    const { StrategyPromotionPanel } = await import('./StrategyPromotionPanel.tsx');
    const promotion = {
      id: 'p1',
      strategyCandidateId: 's1',
      strategyVersionId: 'sv1',
      status: 'approved_for_paper' as const,
      gates: [],
      decisions: [
        {
          id: 'd1',
          promotionRequestId: 'p1',
          actor: 'risk-mgr',
          actorType: 'human' as const,
          role: 'risk_manager',
          action: 'approve_paper' as const,
          reason: 'Metrics acceptable',
          evidenceLinks: [],
          timestamp: '2026-05-10T10:00:00Z',
          metadata: {},
        },
      ],
      requestedBy: 'researcher-1',
      createdAt: '2026-05-10T09:00:00Z',
      updatedAt: '2026-05-10T10:00:00Z',
      metadata: {},
    };
    const html = renderToStaticMarkup(<StrategyPromotionPanel promotion={promotion} locale="en" />);
    expect(html).toContain('approved for paper');
    expect(html).toContain('risk-mgr');
    expect(html).toContain('Metrics acceptable');
  });
});

describe('PromotionGateChecklist', () => {
  it('renders empty state', async () => {
    const { PromotionGateChecklist } = await import('./PromotionGateChecklist.tsx');
    const html = renderToStaticMarkup(<PromotionGateChecklist gates={[]} locale="en" />);
    expect(html).toContain('No gate data');
  });

  it('renders gates with status', async () => {
    const { PromotionGateChecklist } = await import('./PromotionGateChecklist.tsx');
    const gates = [
      {
        key: 'dataset_quality',
        label: 'Dataset Quality',
        status: 'passed' as const,
        evidenceId: 'dq-1',
        evaluatedAt: '2026-05-10T08:00:00Z',
        evaluatedBy: 'system',
        reason: 'All checks pass',
        metadata: {},
      },
      {
        key: 'robustness_diagnostics',
        label: 'Robustness',
        status: 'failed' as const,
        evidenceId: null,
        evaluatedAt: '2026-05-10T08:00:00Z',
        evaluatedBy: 'system',
        reason: 'High overfit risk',
        metadata: {},
      },
    ];
    const html = renderToStaticMarkup(
      <PromotionGateChecklist gates={gates as PromotionGate[]} locale="en" />
    );
    expect(html).toContain('Dataset Quality');
    expect(html).toContain('passed');
    expect(html).toContain('Robustness');
    expect(html).toContain('failed');
    expect(html).toContain('High overfit risk');
  });
});

describe('DecisionRecordTimeline', () => {
  it('renders empty state', async () => {
    const { DecisionRecordTimeline } = await import('./DecisionRecordTimeline.tsx');
    const html = renderToStaticMarkup(<DecisionRecordTimeline records={[]} locale="en" />);
    expect(html).toContain('No decision records');
  });

  it('renders timeline entries', async () => {
    const { DecisionRecordTimeline } = await import('./DecisionRecordTimeline.tsx');
    const records = [
      {
        id: 'dr-1',
        entityType: 'promotion' as const,
        entityId: 'p-1',
        actor: 'risk-mgr',
        actorType: 'human' as const,
        role: 'risk_manager',
        action: 'approve_paper',
        reason: 'Meets criteria',
        evidenceLinks: [],
        timestamp: '2026-05-10T10:00:00Z',
        metadata: {},
      },
    ];
    const html = renderToStaticMarkup(<DecisionRecordTimeline records={records} locale="en" />);
    expect(html).toContain('risk-mgr');
    expect(html).toContain('risk_manager');
    expect(html).toContain('approve_paper');
    expect(html).toContain('Meets criteria');
  });
});
