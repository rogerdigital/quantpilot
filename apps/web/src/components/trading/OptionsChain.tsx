import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '../../modules/console/console.i18n.tsx';

interface OptionData {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  impliedVolatility: number;
}

interface StrikeRow {
  strike: number;
  call: OptionData;
  put: OptionData;
}

interface OptionChainData {
  underlying: string;
  currentPrice: number;
  daysToExpiry: number;
  volatility: number;
  riskFreeRate: number;
  chain: StrikeRow[];
}

interface OptionsChainProps {
  underlying?: string;
  onStrikeSelect?: (strike: number, type: 'CALL' | 'PUT', data: OptionData) => void;
  className?: string;
}

export function OptionsChain({ underlying = 'AAPL', onStrikeSelect, className = '' }: OptionsChainProps) {
  const { locale } = useLocale();
  const [chainData, setChainData] = useState<OptionChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExpiry, setSelectedExpiry] = useState(30);
  const [viewMode, setViewMode] = useState<'chain' | 'greeks'>('chain');

  const fetchChain = useCallback(async () => {
    setLoading(true);
    try {
      // In real implementation, this would call the API
      // For now, generate locally
      const res = await fetch(`/api/market/option-chain?underlying=${underlying}&days=${selectedExpiry}`);
      const data = await res.json();

      if (data.ok) {
        setChainData(data.chain);
      }
    } catch (err) {
      console.error('Failed to fetch option chain:', err);
    } finally {
      setLoading(false);
    }
  }, [underlying, selectedExpiry]);

  useEffect(() => {
    fetchChain();
  }, [fetchChain]);

  if (loading) {
    return (
      <div className={className} style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
        {locale === 'zh' ? '加载期权链...' : 'Loading option chain...'}
      </div>
    );
  }

  if (!chainData) {
    return (
      <div className={className} style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
        {locale === 'zh' ? '无法加载期权链' : 'Failed to load option chain'}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '12px',
          background: 'var(--panel)',
          borderRadius: 'var(--radius)',
        }}
      >
        <div>
          <h3 style={{ font: '700 16px/1.3 var(--font-ui)', color: 'var(--text)' }}>
            {underlying} {locale === 'zh' ? '期权链' : 'Options Chain'}
          </h3>
          <div style={{ font: '400 12px/1 var(--font-ui)', color: 'var(--muted)', marginTop: '4px' }}>
            {locale === 'zh' ? '当前价格' : 'Price'}: ${chainData.currentPrice.toFixed(2)} |{' '}
            {locale === 'zh' ? '到期天数' : 'Days'}: {chainData.daysToExpiry} |{' '}
            IV: {(chainData.volatility * 100).toFixed(1)}%
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Expiry selector */}
          <select
            value={selectedExpiry}
            onChange={(e) => setSelectedExpiry(Number(e.target.value))}
            style={{
              padding: '6px 10px',
              background: 'var(--panel-2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              font: '400 12px/1 var(--font-ui)',
              outline: 'none',
            }}
          >
            <option value={7}>7 {locale === 'zh' ? '天' : 'days'}</option>
            <option value={14}>14 {locale === 'zh' ? '天' : 'days'}</option>
            <option value={30}>30 {locale === 'zh' ? '天' : 'days'}</option>
            <option value={60}>60 {locale === 'zh' ? '天' : 'days'}</option>
            <option value={90}>90 {locale === 'zh' ? '天' : 'days'}</option>
          </select>

          {/* View mode toggle */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'chain' ? 'greeks' : 'chain')}
            style={{
              padding: '6px 10px',
              background: 'var(--panel-2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              font: '400 12px/1 var(--font-ui)',
              cursor: 'pointer',
            }}
          >
            {viewMode === 'chain' ? 'Greeks' : locale === 'zh' ? '期权链' : 'Chain'}
          </button>
        </div>
      </div>

      {/* Option chain table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            font: '400 12px/1.4 var(--font-data)',
          }}
        >
          <thead>
            <tr>
              {/* Call columns */}
              <th style={{ padding: '8px', textAlign: 'right', color: 'var(--buy)', borderBottom: '1px solid var(--line)' }}>
                {locale === 'zh' ? '买入价' : 'Bid'}
              </th>
              <th style={{ padding: '8px', textAlign: 'right', color: 'var(--buy)', borderBottom: '1px solid var(--line)' }}>
                {locale === 'zh' ? '卖出价' : 'Ask'}
              </th>
              <th style={{ padding: '8px', textAlign: 'right', color: 'var(--buy)', borderBottom: '1px solid var(--line)' }}>
                {locale === 'zh' ? '最新价' : 'Last'}
              </th>
              <th style={{ padding: '8px', textAlign: 'right', color: 'var(--buy)', borderBottom: '1px solid var(--line)' }}>
                IV
              </th>
              {viewMode === 'greeks' && (
                <>
                  <th style={{ padding: '8px', textAlign: 'right', color: 'var(--buy)', borderBottom: '1px solid var(--line)' }}>Delta</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: 'var(--buy)', borderBottom: '1px solid var(--line)' }}>Gamma</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: 'var(--buy)', borderBottom: '1px solid var(--line)' }}>Theta</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: 'var(--buy)', borderBottom: '1px solid var(--line)' }}>Vega</th>
                </>
              )}

              {/* Strike */}
              <th
                style={{
                  padding: '8px',
                  textAlign: 'center',
                  color: 'var(--text)',
                  background: 'var(--panel)',
                  borderBottom: '1px solid var(--line)',
                  fontWeight: 700,
                }}
              >
                {locale === 'zh' ? '行权价' : 'Strike'}
              </th>

              {/* Put columns */}
              <th style={{ padding: '8px', textAlign: 'right', color: 'var(--sell)', borderBottom: '1px solid var(--line)' }}>
                IV
              </th>
              <th style={{ padding: '8px', textAlign: 'right', color: 'var(--sell)', borderBottom: '1px solid var(--line)' }}>
                {locale === 'zh' ? '最新价' : 'Last'}
              </th>
              <th style={{ padding: '8px', textAlign: 'right', color: 'var(--sell)', borderBottom: '1px solid var(--line)' }}>
                {locale === 'zh' ? '买入价' : 'Bid'}
              </th>
              <th style={{ padding: '8px', textAlign: 'right', color: 'var(--sell)', borderBottom: '1px solid var(--line)' }}>
                {locale === 'zh' ? '卖出价' : 'Ask'}
              </th>
              {viewMode === 'greeks' && (
                <>
                  <th style={{ padding: '8px', textAlign: 'right', color: 'var(--sell)', borderBottom: '1px solid var(--line)' }}>Delta</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: 'var(--sell)', borderBottom: '1px solid var(--line)' }}>Gamma</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: 'var(--sell)', borderBottom: '1px solid var(--line)' }}>Theta</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: 'var(--sell)', borderBottom: '1px solid var(--line)' }}>Vega</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {chainData.chain.map((row) => {
              const isITMCall = row.strike < chainData.currentPrice;
              const isITMPut = row.strike > chainData.currentPrice;

              return (
                <tr
                  key={row.strike}
                  style={{
                    background: row.strike === Math.round(chainData.currentPrice)
                      ? 'var(--accent-subtle)'
                      : 'transparent',
                  }}
                >
                  {/* Call side */}
                  <td
                    style={{ padding: '6px 8px', textAlign: 'right', cursor: 'pointer' }}
                    onClick={() => onStrikeSelect?.(row.strike, 'CALL', row.call)}
                  >
                    {(row.call.price * 0.98).toFixed(2)}
                  </td>
                  <td
                    style={{ padding: '6px 8px', textAlign: 'right', cursor: 'pointer' }}
                    onClick={() => onStrikeSelect?.(row.strike, 'CALL', row.call)}
                  >
                    {(row.call.price * 1.02).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: '6px 8px',
                      textAlign: 'right',
                      cursor: 'pointer',
                      color: isITMCall ? 'var(--buy)' : 'var(--text)',
                      fontWeight: isITMCall ? 600 : 400,
                    }}
                    onClick={() => onStrikeSelect?.(row.strike, 'CALL', row.call)}
                  >
                    {row.call.price.toFixed(2)}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                    {(row.call.impliedVolatility * 100).toFixed(1)}%
                  </td>
                  {viewMode === 'greeks' && (
                    <>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.call.delta.toFixed(3)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.call.gamma.toFixed(4)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.call.theta.toFixed(2)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.call.vega.toFixed(2)}</td>
                    </>
                  )}

                  {/* Strike */}
                  <td
                    style={{
                      padding: '6px 8px',
                      textAlign: 'center',
                      fontWeight: 700,
                      background: 'var(--panel)',
                    }}
                  >
                    {row.strike.toFixed(2)}
                  </td>

                  {/* Put side */}
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                    {(row.put.impliedVolatility * 100).toFixed(1)}%
                  </td>
                  <td
                    style={{
                      padding: '6px 8px',
                      textAlign: 'right',
                      cursor: 'pointer',
                      color: isITMPut ? 'var(--sell)' : 'var(--text)',
                      fontWeight: isITMPut ? 600 : 400,
                    }}
                    onClick={() => onStrikeSelect?.(row.strike, 'PUT', row.put)}
                  >
                    {row.put.price.toFixed(2)}
                  </td>
                  <td
                    style={{ padding: '6px 8px', textAlign: 'right', cursor: 'pointer' }}
                    onClick={() => onStrikeSelect?.(row.strike, 'PUT', row.put)}
                  >
                    {(row.put.price * 0.98).toFixed(2)}
                  </td>
                  <td
                    style={{ padding: '6px 8px', textAlign: 'right', cursor: 'pointer' }}
                    onClick={() => onStrikeSelect?.(row.strike, 'PUT', row.put)}
                  >
                    {(row.put.price * 1.02).toFixed(2)}
                  </td>
                  {viewMode === 'greeks' && (
                    <>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.put.delta.toFixed(3)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.put.gamma.toFixed(4)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.put.theta.toFixed(2)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.put.vega.toFixed(2)}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
