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
  resultEnter,
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
  path?: string;
  action?: () => void;
};

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

function score(label: string, hint: string, query: string): number {
  const q = query.toLowerCase();
  const l = label.toLowerCase();
  const h = hint.toLowerCase();
  if (l.startsWith(q)) return 3;
  if (l.includes(q)) return 2;
  if (h.includes(q)) return 1;
  return 0;
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
      path: r.path,
    }));

  const filtered = query.trim()
    ? allItems
        .map((item) => ({ item, s: score(item.label, item.hint, query) }))
        .filter(({ s }) => s > 0)
        .sort((a, b) => b.s - a.s)
        .map(({ item }) => item)
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
              <div className={sectionLabel}>{locale === 'zh' ? '页面' : 'Pages'}</div>
              {filtered.map((item, idx) => (
                <button
                  key={item.id}
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
                  </div>
                  {idx === activeIdx && <span className={resultEnter}>↵</span>}
                </button>
              ))}
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
