import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AuditReportPanel } from './AuditReportPanel.tsx';

vi.mock('../console/console.i18n.tsx', async () => {
  const actual = await vi.importActual<typeof import('../console/console.i18n.tsx')>(
    '../console/console.i18n.tsx'
  );
  return {
    ...actual,
    useLocale: () => ({ locale: 'en' as const }),
  };
});

describe('AuditReportPanel', () => {
  it('renders empty state when no reports', () => {
    const html = renderToStaticMarkup(<AuditReportPanel reports={[]} />);
    expect(html).toContain('No compliance reports available');
  });

  it('renders report cards with title and status', () => {
    const reports = [
      {
        id: 'r1',
        reportType: 'strategy_promotion',
        title: 'Q1 Promotions',
        summary: 'Summary text',
        status: 'final' as const,
        generatedBy: 'compliance-bot',
        entries: [],
        createdAt: '2026-01-15T10:00:00Z',
      },
    ];
    const html = renderToStaticMarkup(<AuditReportPanel reports={reports} />);
    expect(html).toContain('Q1 Promotions');
    expect(html).toContain('final');
    expect(html).toContain('Strategy Promotion');
    expect(html).toContain('compliance-bot');
  });

  it('renders entries up to 5 with overflow indicator', () => {
    const entries = Array.from({ length: 7 }, (_, i) => ({
      timestamp: '2026-01-15T10:00:00Z',
      actor: `actor-${i}`,
      action: 'review',
      detail: `Entry ${i}`,
    }));
    const reports = [
      {
        id: 'r2',
        reportType: 'risk_breach',
        title: 'Risk Report',
        summary: '',
        status: 'draft' as const,
        generatedBy: 'system',
        entries,
        createdAt: '2026-01-15T10:00:00Z',
      },
    ];
    const html = renderToStaticMarkup(<AuditReportPanel reports={reports} />);
    expect(html).toContain('actor-0');
    expect(html).toContain('actor-4');
    expect(html).not.toContain('actor-5');
    expect(html).toContain('+2');
    expect(html).toContain('more entries');
  });

  it('shows all 6 report type labels correctly', () => {
    const types = [
      'strategy_promotion',
      'live_trading_approval',
      'risk_breach',
      'execution_incident',
      'agent_action',
      'dataset_lineage',
    ];
    const reports = types.map((type, i) => ({
      id: `r-${i}`,
      reportType: type,
      title: `Report ${i}`,
      summary: '',
      status: 'draft' as const,
      generatedBy: 'test',
      entries: [],
      createdAt: '2026-01-15T10:00:00Z',
    }));
    const html = renderToStaticMarkup(<AuditReportPanel reports={reports} />);
    expect(html).toContain('Strategy Promotion');
    expect(html).toContain('Live Trading Approval');
    expect(html).toContain('Risk Breach');
    expect(html).toContain('Execution Incident');
    expect(html).toContain('Agent Action');
    expect(html).toContain('Dataset Lineage');
  });
});
