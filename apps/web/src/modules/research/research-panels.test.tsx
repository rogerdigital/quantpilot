import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { StrategyCatalogItem } from '@shared-types/trading.ts';
import { BacktestCandidateStrategyRow } from './BacktestCandidateStrategyRow.tsx';
import type { BacktestRunItem } from '@shared-types/trading.ts';
import { BacktestRunQueueRow } from './BacktestRunQueueRow.tsx';
import { ResearchCollectionPanel } from './ResearchCollectionPanel.tsx';
import { ResearchDetailInspectionPanel } from './ResearchDetailInspectionPanel.tsx';
import { ResearchEventInspectionPanel } from './ResearchEventInspectionPanel.tsx';
import { ResearchStatusPanel } from './ResearchStatusPanel.tsx';
import { ResearchTerminalPanel } from './ResearchTerminalPanel.tsx';

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
});
