import type { AgentDailyRunRecord } from '@shared-types/trading.ts';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../console/console.i18n.tsx';
import { fmtDateTime } from '../console/console.utils.ts';
import {
  summaryCard,
  summaryCardFooter,
  summaryCardHeader,
  summaryCardTime,
  summaryCardTitle,
  summaryKindChip,
  summarySkeletonLine,
  summaryStatusChip,
  summaryText,
} from './AgentDailySummaryCard.css.ts';
import { fetchAgentWorkbench } from './agentTools.service.ts';

const KIND_LABELS: Record<string, { zh: string; en: string }> = {
  pre_market: { zh: '盘前', en: 'Pre-Market' },
  intraday_monitor: { zh: '盘中', en: 'Intraday' },
  post_market: { zh: '盘后', en: 'Post-Market' },
};

const STATUS_LABELS: Record<string, { zh: string; en: string }> = {
  completed: { zh: '已完成', en: 'Completed' },
  running: { zh: '运行中', en: 'Running' },
  failed: { zh: '失败', en: 'Failed' },
  queued: { zh: '排队中', en: 'Queued' },
};

export function AgentDailySummaryCard() {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [run, setRun] = useState<AgentDailyRunRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentWorkbench()
      .then((wb) => {
        const runs = (wb.dailyRuns as AgentDailyRunRecord[]) ?? [];
        // Most recent first
        const sorted = [...runs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRun(sorted[0] ?? null);
      })
      .catch(() => setRun(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={summaryCard} style={{ gap: '12px' }}>
        <div className={summarySkeletonLine} style={{ width: '40%' }} />
        <div className={summarySkeletonLine} style={{ width: '100%' }} />
        <div className={summarySkeletonLine} style={{ width: '80%' }} />
      </div>
    );
  }

  if (!run) {
    return (
      <div
        className={summaryCard}
        onClick={() => navigate('/agent')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/agent')}
      >
        <div className={summaryCardHeader}>
          <div className={summaryCardTitle}>
            {locale === 'zh' ? '今日 AI 摘要' : 'AI Daily Summary'}
          </div>
          <span className="cta-arrow">›</span>
        </div>
        <div className={summaryText} style={{ color: 'var(--muted)' }}>
          {locale === 'zh'
            ? '暂无今日摘要，Agent 将于盘前自动运行'
            : 'No summary yet. Agent will run automatically before market open.'}
        </div>
      </div>
    );
  }

  const kindKey = run.kind in summaryKindChip ? run.kind : 'other';
  const statusKey = run.status in summaryStatusChip ? run.status : 'queued';
  const kindLabel = (KIND_LABELS[run.kind] ?? { zh: run.kind, en: run.kind })[locale];
  const statusLabel = (STATUS_LABELS[run.status] ?? { zh: run.status, en: run.status })[locale];
  const summary = run.summary ?? run.latestCheckpoint ?? '';

  return (
    <div
      className={summaryCard}
      onClick={() => navigate('/agent')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate('/agent')}
    >
      <div className={summaryCardHeader}>
        <div className={summaryCardTitle}>
          {locale === 'zh' ? '今日 AI 摘要' : 'AI Daily Summary'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={summaryCardTime}>{fmtDateTime(run.createdAt, locale)}</div>
          <span className="cta-arrow">›</span>
        </div>
      </div>

      {summary ? (
        <div className={summaryText}>{summary}</div>
      ) : (
        <div className={summaryText} style={{ color: 'var(--muted)' }}>
          {locale === 'zh' ? '摘要生成中…' : 'Summary is being generated…'}
        </div>
      )}

      <div className={summaryCardFooter}>
        <div className={summaryKindChip[kindKey as keyof typeof summaryKindChip]}>{kindLabel}</div>
        <div className={summaryStatusChip[statusKey as keyof typeof summaryStatusChip]}>
          {statusLabel}
        </div>
      </div>
    </div>
  );
}
