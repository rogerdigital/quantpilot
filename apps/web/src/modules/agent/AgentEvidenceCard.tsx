import { useLocale } from '../console/console.i18n.tsx';

type EvidenceCitation = {
  kind: string;
  ref: string;
  label: string;
};

type AgentReview = {
  reviewType: string;
  targetId: string;
  verdict: string;
  summary: string;
  evidenceCitations: EvidenceCitation[];
  recommendations: string[];
  generatedAt: string;
};

const verdictColors: Record<string, string> = {
  acceptable: 'var(--accent-green, #22c55e)',
  promotion_recommended: 'var(--accent-green, #22c55e)',
  has_supporting_evidence: 'var(--accent-green, #22c55e)',
  resolved: 'var(--accent-green, #22c55e)',
  overfit_risk_detected: 'var(--accent-amber, #f59e0b)',
  needs_experiment: 'var(--accent-amber, #f59e0b)',
  needs_investigation: 'var(--accent-amber, #f59e0b)',
  promotion_deferred: 'var(--accent-amber, #f59e0b)',
  policy_breach: 'var(--accent-amber, #f59e0b)',
  critical_violation: 'var(--accent-red, #ef4444)',
  needs_escalation: 'var(--accent-red, #ef4444)',
  error: 'var(--accent-red, #ef4444)',
};

const kindIcons: Record<string, string> = {
  dataset: '📊',
  experiment: '🧪',
  backtest: '📈',
  risk_assessment: '⚠️',
  execution_record: '⚡',
  model: '🤖',
  promotion: '🚀',
};

function EvidenceChip({ citation }: { citation: EvidenceCitation }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
        background: 'var(--surface-2, rgba(255,255,255,0.04))',
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        fontSize: 12,
        color: 'var(--text-secondary, rgba(255,255,255,0.7))',
      }}
    >
      <span>{kindIcons[citation.kind] || '📎'}</span>
      <span>{citation.label}</span>
    </span>
  );
}

export function AgentEvidenceCard({ review }: { review: AgentReview }) {
  const { locale } = useLocale();
  const verdictColor = verdictColors[review.verdict] || 'var(--text-secondary)';

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 8,
        background: 'var(--surface-1, rgba(255,255,255,0.02))',
        border: '1px solid var(--border, rgba(255,255,255,0.06))',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
          {review.reviewType.replace(/_/g, ' ')}
        </span>
        <span
          style={{
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 4,
            background: `color-mix(in srgb, ${verdictColor} 15%, transparent)`,
            color: verdictColor,
            fontWeight: 500,
          }}
        >
          {review.verdict.replace(/_/g, ' ')}
        </span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
        {review.summary}
      </p>

      {review.evidenceCitations.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
            {locale === 'zh' ? '证据引用' : 'Evidence'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {review.evidenceCitations.map((c, i) => (
              <EvidenceChip key={`${c.ref}-${i}`} citation={c} />
            ))}
          </div>
        </div>
      )}

      {review.recommendations.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
            {locale === 'zh' ? '建议' : 'Recommendations'}
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
            {review.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'right' }}>
        {new Date(review.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
