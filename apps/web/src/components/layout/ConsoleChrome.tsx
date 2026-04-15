import { type ReactNode, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ApprovalDrawer } from '../approval-drawer/ApprovalDrawer.tsx';
import { CommandPalette } from '../command-palette/CommandPalette.tsx';
import { useMarketProviderStatus } from '../../hooks/useMarketProviderStatus.ts';
import { useSettingsNavigation } from '../../modules/console/console.hooks.ts';
import { type ConsolePageKey, copy, useLocale } from '../../modules/console/console.i18n.tsx';
import {
  getConsoleDocumentTitle,
  listSidebarRoutes,
} from '../../modules/console/console.routes.tsx';
import {
  connectionLabel,
  integrationTone,
  translateEngineStatus,
  translateMode,
} from '../../modules/console/console.utils.ts';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { EquityChart } from '../charts/EquityChart.tsx';
import { SignalBarChart } from '../charts/SignalBarChart.tsx';
import {
  appShell,
  appShellCollapsed,
  brand,
  brandMark,
  brandName,
  brandSub,
  globalToolbar,
  mainPanel,
  metaCard,
  metaLabel,
  metaValue,
  metaValueAccent,
  navStack,
  sidebar,
  sidebarBlock,
  sidebarCollapsed,
  sidebarLabel,
  sidebarToggle,
  toolbarActions,
  toolbarCopy,
  toolbarKicker,
  toolbarSub,
  toolbarTitle,
  topbarMeta,
} from './ConsoleChrome.css.ts';

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
  const { state } = useTradingSystem();

  if (kind === 'equity') {
    return (
      <EquityChart
        paper={state.accounts.paper.equitySeries}
        live={state.accounts.live.equitySeries}
      />
    );
  }

  const counts = { BUY: 0, HOLD: 0, SELL: 0 };
  state.stockStates.forEach((s) => {
    counts[s.signal] += 1;
  });

  return <SignalBarChart buy={counts.BUY} hold={counts.HOLD} sell={counts.SELL} />;
}

export function TopMeta({ items }: { items: TopMetaItem[] }) {
  return (
    <div className={topbarMeta}>
      {items.map((item) => (
        <div className={metaCard} key={item.label}>
          <div className={metaLabel}>{item.label}</div>
          <div className={`${metaValue}${item.accent ? ` ${metaValueAccent}` : ''}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { locale } = useLocale();
  const routes = listSidebarRoutes();

  return (
    <aside
      className={`${sidebar}${collapsed ? ` ${sidebarCollapsed}` : ''}`}
      style={{ position: 'relative' }}
    >
      <button
        type="button"
        className={sidebarToggle}
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '›' : '‹'}
      </button>

      {!collapsed && (
        <div className={brand}>
          <div className={brandMark} />
          <div>
            <div className={brandName}>{copy[locale].product}</div>
            <div className={brandSub}>{copy[locale].tagline}</div>
          </div>
        </div>
      )}

      {collapsed && (
        <div
          style={{
            marginBottom: '24px',
            paddingBottom: '18px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div className={brandMark} />
        </div>
      )}

      <div className={sidebarBlock} style={collapsed ? { padding: '10px 6px' } : undefined}>
        {!collapsed && <div className={sidebarLabel}>{copy[locale].labels.tacticalRoutes}</div>}
        <nav className={navStack}>
          {routes.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                `nav-link${isActive ? ' active' : ''}${collapsed ? ' nav-link-icon-only' : ''}`
              }
              title={collapsed ? copy[locale].nav[route.id] : undefined}
              style={
                collapsed
                  ? {
                      padding: '10px',
                      textAlign: 'center',
                      fontSize: '10px',
                      letterSpacing: '0.05em',
                    }
                  : undefined
              }
            >
              {collapsed ? copy[locale].nav[route.id].slice(0, 2) : copy[locale].nav[route.id]}
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
    <div className={globalToolbar}>
      <div className={toolbarCopy}>
        <div className={toolbarKicker}>{copy[locale].labels.commandDeck}</div>
        <div className={toolbarTitle}>{copy[locale].product}</div>
        <div
          className={toolbarSub}
        >{`${translateEngineStatus(locale, state.engineStatus)} · ${translateMode(locale, state.mode)} · ${state.marketClock || '--:--:--'}`}</div>
      </div>
      <div className={toolbarActions}>
        <button
          type="button"
          className={`toolbar-pill toolbar-pill-button tone-${integrationTone(marketConnected, marketDegraded)}`}
          onClick={() => goToSettings('integrations')}
        >
          <span className="toolbar-pill-main">
            <span className="status-dot" aria-hidden="true" />
            <span className="toolbar-pill-label">{copy[locale].labels.marketData}</span>
          </span>
          <strong>{connectionLabel(locale, marketConnected, marketDegraded)}</strong>
        </button>
        <button
          type="button"
          className={`toolbar-pill toolbar-pill-button tone-${integrationTone(state.integrationStatus.broker.connected, false, true)}`}
          onClick={() => goToSettings('integrations')}
        >
          <span className="toolbar-pill-main">
            <span className="status-dot" aria-hidden="true" />
            <span className="toolbar-pill-label">{copy[locale].labels.broker}</span>
          </span>
          <strong>
            {connectionLabel(locale, state.integrationStatus.broker.connected, false, true)}
          </strong>
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

export type TabPanelTab = {
  key: string;
  label: string;
  content: ReactNode;
};

export type TabPanelProps = {
  tabs: TabPanelTab[];
  defaultTab?: string;
};

export function TabPanel({ tabs, defaultTab }: TabPanelProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key ?? '');
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  return (
    <div className="tab-panel">
      <div className="tab-panel-bar" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === active}
            className={`tab-panel-tab${t.key === active ? ' active' : ''}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="tab-panel-content" role="tabpanel">
        {current?.content ?? null}
      </div>
    </div>
  );
}

export type EmptyStateProps = {
  icon?: string;
  message: string;
  detail?: string;
};

export function EmptyState({ icon, message, detail }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon ? <span className="empty-state-icon">{icon}</span> : null}
      <span className="empty-state-message">{message}</span>
      {detail ? <span className="empty-state-detail">{detail}</span> : null}
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const { locale } = useLocale();
  const { state, approveLiveIntent, rejectLiveIntent } = useTradingSystem();
  const [collapsed, setCollapsed] = useState(() => {
    return window.localStorage.getItem('quantpilot-sidebar-collapsed') === 'true';
  });
  const [cmdOpen, setCmdOpen] = useState(false);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem('quantpilot-sidebar-collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    document.title = getConsoleDocumentTitle(locale, location.pathname);
  }, [locale, location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`${appShell}${collapsed ? ` ${appShellCollapsed}` : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <main className={mainPanel}>
        <GlobalToolbar />
        <Outlet />
      </main>
      {cmdOpen && <CommandPalette locale={locale} onClose={() => setCmdOpen(false)} />}
      <ApprovalDrawer
        locale={locale}
        queue={state.approvalQueue}
        onApprove={approveLiveIntent}
        onReject={rejectLiveIntent}
      />
    </div>
  );
}
