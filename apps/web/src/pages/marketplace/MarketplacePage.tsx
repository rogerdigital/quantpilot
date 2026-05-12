import { Button } from '@quantpilot/ui';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '../../components/layout/ConsoleChrome.tsx';
import { useLocale } from '../../modules/console/console.i18n.tsx';
import * as s from './MarketplacePage.css.js';

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
    <div className={s.pageLayout}>
      {/* Header */}
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>{locale === 'zh' ? '策略市场' : 'Strategy Marketplace'}</h1>
        <p className={s.pageSubtitle}>
          {locale === 'zh'
            ? '浏览和复制社区分享的量化策略'
            : 'Browse and fork community-shared quantitative strategies'}
        </p>
      </div>

      {/* Filters */}
      <div className={s.filterRow}>
        <input
          type="text"
          placeholder={locale === 'zh' ? '搜索策略...' : 'Search strategies...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={s.searchInput}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className={s.selectInput}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {locale === 'zh' ? cat.labelZh : cat.label}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className={s.selectInput}
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
        <div className={s.loadingState}>{locale === 'zh' ? '加载中...' : 'Loading...'}</div>
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
        <div className={s.strategyGrid}>
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              className={s.strategyCard}
              onClick={() => setSelectedStrategy(strategy)}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedStrategy(strategy)}
              role="button"
              tabIndex={0}
            >
              <div className={s.cardHeader}>
                <div>
                  <h3 className={s.cardTitle}>{strategy.name}</h3>
                  <div className={s.cardAuthor}>
                    {locale === 'zh' ? '作者' : 'by'} {strategy.authorName}
                  </div>
                </div>
                <div className={s.ratingBadge}>★ {strategy.rating.toFixed(1)}</div>
              </div>

              <p className={s.cardDescription}>
                {strategy.description || (locale === 'zh' ? '暂无描述' : 'No description')}
              </p>

              <div className={s.cardMetrics}>
                <div>
                  <div className={s.cardMetricValue} style={{ color: 'var(--buy)' }}>
                    {formatPercent(strategy.metrics.cagr)}
                  </div>
                  <div className={s.cardMetricLabel}>CAGR</div>
                </div>
                <div>
                  <div className={s.cardMetricValue} style={{ color: 'var(--text)' }}>
                    {formatMetric(strategy.metrics.sharpe)}
                  </div>
                  <div className={s.cardMetricLabel}>Sharpe</div>
                </div>
                <div>
                  <div className={s.cardMetricValue} style={{ color: 'var(--sell)' }}>
                    {formatPercent(strategy.metrics.maxDrawdown)}
                  </div>
                  <div className={s.cardMetricLabel}>Max DD</div>
                </div>
              </div>

              <div className={s.tagList}>
                {strategy.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className={s.tag}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className={s.cardFooter}>
                <div className={s.cardFooterMeta}>
                  {strategy.forkCount} {locale === 'zh' ? '次复制' : 'forks'}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFork(strategy.id);
                  }}
                >
                  {locale === 'zh' ? '复制策略' : 'Fork'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Strategy Detail Modal */}
      {selectedStrategy && (
        <div
          className={s.modalOverlay}
          onClick={() => setSelectedStrategy(null)}
          onKeyDown={(e) => e.key === 'Escape' && setSelectedStrategy(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={s.modalPanel}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="document"
          >
            <h2 className={s.modalTitle}>{selectedStrategy.name}</h2>
            <p className={s.modalDescription}>{selectedStrategy.description}</p>

            {/* Rating */}
            <div className={s.modalSection}>
              <div className={s.modalSectionTitle}>{locale === 'zh' ? '评分' : 'Rating'}</div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRate(selectedStrategy.id, star)}
                    className={s.starBtn}
                    style={{
                      color: star <= selectedStrategy.rating ? 'var(--accent)' : 'var(--line)',
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
            <div className={s.modalSection}>
              <div className={s.modalSectionTitle}>
                {locale === 'zh' ? '表现指标' : 'Performance Metrics'}
              </div>
              <div className={s.modalMetricsGrid}>
                <div>
                  <div className={s.modalMetricLabel}>CAGR</div>
                  <div className={s.modalMetricValue} style={{ color: 'var(--buy)' }}>
                    {formatPercent(selectedStrategy.metrics.cagr)}
                  </div>
                </div>
                <div>
                  <div className={s.modalMetricLabel}>Sharpe Ratio</div>
                  <div className={s.modalMetricValue} style={{ color: 'var(--text)' }}>
                    {formatMetric(selectedStrategy.metrics.sharpe)}
                  </div>
                </div>
                <div>
                  <div className={s.modalMetricLabel}>Max Drawdown</div>
                  <div className={s.modalMetricValue} style={{ color: 'var(--sell)' }}>
                    {formatPercent(selectedStrategy.metrics.maxDrawdown)}
                  </div>
                </div>
                <div>
                  <div className={s.modalMetricLabel}>Win Rate</div>
                  <div className={s.modalMetricValue} style={{ color: 'var(--text)' }}>
                    {formatPercent(selectedStrategy.metrics.winRate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={s.modalActions}>
              <Button variant="secondary" size="md" onClick={() => setSelectedStrategy(null)}>
                {locale === 'zh' ? '关闭' : 'Close'}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  handleFork(selectedStrategy.id);
                  setSelectedStrategy(null);
                }}
              >
                {locale === 'zh' ? '复制策略' : 'Fork Strategy'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
