import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { StrategyCatalogItem } from '@shared-types/trading.ts';
import { BacktestCandidateStrategyRow } from './BacktestCandidateStrategyRow.tsx';
import type { BacktestRunItem } from '@shared-types/trading.ts';
import { ResearchActionBar, ResearchActionButton } from './ResearchActionBar.tsx';
import { BacktestRunQueueRow } from './BacktestRunQueueRow.tsx';
import { ResearchAuditFeedRow } from './ResearchAuditFeedRow.tsx';
import { ResearchCollectionPanel } from './ResearchCollectionPanel.tsx';
import { ResearchDetailInspectionPanel } from './ResearchDetailInspectionPanel.tsx';
import { ResearchExecutionPlanRow } from './ResearchExecutionPlanRow.tsx';
import { ResearchEventInspectionPanel } from './ResearchEventInspectionPanel.tsx';
import { ResearchRunSummaryRow } from './ResearchRunSummaryRow.tsx';
import { ResearchStatusPanel } from './ResearchStatusPanel.tsx';
import { StrategyCatalogRow } from './StrategyCatalogRow.tsx';
import { ResearchTerminalPanel } from './ResearchTerminalPanel.tsx';
import { ResearchTimelineEventRow } from './ResearchTimelineEventRow.tsx';
import { ResearchVersionSnapshotRow } from './ResearchVersionSnapshotRow.tsx';
import { ResearchWorkflowStepRow } from './ResearchWorkflowStepRow.tsx';
import { getBacktestCollectionConfigs, getStrategyCollectionConfigs } from './researchCollectionConfigs.ts';
import { getBacktestDetailInspectionConfig, getStrategyDetailInspectionConfig } from './researchDetailConfigs.ts';
import { getStrategyTimelineActionLabel, getStrategyTimelineGuidance } from './researchEventInspection.tsx';
import { getStrategyTimelineInspectionConfig, getWorkflowInspectionConfig, getWorkflowStepInspectionConfig } from './researchInspectionConfigs.ts';

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
      />,
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
      </ResearchDetailInspectionPanel>,
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
      </ResearchCollectionPanel>,
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
      />,
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
      </ResearchTerminalPanel>,
    );

    expect(html).toContain('Prelude block');
    expect(html).toContain('Row body');
    expect(html).toContain('Footer block');
  });

  it('renders shared research action bar buttons', () => {
    const html = renderToStaticMarkup(
      <ResearchActionBar>
        <ResearchActionButton label="Open Strategy Detail" priority="primary" onClick={() => undefined} />
        <ResearchActionButton label="Return to Strategy Timeline" onClick={() => undefined} />
      </ResearchActionBar>,
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
      />,
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
      />,
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

    const html = renderToStaticMarkup(
      <ResearchRunSummaryRow
        locale="en"
        run={run}
      />,
    );

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
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            status: 'ready',
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
        }}
        onAction={() => undefined}
      />,
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
      />,
    );

    expect(html).toContain('Queued run');
    expect(html).toContain('Research');
    expect(html).toContain('Inspect');
  });

  it('returns shared strategy timeline guidance and action labels', () => {
    expect(getStrategyTimelineGuidance('en', 'run')).toContain('research runs panel');
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
      (value) => value,
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
      (value) => value,
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
      { key: 'risk_review', status: 'completed' },
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
      },
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
      (value) => `${value.toFixed(1)}%`,
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

  it('renders workflow step row with selected state', () => {
    const html = renderToStaticMarkup(
      <ResearchWorkflowStepRow
        locale="en"
        step={{ key: 'risk_review', status: 'completed' }}
        selectedStepKey="risk_review"
        onInspect={() => undefined}
      />,
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
      />,
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
      />,
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
      />,
    );

    expect(html).toContain('Reversion');
    expect(html).toContain('Promote to paper');
    expect(html).toContain('Archive');
    expect(html).toContain('Inspect');
  });
});
