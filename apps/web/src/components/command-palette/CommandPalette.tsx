import type { AppLocale } from '@shared-types/trading.ts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { copy as i18n } from '../../modules/console/console.i18n.tsx';
import { listConsoleRoutes } from '../../modules/console/console.routes.tsx';
import {
  emptyState,
  footer,
  footerHint,
  footerKbd,
  input,
  inputIcon,
  inputWrap,
  kbdHint,
  overlay,
  panel,
  recentBadge,
  resultEnter,
  resultHint,
  resultIcon,
  resultItem,
  resultItemActive,
  resultName,
  results,
  resultText,
  sectionLabel,
} from './CommandPalette.css.ts';

/* ── Types ────────────────────────────────────────────── */

type CommandItem = {
  id: string;
  label: string;
  hint: string;
  icon: string;
  category: 'page' | 'action' | 'symbol';
  path?: string;
  action?: () => void;
};

/* ── Recent history ──────────────────────────────────── */

const RECENT_KEY = 'qp-cmd-recent';
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(id: string) {
  const recent = loadRecent().filter((r) => r !== id);
  recent.unshift(id);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

/* ── Icon map ─────────────────────────────────────────── */

const ICONS: Record<string, string> = {
  dashboard: 'DB',
  market: 'MK',
  trading: 'TR',
  strategies: 'ST',
  backtest: 'BT',
  risk: 'RK',
  execution: 'EX',
  agent: 'AI',
  notifications: 'NT',
  settings: 'CF',
};

const HINTS_ZH: Record<string, string> = {
  dashboard: '总览你的资产、信号与待审批',
  market: '查看实时行情与技术面',
  trading: '交易终端与 OHLCV 图表',
  strategies: '策略评分与买卖信号',
  backtest: '运行历史回测',
  risk: '风控参数与事件日志',
  execution: '实盘委托与执行日志',
  agent: 'AI Agent 分析与对话',
  notifications: '系统通知与事件流',
  settings: '平台配置与权限管理',
};

const HINTS_EN: Record<string, string> = {
  dashboard: 'NAV, signals and pending approvals at a glance',
  market: 'Live quotes and technicals',
  trading: 'Trading terminal with OHLCV charts',
  strategies: 'Strategy scores and buy/sell signals',
  backtest: 'Run historical backtests',
  risk: 'Risk parameters and event log',
  execution: 'Live orders and execution log',
  agent: 'AI agent analysis and conversation',
  notifications: 'System notifications and event stream',
  settings: 'Platform config and permissions',
};

/* ── Scoring ──────────────────────────────────────────── */

function fuzzyMatch(text: string, query: string): number {
  const t = text.toLowerCase();
  const q = query.toLowerCase();

  // Exact prefix match
  if (t.startsWith(q)) return 4;
  // Word boundary match (e.g., "bk" matches "Backtest")
  const words = t.split(/[\s-/]+/);
  if (words.some((w) => w.startsWith(q))) return 3;
  // Contains match
  if (t.includes(q)) return 2;
  // Fuzzy: all query chars appear in order
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  if (qi === q.length) return 1;
  return 0;
}

function score(label: string, hint: string, query: string): number {
  const labelScore = fuzzyMatch(label, query);
  if (labelScore > 0) return labelScore + 2; // Prefer label matches
  return fuzzyMatch(hint, query);
}

/* ── Component ────────────────────────────────────────── */

type Props = {
  locale: AppLocale;
  onClose: () => void;
};

export function CommandPalette({ locale, onClose }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const navCopy = i18n[locale].nav as Record<string, string>;
  const hints = locale === 'zh' ? HINTS_ZH : HINTS_EN;

  const allItems: CommandItem[] = listConsoleRoutes()
    .filter((r) => r.includeInSidebar !== false || r.id !== 'strategy-detail')
    .map((r) => ({
      id: r.id,
      label: navCopy[r.id] ?? r.id,
      hint: hints[r.id] ?? '',
      icon: ICONS[r.id] ?? r.id.slice(0, 2).toUpperCase(),
      category: 'page' as const,
      path: r.path,
    }));

  const recentIds = loadRecent();
  const recentItems = recentIds
    .map((id) => allItems.find((item) => item.id === id))
    .filter(Boolean) as CommandItem[];

  const filtered = query.trim()
    ? allItems
        .map((item) => ({ item, s: score(item.label, item.hint, query) }))
        .filter(({ s }) => s > 0)
        .sort((a, b) => b.s - a.s)
        .map(({ item }) => item)
    : recentItems.length > 0
      ? [...recentItems, ...allItems.filter((item) => !recentIds.includes(item.id))]
      : allItems;

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commit = useCallback(
    (item: CommandItem) => {
      saveRecent(item.id);
      if (item.path) navigate(item.path);
      if (item.action) item.action();
      onClose();
    },
    [navigate, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const item = filtered[activeIdx];
      if (item) commit(item);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const placeholder = locale === 'zh' ? '搜索页面或功能…' : 'Search pages or actions…';

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: overlay backdrop closes palette on click
    <div
      className={overlay}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className={panel} role="dialog" aria-label="Command palette" onKeyDown={handleKeyDown}>
        {/* Search input */}
        <div className={inputWrap}>
          <span className={inputIcon}>⌘</span>
          <input
            ref={inputRef}
            className={input}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className={kbdHint}>ESC</span>
        </div>

        {/* Results */}
        <div className={results} role="listbox">
          {filtered.length > 0 ? (
            <>
              {!query.trim() && recentItems.length > 0 && (
                <>
                  <div className={sectionLabel}>{locale === 'zh' ? '最近访问' : 'Recent'}</div>
                  {recentItems.map((item, idx) => (
                    <button
                      key={`recent-${item.id}`}
                      type="button"
                      className={`${resultItem}${idx === activeIdx ? ` ${resultItemActive}` : ''}`}
                      role="option"
                      aria-selected={idx === activeIdx}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onMouseDown={() => commit(item)}
                    >
                      <div className={resultIcon}>{item.icon}</div>
                      <div className={resultText}>
                        <div className={resultName}>{item.label}</div>
                        <div className={resultHint}>{item.hint}</div>
                      </div>
                      <span className={recentBadge}>{locale === 'zh' ? '最近' : 'recent'}</span>
                      {idx === activeIdx && <span className={resultEnter}>↵</span>}
                    </button>
                  ))}
                  <div className={sectionLabel}>{locale === 'zh' ? '全部页面' : 'All Pages'}</div>
                </>
              )}
              {(query.trim() ? filtered : filtered.slice(recentItems.length)).map((item, idx) => {
                const adjustedIdx = query.trim() ? idx : idx + recentItems.length;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${resultItem}${adjustedIdx === activeIdx ? ` ${resultItemActive}` : ''}`}
                    role="option"
                    aria-selected={adjustedIdx === activeIdx}
                    onMouseEnter={() => setActiveIdx(adjustedIdx)}
                    onMouseDown={() => commit(item)}
                  >
                    <div className={resultIcon}>{item.icon}</div>
                    <div className={resultText}>
                      <div className={resultName}>{item.label}</div>
                      <div className={resultHint}>{item.hint}</div>
                    </div>
                    {adjustedIdx === activeIdx && <span className={resultEnter}>↵</span>}
                  </button>
                );
              })}
            </>
          ) : (
            <div className={emptyState}>
              {locale === 'zh' ? `没有找到"${query}"相关结果` : `No results for "${query}"`}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className={footer}>
          <span className={footerHint}>
            <span className={footerKbd}>↑↓</span>
            {locale === 'zh' ? '选择' : 'navigate'}
          </span>
          <span className={footerHint}>
            <span className={footerKbd}>↵</span>
            {locale === 'zh' ? '跳转' : 'go'}
          </span>
          <span className={footerHint}>
            <span className={footerKbd}>ESC</span>
            {locale === 'zh' ? '关闭' : 'close'}
          </span>
        </div>
      </div>
    </div>
  );
}
