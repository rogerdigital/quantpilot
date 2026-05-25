import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '../../modules/console/console.i18n.tsx';

interface PromotionCheck {
  name: string;
  label: string;
  labelZh: string;
  current: number;
  required: number;
  met: boolean;
  unit: string;
  format?: (v: number) => string;
}

interface PromotionReadiness {
  ready: boolean;
  score: number;
  metrics: any;
  criteria: PromotionCheck[];
  message: string;
}

interface PaperPerformancePanelProps {
  strategyId?: string;
  className?: string;
}

export function PaperPerformancePanel({
  strategyId = 'default',
  className = '',
}: PaperPerformancePanelProps) {
  const { locale } = useLocale();
  const [readiness, setReadiness] = useState<PromotionReadiness | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReadiness = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/execution/paper-promotion/${strategyId}`);
      const data = await res.json();
      if (data.ok) {
        setReadiness(data.readiness);
      }
    } catch (err) {
      console.error('Failed to fetch promotion readiness:', err);
    } finally {
      setLoading(false);
    }
  }, [strategyId]);

  useEffect(() => {
    fetchReadiness();
  }, [fetchReadiness]);

  if (loading) {
    return (
      <div
        className={className}
        style={{ padding: '20px', color: 'var(--muted)', textAlign: 'center' }}
      >
        {locale === 'zh' ? '加载中...' : 'Loading...'}
      </div>
    );
  }

  if (!readiness?.metrics) {
    return (
      <div
        className={className}
        style={{ padding: '20px', color: 'var(--muted)', textAlign: 'center' }}
      >
        {locale === 'zh' ? '暂无模拟交易数据' : 'No paper trading data available'}
      </div>
    );
  }

  const { metrics, criteria, score, ready } = readiness;

  return (
    <div className={className} style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h3
          style={{ font: '700 16px/1.3 var(--font-ui)', color: 'var(--text)', marginBottom: '4px' }}
        >
          {locale === 'zh' ? '模拟交易表现' : 'Paper Trading Performance'}
        </h3>
        <p style={{ font: '400 12px/1.4 var(--font-ui)', color: 'var(--muted)' }}>
          {locale === 'zh'
            ? '跟踪模拟交易表现，评估是否满足实盘升级条件'
            : 'Track paper trading performance and evaluate live promotion readiness'}
        </p>
      </div>

      {/* Metrics Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ font: '600 18px/1 var(--font-data)', color: 'var(--buy)' }}>
            {metrics.tradingDays}
          </div>
          <div
            style={{ font: '400 10px/1 var(--font-ui)', color: 'var(--muted)', marginTop: '4px' }}
          >
            {locale === 'zh' ? '交易天数' : 'Trading Days'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ font: '600 18px/1 var(--font-data)', color: 'var(--text)' }}>
            {metrics.sharpe.toFixed(2)}
          </div>
          <div
            style={{ font: '400 10px/1 var(--font-ui)', color: 'var(--muted)', marginTop: '4px' }}
          >
            Sharpe
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ font: '600 18px/1 var(--font-data)', color: 'var(--sell)' }}>
            {(metrics.maxDrawdown * 100).toFixed(1)}%
          </div>
          <div
            style={{ font: '400 10px/1 var(--font-ui)', color: 'var(--muted)', marginTop: '4px' }}
          >
            {locale === 'zh' ? '最大回撤' : 'Max DD'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ font: '600 18px/1 var(--font-data)', color: 'var(--buy)' }}>
            {(metrics.winRate * 100).toFixed(1)}%
          </div>
          <div
            style={{ font: '400 10px/1 var(--font-ui)', color: 'var(--muted)', marginTop: '4px' }}
          >
            {locale === 'zh' ? '胜率' : 'Win Rate'}
          </div>
        </div>
      </div>

      {/* Promotion Readiness */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <h4 style={{ font: '600 14px/1 var(--font-ui)', color: 'var(--text)' }}>
            {locale === 'zh' ? '实盘升级条件' : 'Live Promotion Criteria'}
          </h4>
          <div
            style={{
              padding: '4px 10px',
              background: ready ? 'var(--success-subtle)' : 'var(--warning-subtle)',
              borderRadius: 'var(--radius)',
              font: '600 12px/1 var(--font-data)',
              color: ready ? 'var(--success)' : 'var(--warning)',
            }}
          >
            {ready ? (locale === 'zh' ? '已就绪' : 'Ready') : `${score}%`}
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: '6px',
            background: 'var(--panel-2)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${score}%`,
              background: ready ? 'var(--success)' : 'var(--accent)',
              borderRadius: '3px',
              transition: 'width 300ms ease',
            }}
          />
        </div>

        {/* Criteria list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {criteria.map((check) => {
            const formatFn = check.format || ((v) => String(v));
            return (
              <div
                key={check.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  background: check.met ? 'var(--success-subtle)' : 'var(--panel)',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${check.met ? 'var(--success)' : 'var(--line)'}`,
                }}
              >
                <span style={{ fontSize: '16px', lineHeight: 1 }}>{check.met ? '✓' : '○'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '500 13px/1.3 var(--font-ui)', color: 'var(--text)' }}>
                    {locale === 'zh' ? check.labelZh : check.label}
                  </div>
                  <div style={{ font: '400 11px/1.3 var(--font-ui)', color: 'var(--muted)' }}>
                    {locale === 'zh' ? '当前' : 'Current'}: {formatFn(check.current)} /{' '}
                    {locale === 'zh' ? '要求' : 'Required'}: {formatFn(check.required)}
                  </div>
                </div>
                <div
                  style={{
                    font: '600 12px/1 var(--font-data)',
                    color: check.met ? 'var(--success)' : 'var(--muted)',
                  }}
                >
                  {check.met
                    ? locale === 'zh'
                      ? '已达标'
                      : 'Met'
                    : locale === 'zh'
                      ? '未达标'
                      : 'Not Met'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action button */}
      <button
        type="button"
        disabled={!ready}
        style={{
          width: '100%',
          padding: '12px',
          background: ready ? 'var(--accent)' : 'var(--panel-2)',
          border: 'none',
          borderRadius: 'var(--radius)',
          color: ready ? '#fff' : 'var(--muted)',
          font: '600 14px/1 var(--font-ui)',
          cursor: ready ? 'pointer' : 'not-allowed',
          transition: 'all 150ms ease',
        }}
      >
        {ready
          ? locale === 'zh'
            ? '申请实盘升级'
            : 'Request Live Promotion'
          : locale === 'zh'
            ? '继续模拟交易'
            : 'Continue Paper Trading'}
      </button>
    </div>
  );
}
