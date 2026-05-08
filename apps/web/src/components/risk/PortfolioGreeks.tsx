import { useLocale } from '../../modules/console/console.i18n.tsx';

interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

interface PortfolioGreeksProps {
  greeks: Greeks;
  underlyingPrice?: number;
  className?: string;
}

export function PortfolioGreeks({ greeks, underlyingPrice = 100, className = '' }: PortfolioGreeksProps) {
  const { locale } = useLocale();

  const metrics = [
    {
      label: 'Delta',
      labelZh: 'Delta',
      value: greeks.delta,
      description: locale === 'zh'
        ? '标的价格变动 1 美元时的损益变化'
        : 'P&L change when underlying moves $1',
      format: (v: number) => v.toFixed(2),
      color: greeks.delta >= 0 ? 'var(--buy)' : 'var(--sell)',
    },
    {
      label: 'Gamma',
      labelZh: 'Gamma',
      value: greeks.gamma,
      description: locale === 'zh'
        ? 'Delta 的变化率（凸性）'
        : 'Rate of change of delta (convexity)',
      format: (v: number) => v.toFixed(4),
      color: 'var(--text)',
    },
    {
      label: 'Theta',
      labelZh: 'Theta',
      value: greeks.theta,
      description: locale === 'zh'
        ? '每日时间衰减'
        : 'Daily time decay',
      format: (v: number) => v.toFixed(2),
      color: greeks.theta <= 0 ? 'var(--sell)' : 'var(--buy)',
    },
    {
      label: 'Vega',
      labelZh: 'Vega',
      value: greeks.vega,
      description: locale === 'zh'
        ? '波动率变动 1% 时的损益变化'
        : 'P&L change when volatility moves 1%',
      format: (v: number) => v.toFixed(2),
      color: 'var(--text)',
    },
    {
      label: 'Rho',
      labelZh: 'Rho',
      value: greeks.rho,
      description: locale === 'zh'
        ? '利率变动 1% 时的损益变化'
        : 'P&L change when interest rate moves 1%',
      format: (v: number) => v.toFixed(2),
      color: 'var(--text)',
    },
  ];

  // Calculate dollar delta (delta * underlying price * 100 for options)
  const dollarDelta = greeks.delta * underlyingPrice * 100;

  return (
    <div className={className} style={{ padding: '16px' }}>
      <h3 style={{ font: '700 14px/1.3 var(--font-ui)', color: 'var(--text)', marginBottom: '16px' }}>
        {locale === 'zh' ? '组合 Greeks' : 'Portfolio Greeks'}
      </h3>

      {/* Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '20px',
          padding: '12px',
          background: 'var(--panel)',
          borderRadius: 'var(--radius)',
        }}
      >
        <div>
          <div style={{ font: '400 11px/1 var(--font-ui)', color: 'var(--muted)' }}>
            {locale === 'zh' ? '美元 Delta' : 'Dollar Delta'}
          </div>
          <div
            style={{
              font: '600 18px/1 var(--font-data)',
              color: dollarDelta >= 0 ? 'var(--buy)' : 'var(--sell)',
              marginTop: '4px',
            }}
          >
            {dollarDelta >= 0 ? '+' : ''}{dollarDelta.toFixed(0)}
          </div>
        </div>
        <div>
          <div style={{ font: '400 11px/1 var(--font-ui)', color: 'var(--muted)' }}>
            {locale === 'zh' ? '每日 Theta' : 'Daily Theta'}
          </div>
          <div
            style={{
              font: '600 18px/1 var(--font-data)',
              color: greeks.theta <= 0 ? 'var(--sell)' : 'var(--buy)',
              marginTop: '4px',
            }}
          >
            {greeks.theta <= 0 ? '' : '+'}{greeks.theta.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Detailed Greeks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {metrics.map((metric) => (
          <div
            key={metric.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'var(--panel)',
              borderRadius: 'var(--radius)',
            }}
          >
            <div>
              <div style={{ font: '500 13px/1.3 var(--font-ui)', color: 'var(--text)' }}>
                {locale === 'zh' ? metric.labelZh : metric.label}
              </div>
              <div style={{ font: '400 11px/1.3 var(--font-ui)', color: 'var(--muted)' }}>
                {metric.description}
              </div>
            </div>
            <div style={{ font: '600 14px/1 var(--font-data)', color: metric.color }}>
              {metric.format(metric.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Greeks exposure bar */}
      <div style={{ marginTop: '16px' }}>
        <div style={{ font: '400 11px/1 var(--font-ui)', color: 'var(--muted)', marginBottom: '8px' }}>
          {locale === 'zh' ? 'Delta 暴露' : 'Delta Exposure'}
        </div>
        <div
          style={{
            height: '8px',
            background: 'var(--panel-2)',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: '1px',
              background: 'var(--line)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: greeks.delta >= 0 ? '50%' : `${50 + (greeks.delta / 100) * 50}%`,
              width: `${Math.abs(greeks.delta / 100) * 50}%`,
              background: greeks.delta >= 0 ? 'var(--buy)' : 'var(--sell)',
              borderRadius: greeks.delta >= 0 ? '0 4px 4px 0' : '4px 0 0 4px',
            }}
          />
        </div>
      </div>
    </div>
  );
}
