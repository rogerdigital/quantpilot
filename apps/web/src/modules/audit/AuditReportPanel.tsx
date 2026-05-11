import { useLocale } from '../console/console.i18n.tsx';

type AuditReportEntry = {
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  evidenceRef?: string;
};

type AuditReport = {
  id: string;
  reportType: string;
  title: string;
  summary: string;
  status: 'draft' | 'final' | 'exported';
  generatedBy: string;
  entries: AuditReportEntry[];
  createdAt: string;
};

type AuditReportPanelProps = {
  reports: AuditReport[];
};

const REPORT_TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  strategy_promotion: { zh: '策略晋升', en: 'Strategy Promotion' },
  live_trading_approval: { zh: '实盘审批', en: 'Live Trading Approval' },
  risk_breach: { zh: '风控突破', en: 'Risk Breach' },
  execution_incident: { zh: '执行事件', en: 'Execution Incident' },
  agent_action: { zh: 'Agent 操作', en: 'Agent Action' },
  dataset_lineage: { zh: '数据血缘', en: 'Dataset Lineage' },
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--text-tertiary)',
  final: 'var(--accent-indigo, #6366f1)',
  exported: 'var(--accent-green, #22c55e)',
};

export function AuditReportPanel({ reports }: AuditReportPanelProps) {
  const { locale } = useLocale();

  if (reports.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          color: 'var(--text-tertiary)',
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        {locale === 'zh' ? '暂无合规审计报告' : 'No compliance reports available'}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {reports.map((report) => (
        <div
          key={report.id}
          style={{
            padding: 12,
            borderRadius: 8,
            background: 'var(--surface-1, rgba(255,255,255,0.02))',
            border: '1px solid var(--border, rgba(255,255,255,0.06))',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
              {report.title}
            </span>
            <span
              style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                background: STATUS_COLORS[report.status] || 'var(--text-tertiary)',
                color: '#fff',
                fontWeight: 500,
              }}
            >
              {report.status}
            </span>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {REPORT_TYPE_LABELS[report.reportType]?.[locale] || report.reportType}
            {' · '}
            {report.generatedBy}
            {' · '}
            {new Date(report.createdAt).toLocaleDateString()}
          </div>

          {report.summary && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
              {report.summary}
            </div>
          )}

          {report.entries.length > 0 && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-tertiary)',
                borderTop: '1px solid var(--border, rgba(255,255,255,0.06))',
                paddingTop: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {report.entries.slice(0, 5).map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ opacity: 0.6 }}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span>{entry.actor}</span>
                  <span style={{ fontWeight: 500 }}>{entry.action}</span>
                  {entry.detail && <span style={{ opacity: 0.7 }}>{entry.detail}</span>}
                </div>
              ))}
              {report.entries.length > 5 && (
                <div style={{ opacity: 0.5 }}>
                  +{report.entries.length - 5} {locale === 'zh' ? '更多条目' : 'more entries'}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
