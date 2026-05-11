import { EmptyState } from '../../components/layout/ConsoleChrome.tsx';
import { useLocale } from '../console/console.i18n.tsx';
import { AgentEvidenceCard } from './AgentEvidenceCard.tsx';

type AgentReview = {
  reviewType: string;
  targetId: string;
  verdict: string;
  summary: string;
  evidenceCitations: Array<{ kind: string; ref: string; label: string }>;
  recommendations: string[];
  generatedAt: string;
};

type AgentReviewQueueProps = {
  reviews: AgentReview[];
  loading?: boolean;
};

export function AgentReviewQueue({ reviews, loading }: AgentReviewQueueProps) {
  const { locale } = useLocale();

  if (loading) {
    return (
      <div style={{ padding: 12, fontSize: 12, color: 'var(--text-tertiary)' }}>
        {locale === 'zh' ? '加载审阅队列…' : 'Loading review queue…'}
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <EmptyState
        message={locale === 'zh' ? '暂无待处理的 Agent 审阅' : 'No agent reviews pending'}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
        {locale === 'zh' ? `Agent 审阅 (${reviews.length})` : `Agent Reviews (${reviews.length})`}
      </div>
      {reviews.map((review, idx) => (
        <AgentEvidenceCard key={`${review.targetId}-${idx}`} review={review} />
      ))}
    </div>
  );
}
