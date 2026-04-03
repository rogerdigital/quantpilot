import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useMarketProviderStatus } from '../../hooks/useMarketProviderStatus.ts';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { useSettingsNavigation } from '../../modules/console/console.hooks.ts';
import { copy, type ConsolePageKey, useLocale } from '../../modules/console/console.i18n.tsx';
import { getConsoleDocumentTitle, listSidebarRoutes } from '../../modules/console/console.routes.tsx';
import { connectionLabel, integrationTone, translateEngineStatus, translateMode, translateSignal } from '../../modules/console/console.utils.ts';

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

    // Background fill
    ctx.fillStyle = 'rgba(1, 3, 10, 0.65)';
    ctx.fillRect(0, 0, width, height);

    const pad = { l: 50, r: 22, t: 20, b: 32 };

    // Horizontal grid lines with dots at intersections
    for (let i = 0; i <= 4; i += 1) {
      const y = pad.t + (i / 4) * (height - pad.t - pad.b);
      const gradient = ctx.createLinearGradient(pad.l, y, width - pad.r, y);
      gradient.addColorStop(0, 'rgba(0, 180, 255, 0.12)');
      gradient.addColorStop(0.5, 'rgba(0, 180, 255, 0.06)');
      gradient.addColorStop(1, 'rgba(0, 180, 255, 0.02)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(width - pad.r, y);
      ctx.stroke();
    }

    // Vertical grid guides (subtle)
    for (let i = 0; i <= 6; i += 1) {
      const x = pad.l + (i / 6) * (width - pad.l - pad.r);
      ctx.strokeStyle = 'rgba(0, 180, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(x, pad.t);
      ctx.lineTo(x, height - pad.b);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    if (kind === 'equity') {
      const paper = state.accounts.paper.equitySeries;
      const live = state.accounts.live.equitySeries;
      if (!paper.length || !live.length) return;
      const values = [...paper, ...live].map((item) => item.value);
      const min = Math.min(...values) * 0.985;
      const max = Math.max(...values) * 1.015;
      const chartW = width - pad.l - pad.r;
      const chartH = height - pad.t - pad.b;
      const toX = (index: number, total: number) => pad.l + (index / Math.max(total - 1, 1)) * chartW;
      const toY = (value: number) => pad.t + (1 - (value - min) / Math.max(max - min, 1)) * chartH;

      ([
        [paper, '#00d4ff', 'rgba(0, 212, 255, 0.09)', copy[locale].labels.paper],
        [live, '#ffb700', 'rgba(255, 183, 0, 0.07)', copy[locale].labels.live],
      ] as const).forEach(([series, color, areaTopColor, label]) => {
        if (!series.length) return;

        // Area fill under the line
        const areaGrad = ctx.createLinearGradient(0, pad.t, 0, height - pad.b);
        areaGrad.addColorStop(0, areaTopColor);
        areaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        // Build path for area
        ctx.beginPath();
        ctx.moveTo(toX(0, series.length), height - pad.b);
        ctx.lineTo(toX(0, series.length), toY(series[0].value));
        for (let i = 1; i < series.length; i += 1) {
          const x0 = toX(i - 1, series.length);
          const x1 = toX(i, series.length);
          const y0 = toY(series[i - 1].value);
          const y1 = toY(series[i].value);
          const cpx = (x0 + x1) / 2;
          ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1);
        }
        ctx.lineTo(toX(series.length - 1, series.length), height - pad.b);
        ctx.closePath();
        ctx.fillStyle = areaGrad;
        ctx.fill();

        // Line stroke
        ctx.beginPath();
        ctx.moveTo(toX(0, series.length), toY(series[0].value));
        for (let i = 1; i < series.length; i += 1) {
          const x0 = toX(i - 1, series.length);
          const x1 = toX(i, series.length);
          const y0 = toY(series[i - 1].value);
          const y1 = toY(series[i].value);
          const cpx = (x0 + x1) / 2;
          ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // End-point dot
        const last = series.at(-1);
        if (!last) return;
        const ex = toX(series.length - 1, series.length);
        const ey = toY(last.value);
        ctx.beginPath();
        ctx.arc(ex, ey, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = color;
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(label, width - pad.r, ey - 12);
      });

      // Y-axis labels
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(100, 140, 195, 0.65)';
      ctx.font = '10px "JetBrains Mono", monospace';
      for (let i = 0; i <= 4; i += 1) {
        const y = pad.t + (i / 4) * (height - pad.t - pad.b);
        const val = max - (i / 4) * (max - min);
        ctx.fillText(`$${Math.round(val / 1000)}k`, pad.l - 6, y + 4);
      }
      return;
    }

    // Signal bar chart
    const counts = { BUY: 0, HOLD: 0, SELL: 0 };
    state.stockStates.forEach((stock) => {
      counts[stock.signal] += 1;
    });
    const items = [
      ['BUY', '#00e89d', 'rgba(0, 232, 157, 0.15)', 'rgba(0, 232, 157, 0.6)'],
      ['HOLD', '#ffb700', 'rgba(255, 183, 0, 0.12)', 'rgba(255, 183, 0, 0.5)'],
      ['SELL', '#ff3358', 'rgba(255, 51, 88, 0.12)', 'rgba(255, 51, 88, 0.5)'],
    ] as const;
    const maxVal = Math.max(...Object.values(counts), 1);
    const chartW = width - pad.l - pad.r;
    const chartH = height - pad.t - pad.b;
    const barW = (chartW / items.length) * 0.52;

    items.forEach(([label, color, bgColor, glowColor], index) => {
      const x = pad.l + (chartW / items.length) * index + (chartW / items.length - barW) / 2;
      const h = chartH * (counts[label] / maxVal);
      const y = height - pad.b - h;

      // Bar background track
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(x, pad.t, barW, chartH);

      // Bar gradient fill
      const barGrad = ctx.createLinearGradient(0, y, 0, height - pad.b);
      barGrad.addColorStop(0, color);
      barGrad.addColorStop(1, bgColor);
      ctx.fillStyle = barGrad;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 16;
      ctx.fillRect(x, y, barW, h);
      ctx.shadowBlur = 0;

      // Top cap glow line
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barW, 2);

      // Count label above bar
      ctx.fillStyle = color;
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(counts[label]), x + barW / 2, y - 10);

      // Signal label below
      ctx.fillStyle = 'rgba(100, 140, 195, 0.72)';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillText(translateSignal(locale, label), x + barW / 2, height - 10);
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
  const routes = listSidebarRoutes();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" />
        <div>
          <div className="brand-name">{copy[locale].product}</div>
          <div className="brand-sub">{copy[locale].tagline}</div>
        </div>
      </div>

      <div className="sidebar-block">
        <div className="sidebar-label">{copy[locale].labels.tacticalRoutes}</div>
        <nav className="nav-stack">
          {routes.map((route) => (
            <NavLink key={route.path} to={route.path} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {copy[locale].nav[route.id]}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function GlobalToolbar() {
  const { locale, setLocale } = useLocale();
  const { state } = useTradingSystem();
  const { status: marketStatus } = useMarketProviderStatus(state.controlPlane.lastSyncAt);
  const goToSettings = useSettingsNavigation();
  const [localeOpen, setLocaleOpen] = useState(false);
  const localeMenuRef = useRef<HTMLDivElement | null>(null);
  const localeLabel = locale === 'zh' ? '中文' : 'English';
  const marketConnected = marketStatus?.connected ?? state.integrationStatus.marketData.connected;
  const marketDegraded = marketStatus?.fallback ?? !marketConnected;

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
        <div className="toolbar-kicker">{copy[locale].labels.commandDeck}</div>
        <div className="toolbar-title">{copy[locale].product}</div>
        <div className="toolbar-sub">{`${translateEngineStatus(locale, state.engineStatus)} · ${translateMode(locale, state.mode)} · ${state.marketClock || '--:--:--'}`}</div>
      </div>
      <div className="toolbar-actions">
        <button type="button" className={`toolbar-pill toolbar-pill-button tone-${integrationTone(marketConnected, marketDegraded)}`} onClick={() => goToSettings('integrations')}>
          <span className="toolbar-pill-main">
            <span className="status-dot" aria-hidden="true" />
            <span className="toolbar-pill-label">{copy[locale].labels.marketData}</span>
          </span>
          <strong>{connectionLabel(locale, marketConnected, marketDegraded)}</strong>
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
    document.title = getConsoleDocumentTitle(locale, location.pathname);
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
