import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
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
});
