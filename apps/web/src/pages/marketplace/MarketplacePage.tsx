import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '../../components/layout/ConsoleChrome.tsx';
import { useLocale } from '../../modules/console/console.i18n.tsx';

interface MarketplaceStrategy {
  id: string;
  strategyId: string;
  authorName: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  metrics: {
    cagr: number;
    sharpe: number;
    maxDrawdown: number;
    winRate: number;
    tradeCount: number;
  };
  rating: number;
  ratingCount: number;
  forkCount: number;
  publishedAt: string;
}

type SortBy = 'popular' | 'newest' | 'topRated' | 'bestPerforming';
type Category = 'all' | 'trend' | 'mean-reversion' | 'momentum' | 'breakout' | 'other';

const CATEGORIES: { value: Category; label: string; labelZh: string }[] = [
  { value: 'all', label: 'All', labelZh: '全部' },
  { value: 'trend', label: 'Trend', labelZh: '趋势' },
  { value: 'mean-reversion', label: 'Mean Reversion', labelZh: '均值回归' },
  { value: 'momentum', label: 'Momentum', labelZh: '动量' },
  { value: 'breakout', label: 'Breakout', labelZh: '突破' },
  { value: 'other', label: 'Other', labelZh: '其他' },
];

const SORT_OPTIONS: { value: SortBy; label: string; labelZh: string }[] = [
  { value: 'popular', label: 'Popular', labelZh: '最受欢迎' },
  { value: 'newest', label: 'Newest', labelZh: '最新发布' },
  { value: 'topRated', label: 'Top Rated', labelZh: '最高评分' },
  { value: 'bestPerforming', label: 'Best Performing', labelZh: '最佳表现' },
];

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMetric(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

export function MarketplacePage() {
  const { locale } = useLocale();
  const [strategies, setStrategies] = useState<MarketplaceStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [sortBy, setSortBy] = useState<SortBy>('popular');
  const [selectedStrategy, setSelectedStrategy] = useState<MarketplaceStrategy | null>(null);

  const fetchStrategies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (category !== 'all') params.set('category', category);
      params.set('sortBy', sortBy);

      const res = await fetch(`/api/marketplace/strategies?${params}`);
      const data = await res.json();

      if (data.ok) {
        setStrategies(data.strategies);
      }
    } catch (err) {
      console.error('Failed to fetch marketplace strategies:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, category, sortBy]);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const handleFork = async (marketplaceId: string) => {
    try {
      const res = await fetch(`/api/marketplace/strategies/${marketplaceId}/fork`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.ok) {
        alert(locale === 'zh' ? '策略已复制到你的工作区' : 'Strategy forked to your workspace');
      }
    } catch (err) {
      console.error('Failed to fork strategy:', err);
    }
  };

  const handleRate = async (marketplaceId: string, rating: number) => {
    try {
      const res = await fetch(`/api/marketplace/strategies/${marketplaceId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      const data = await res.json();

      if (data.ok) {
        fetchStrategies();
      }
    } catch (err) {
      console.error('Failed to rate strategy:', err);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            font: '700 24px/1.2 var(--font-ui)',
            color: 'var(--text)',
            marginBottom: '8px',
          }}
        >
          {locale === 'zh' ? '策略市场' : 'Strategy Marketplace'}
        </h1>
        <p
          style={{
            font: '400 14px/1.5 var(--font-ui)',
            color: 'var(--muted)',
          }}
        >
          {locale === 'zh'
            ? '浏览和复制社区分享的量化策略'
            : 'Browse and fork community-shared quantitative strategies'}
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder={locale === 'zh' ? '搜索策略...' : 'Search strategies...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            font: '400 13px/1 var(--font-ui)',
            outline: 'none',
          }}
        />

        {/* Category */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          style={{
            padding: '8px 12px',
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            font: '400 13px/1 var(--font-ui)',
            outline: 'none',
          }}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {locale === 'zh' ? cat.labelZh : cat.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          style={{
            padding: '8px 12px',
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            font: '400 13px/1 var(--font-ui)',
            outline: 'none',
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {locale === 'zh' ? opt.labelZh : opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Strategy Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          {locale === 'zh' ? '加载中...' : 'Loading...'}
        </div>
      ) : strategies.length === 0 ? (
        <EmptyState
          icon="📊"
          message={locale === 'zh' ? '暂无策略' : 'No strategies found'}
          detail={
            locale === 'zh'
              ? '还没有策略发布到市场。成为第一个分享策略的人！'
              : 'No strategies published yet. Be the first to share!'
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onClick={() => setSelectedStrategy(strategy)}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedStrategy(strategy)}
              role="button"
              tabIndex={0}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <h3
                    style={{
                      font: '600 16px/1.3 var(--font-ui)',
                      color: 'var(--text)',
                      marginBottom: '4px',
                    }}
                  >
                    {strategy.name}
                  </h3>
                  <div
                    style={{
                      font: '400 12px/1 var(--font-ui)',
                      color: 'var(--muted)',
                    }}
                  >
                    {locale === 'zh' ? '作者' : 'by'} {strategy.authorName}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    background: 'var(--accent-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    font: '600 12px/1 var(--font-data)',
                    color: 'var(--accent)',
                  }}
                >
                  ★ {strategy.rating.toFixed(1)}
                </div>
              </div>

              {/* Description */}
              <p
                style={{
                  font: '400 13px/1.5 var(--font-ui)',
                  color: 'var(--muted)',
                  marginBottom: '16px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {strategy.description || (locale === 'zh' ? '暂无描述' : 'No description')}
              </p>

              {/* Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ font: '600 14px/1 var(--font-data)', color: 'var(--buy)' }}>
                    {formatPercent(strategy.metrics.cagr)}
                  </div>
                  <div
                    style={{
                      font: '400 10px/1 var(--font-ui)',
                      color: 'var(--muted)',
                      marginTop: '2px',
                    }}
                  >
                    CAGR
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ font: '600 14px/1 var(--font-data)', color: 'var(--text)' }}>
                    {formatMetric(strategy.metrics.sharpe)}
                  </div>
                  <div
                    style={{
                      font: '400 10px/1 var(--font-ui)',
                      color: 'var(--muted)',
                      marginTop: '2px',
                    }}
                  >
                    Sharpe
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ font: '600 14px/1 var(--font-data)', color: 'var(--sell)' }}>
                    {formatPercent(strategy.metrics.maxDrawdown)}
                  </div>
                  <div
                    style={{
                      font: '400 10px/1 var(--font-ui)',
                      color: 'var(--muted)',
                      marginTop: '2px',
                    }}
                  >
                    Max DD
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {strategy.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '2px 8px',
                      background: 'var(--panel-2)',
                      borderRadius: 'var(--radius-sm)',
                      font: '400 11px/1 var(--font-ui)',
                      color: 'var(--muted)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--line)',
                }}
              >
                <div style={{ font: '400 12px/1 var(--font-ui)', color: 'var(--muted)' }}>
                  {strategy.forkCount} {locale === 'zh' ? '次复制' : 'forks'}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFork(strategy.id);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    color: '#fff',
                    font: '600 12px/1 var(--font-ui)',
                    cursor: 'pointer',
                  }}
                >
                  {locale === 'zh' ? '复制策略' : 'Fork'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Strategy Detail Modal */}
      {selectedStrategy && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(3, 4, 18, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setSelectedStrategy(null)}
          onKeyDown={(e) => e.key === 'Escape' && setSelectedStrategy(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="document"
          >
            <h2
              style={{
                font: '700 20px/1.2 var(--font-ui)',
                color: 'var(--text)',
                marginBottom: '8px',
              }}
            >
              {selectedStrategy.name}
            </h2>
            <p
              style={{
                font: '400 13px/1.5 var(--font-ui)',
                color: 'var(--muted)',
                marginBottom: '20px',
              }}
            >
              {selectedStrategy.description}
            </p>

            {/* Rating */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  font: '600 13px/1 var(--font-ui)',
                  color: 'var(--text)',
                  marginBottom: '8px',
                }}
              >
                {locale === 'zh' ? '评分' : 'Rating'}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRate(selectedStrategy.id, star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color:
                        star <= selectedStrategy.rating ? 'var(--accent-secondary)' : 'var(--line)',
                    }}
                  >
                    ★
                  </button>
                ))}
                <span
                  style={{
                    font: '400 12px/1 var(--font-ui)',
                    color: 'var(--muted)',
                    marginLeft: '8px',
                  }}
                >
                  ({selectedStrategy.ratingCount})
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  font: '600 13px/1 var(--font-ui)',
                  color: 'var(--text)',
                  marginBottom: '8px',
                }}
              >
                {locale === 'zh' ? '表现指标' : 'Performance Metrics'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <div style={{ font: '400 11px/1 var(--font-ui)', color: 'var(--muted)' }}>
                    CAGR
                  </div>
                  <div style={{ font: '600 16px/1 var(--font-data)', color: 'var(--buy)' }}>
                    {formatPercent(selectedStrategy.metrics.cagr)}
                  </div>
                </div>
                <div>
                  <div style={{ font: '400 11px/1 var(--font-ui)', color: 'var(--muted)' }}>
                    Sharpe Ratio
                  </div>
                  <div style={{ font: '600 16px/1 var(--font-data)', color: 'var(--text)' }}>
                    {formatMetric(selectedStrategy.metrics.sharpe)}
                  </div>
                </div>
                <div>
                  <div style={{ font: '400 11px/1 var(--font-ui)', color: 'var(--muted)' }}>
                    Max Drawdown
                  </div>
                  <div style={{ font: '600 16px/1 var(--font-data)', color: 'var(--sell)' }}>
                    {formatPercent(selectedStrategy.metrics.maxDrawdown)}
                  </div>
                </div>
                <div>
                  <div style={{ font: '400 11px/1 var(--font-ui)', color: 'var(--muted)' }}>
                    Win Rate
                  </div>
                  <div style={{ font: '600 16px/1 var(--font-data)', color: 'var(--text)' }}>
                    {formatPercent(selectedStrategy.metrics.winRate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedStrategy(null)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--muted)',
                  font: '600 13px/1 var(--font-ui)',
                  cursor: 'pointer',
                }}
              >
                {locale === 'zh' ? '关闭' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleFork(selectedStrategy.id);
                  setSelectedStrategy(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  color: '#fff',
                  font: '600 13px/1 var(--font-ui)',
                  cursor: 'pointer',
                }}
              >
                {locale === 'zh' ? '复制策略' : 'Fork Strategy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
