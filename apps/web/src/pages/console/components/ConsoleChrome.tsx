import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';
import { useSettingsNavigation } from '../hooks.ts';
import { copy, type ConsolePageKey, useLocale } from '../i18n.tsx';
import { connectionLabel, integrationTone, translateEngineStatus, translateMode, translateSignal } from '../utils.ts';

export type TopMetaItem = {
  label: string;
  value: string;
  accent?: boolean;
};

export function SectionHeader({ routeKey }: { routeKey: ConsolePageKey }) {
  const { locale } = useLocale();
  const [title, desc] = copy[locale].pages[routeKey];
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">{copy[locale].desk[routeKey]}</div>
        <h1>{title}</h1>
        <p className="topbar-copy">{desc}</p>
      </div>
    </header>
  );
}

export function ChartCanvas({ kind }: { kind: 'equity' | 'signal' }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { state } = useTradingSystem();
  const { locale } = useLocale();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max((canvas.parentElement?.clientWidth || 600) - 8, 280);
    const height = 280;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const pad = { l: 46, r: 18, t: 18, b: 28 };
    ctx.strokeStyle = 'rgba(116, 161, 255, 0.08)';
    for (let i = 0; i <= 4; i += 1) {
      const y = pad.t + i / 4 * (height - pad.t - pad.b);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(width - pad.r, y);
      ctx.stroke();
    }

    if (kind === 'equity') {
      const paper = state.accounts.paper.equitySeries;
      const live = state.accounts.live.equitySeries;
      if (!paper.length || !live.length) return;
      const values = [...paper, ...live].map((item) => item.value);
      const min = Math.min(...values) * 0.985;
      const max = Math.max(...values) * 1.015;
      const chartW = width - pad.l - pad.r;
      const chartH = height - pad.t - pad.b;
      const toX = (index: number, total: number) => pad.l + index / Math.max(total - 1, 1) * chartW;
      const toY = (value: number) => pad.t + (1 - (value - min) / Math.max(max - min, 1)) * chartH;

      ([
        [paper, '#41f0c2', copy[locale].labels.paper],
        [live, '#5f8dff', copy[locale].labels.live],
      ] as const).forEach(([series, color, label]) => {
        ctx.beginPath();
        ctx.moveTo(toX(0, series.length), toY(series[0].value));
        for (let i = 1; i < series.length; i += 1) ctx.lineTo(toX(i, series.length), toY(series[i].value));
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        const last = series.at(-1);
        if (!last) return;
        ctx.fillStyle = color;
        ctx.font = '11px "Space Grotesk", sans-serif';
        ctx.fillText(label, width - pad.r - 70, toY(last.value) - 10);
      });
      return;
    }

    const counts = { BUY: 0, HOLD: 0, SELL: 0 };
    state.stockStates.forEach((stock) => {
      counts[stock.signal] += 1;
    });
    const items = [
      ['BUY', '#59f28f'],
      ['HOLD', '#f2c45c'],
      ['SELL', '#ff6b7c'],
    ] as const;
    const max = Math.max(...Object.values(counts), 1);
    const chartW = width - pad.l - pad.r;
    const chartH = height - pad.t - pad.b;
    const barW = chartW / items.length * 0.55;
    items.forEach(([label, color], index) => {
      const x = pad.l + chartW / items.length * index + (chartW / items.length - barW) / 2;
      const h = chartH * (counts[label] / max);
      const y = height - pad.b - h;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barW, h);
      ctx.fillStyle = 'rgba(208,226,255,0.72)';
      ctx.font = '11px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(translateSignal(locale, label), x + barW / 2, height - 10);
      ctx.fillText(String(counts[label]), x + barW / 2, y - 8);
    });
  }, [kind, locale, state]);

  return <canvas ref={canvasRef} height="280" />;
}

export function TopMeta({ items }: { items: TopMetaItem[] }) {
  return (
    <div className="topbar-meta">
      {items.map((item) => (
        <div className="meta-card" key={item.label}>
          <div className="meta-label">{item.label}</div>
          <div className={`meta-value${item.accent ? ' accent' : ''}`}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function Sidebar() {
  const { locale } = useLocale();
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" />
        <div>
          <div className="brand-name">{copy[locale].product}</div>
          <div className="brand-sub">{copy[locale].tagline}</div>
        </div>
      </div>

      <nav className="nav-stack">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{copy[locale].nav.dashboard}</NavLink>
        <NavLink to="/market" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{copy[locale].nav.market}</NavLink>
        <NavLink to="/strategies" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{copy[locale].nav.strategies}</NavLink>
        <NavLink to="/backtest" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{copy[locale].nav.backtest}</NavLink>
        <NavLink to="/risk" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{copy[locale].nav.risk}</NavLink>
        <NavLink to="/execution" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{copy[locale].nav.execution}</NavLink>
        <NavLink to="/agent" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{copy[locale].nav.agent}</NavLink>
        <NavLink to="/notifications" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{copy[locale].nav.notifications}</NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{copy[locale].nav.settings}</NavLink>
      </nav>
    </aside>
  );
}

function GlobalToolbar() {
  const { locale, setLocale } = useLocale();
  const { state } = useTradingSystem();
  const goToSettings = useSettingsNavigation();
  const [localeOpen, setLocaleOpen] = useState(false);
  const localeMenuRef = useRef<HTMLDivElement | null>(null);
  const localeLabel = locale === 'zh' ? '中文' : 'English';

  useEffect(() => {
    if (!localeOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!localeMenuRef.current?.contains(event.target as Node)) setLocaleOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLocaleOpen(false);
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [localeOpen]);

  return (
    <div className="global-toolbar">
      <div className="toolbar-copy">
        <div className="toolbar-title">{copy[locale].product}</div>
        <div className="toolbar-sub">{`${translateEngineStatus(locale, state.engineStatus)} · ${translateMode(locale, state.mode)} · ${state.marketClock || '--:--:--'}`}</div>
      </div>
      <div className="toolbar-actions">
        <button type="button" className={`toolbar-pill toolbar-pill-button tone-${integrationTone(state.integrationStatus.marketData.connected, true)}`} onClick={() => goToSettings('integrations')}>
          <span className="toolbar-pill-main">
            <span className="status-dot" aria-hidden="true" />
            <span className="toolbar-pill-label">{copy[locale].labels.marketData}</span>
          </span>
          <strong>{connectionLabel(locale, state.integrationStatus.marketData.connected, true)}</strong>
        </button>
        <button type="button" className={`toolbar-pill toolbar-pill-button tone-${integrationTone(state.integrationStatus.broker.connected, false, true)}`} onClick={() => goToSettings('integrations')}>
          <span className="toolbar-pill-main">
            <span className="status-dot" aria-hidden="true" />
            <span className="toolbar-pill-label">{copy[locale].labels.broker}</span>
          </span>
          <strong>{connectionLabel(locale, state.integrationStatus.broker.connected, false, true)}</strong>
        </button>
        <div className="locale-switch-wrap" ref={localeMenuRef}>
          <button
            type="button"
            className="locale-trigger"
            aria-haspopup="menu"
            aria-expanded={localeOpen}
            onClick={() => setLocaleOpen((current) => !current)}
          >
            <span>{copy[locale].labels.language}</span>
            <strong>{localeLabel}</strong>
            <span className={`locale-caret${localeOpen ? ' open' : ''}`}>▾</span>
          </button>
          {localeOpen ? (
            <div className="locale-menu" role="menu" aria-label={copy[locale].labels.language}>
              <button
                type="button"
                className={`locale-option${locale === 'zh' ? ' active' : ''}`}
                onClick={() => {
                  setLocale('zh');
                  setLocaleOpen(false);
                }}
              >
                <span>中文</span>
                {locale === 'zh' ? <small className="locale-check">✓</small> : null}
              </button>
              <button
                type="button"
                className={`locale-option${locale === 'en' ? ' active' : ''}`}
                onClick={() => {
                  setLocale('en');
                  setLocaleOpen(false);
                }}
              >
                <span>English</span>
                {locale === 'en' ? <small className="locale-check">✓</small> : null}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const { locale } = useLocale();

  useEffect(() => {
    const titleMap = {
      '/dashboard': `${copy[locale].nav.dashboard} | quantpilot`,
      '/market': `${copy[locale].nav.market} | quantpilot`,
      '/strategies': `${copy[locale].nav.strategies} | quantpilot`,
      '/backtest': `${copy[locale].nav.backtest} | quantpilot`,
      '/risk': `${copy[locale].nav.risk} | quantpilot`,
      '/execution': `${copy[locale].nav.execution} | quantpilot`,
      '/agent': `${copy[locale].nav.agent} | quantpilot`,
      '/notifications': `${copy[locale].nav.notifications} | quantpilot`,
      '/settings': `${copy[locale].nav.settings} | quantpilot`,
    };
    document.title = titleMap[location.pathname as keyof typeof titleMap] || 'quantpilot';
  }, [locale, location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <GlobalToolbar />
        <Outlet />
      </main>
    </div>
  );
}
