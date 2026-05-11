import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

describe('RiskPolicyEditor', () => {
  it('renders empty state', async () => {
    const { RiskPolicyEditor } = await import('./RiskPolicyEditor.tsx');
    const html = renderToStaticMarkup(<RiskPolicyEditor policies={[]} locale="en" />);
    expect(html).toContain('No risk policies');
  });

  it('renders policy with rules', async () => {
    const { RiskPolicyEditor } = await import('./RiskPolicyEditor.tsx');
    const policies = [
      {
        id: 'rp-1',
        name: 'Default Policy',
        isActive: true,
        rules: [
          { dimension: 'max_leverage', limit: 1.5, severity: 'blocker' },
          { dimension: 'allowed_universe', limit: ['AAPL', 'MSFT'], severity: 'blocker' },
        ],
      },
    ];
    const html = renderToStaticMarkup(<RiskPolicyEditor policies={policies} locale="en" />);
    expect(html).toContain('Default Policy');
    expect(html).toContain('Active');
    expect(html).toContain('max_leverage');
    expect(html).toContain('1.5');
    expect(html).toContain('AAPL, MSFT');
  });
});

describe('RiskAssessmentPanel', () => {
  it('renders empty state', async () => {
    const { RiskAssessmentPanel } = await import('./RiskAssessmentPanel.tsx');
    const html = renderToStaticMarkup(<RiskAssessmentPanel assessments={[]} locale="en" />);
    expect(html).toContain('No assessments');
  });

  it('renders blocked assessment with findings', async () => {
    const { RiskAssessmentPanel } = await import('./RiskAssessmentPanel.tsx');
    const assessments = [
      {
        entityId: 'exec-1',
        entityType: 'execution',
        passed: false,
        overallSeverity: 'blocker',
        findings: [
          { dimension: 'max_order_notional', message: 'Order too large', severity: 'blocker' },
        ],
      },
    ];
    const html = renderToStaticMarkup(
      <RiskAssessmentPanel assessments={assessments} locale="en" />
    );
    expect(html).toContain('Blocked');
    expect(html).toContain('Order too large');
  });
});

describe('KillSwitchPanel', () => {
  it('renders inactive state', async () => {
    const { KillSwitchPanel } = await import('./KillSwitchPanel.tsx');
    const html = renderToStaticMarkup(
      <KillSwitchPanel
        state={{ active: false, activatedAt: null, activatedBy: null, reason: null }}
        locale="en"
      />
    );
    expect(html).toContain('Inactive');
    expect(html).toContain('Typed confirmation required');
  });

  it('renders active state with details', async () => {
    const { KillSwitchPanel } = await import('./KillSwitchPanel.tsx');
    const html = renderToStaticMarkup(
      <KillSwitchPanel
        state={{
          active: true,
          activatedAt: '2026-05-10T10:00:00Z',
          activatedBy: 'risk-mgr',
          reason: 'Flash crash',
        }}
        locale="en"
      />
    );
    expect(html).toContain('ACTIVE');
    expect(html).toContain('risk-mgr');
    expect(html).toContain('Flash crash');
  });
});
