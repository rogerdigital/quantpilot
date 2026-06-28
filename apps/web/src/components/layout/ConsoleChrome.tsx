import { type ReactNode, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useThemeContext } from '../../hooks/ThemeProvider.tsx';
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
import { ApprovalDrawer } from '../approval-drawer/ApprovalDrawer.tsx';
import { EquityChart } from '../charts/EquityChart.tsx';
import { SignalBarChart } from '../charts/SignalBarChart.tsx';
import { CommandPalette } from '../command-palette/CommandPalette.tsx';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from '../common/AppIcons.tsx';
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
import { MobileBottomNav } from './MobileBottomNav.tsx';
import { NavIcon } from './NavIcons.tsx';
import { ShortcutHelp } from './ShortcutHelp.tsx';

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
        <div className="eyebrow">
          {(copy[locale].desk as Record<string, string>)[routeKey] ?? ''}
        </div>
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
    <aside className={`${sidebar}${collapsed ? ` ${sidebarCollapsed}` : ''}`}>
      {!collapsed && (
        <div className={brand}>
          <div className={brandMark}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <div>
            <div className={brandName}>{copy[locale].product}</div>
            <div className={brandSub}>{copy[locale].tagline}</div>
          </div>
          <button
            type="button"
            className={sidebarToggle}
            onClick={onToggle}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeftIcon className="sidebar-toggle-icon" />
          </button>
        </div>
      )}

      {collapsed && (
        <div
          style={{
            padding: '10px 0',
            marginBottom: '12px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            className={sidebarToggle}
            onClick={onToggle}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronRightIcon className="sidebar-toggle-icon" />
          </button>
        </div>
      )}

      <div className={sidebarBlock} style={collapsed ? { padding: '4px 2px' } : undefined}>
        <nav className={navStack}>
          {routes.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                `nav-link${isActive ? ' active' : ''}${collapsed ? ' nav-link-icon-only' : ''}`
              }
              style={
                collapsed
                  ? {
                      padding: '8px',
                      display: 'flex',
                      justifyContent: 'center',
                    }
                  : undefined
              }
            >
              <NavIcon id={route.id} />
              {!collapsed && (
                <span style={{ marginLeft: '10px' }}>{copy[locale].nav[route.id]}</span>
              )}
              {collapsed && <span className="nav-tooltip">{copy[locale].nav[route.id]}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

const SunIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const MonitorIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);

function GlobalToolbar({ onCommandOpen }: { onCommandOpen: () => void }) {
  const { locale, setLocale } = useLocale();
  const { state } = useTradingSystem();
  const { status: marketStatus } = useMarketProviderStatus(state.controlPlane.lastSyncAt);
  const goToSettings = useSettingsNavigation();
  const { mode, setTheme, resolved } = useThemeContext();
  const [localeOpen, setLocaleOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const localeMenuRef = useRef<HTMLDivElement | null>(null);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!themeOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!themeMenuRef.current?.contains(event.target as Node)) setThemeOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setThemeOpen(false);
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [themeOpen]);

  return (
    <div className={globalToolbar}>
      <div className={toolbarCopy}>
        <div className={toolbarTitle}>{copy[locale].product}</div>
        <div
          className={toolbarSub}
        >{`${translateEngineStatus(locale, state.engineStatus)} · ${translateMode(locale, state.mode)} · ${state.marketClock || '--:--:--'}`}</div>
      </div>
      <div className={toolbarActions}>
        <button
          type="button"
          className="toolbar-pill toolbar-pill-button toolbar-search-pill"
          onClick={onCommandOpen}
          aria-label="Open command palette (⌘K)"
        >
          <span className="toolbar-pill-main">
            <SearchIcon className="toolbar-search-icon" />
            <span className="toolbar-pill-label">
              {locale === 'zh' ? '搜索 (⌘K)' : 'Search (⌘K)'}
            </span>
          </span>
        </button>
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
            <ChevronDownIcon className={`locale-caret${localeOpen ? ' open' : ''}`} />
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
                {locale === 'zh' ? <CheckIcon className="locale-check" /> : null}
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
                {locale === 'en' ? <CheckIcon className="locale-check" /> : null}
              </button>
            </div>
          ) : null}
        </div>
        <div className="theme-switch-wrap" ref={themeMenuRef}>
          <button
            type="button"
            className="theme-trigger"
            aria-haspopup="menu"
            aria-expanded={themeOpen}
            onClick={() => setThemeOpen((c) => !c)}
          >
            <span>{resolved === 'dark' ? <MoonIcon /> : <SunIcon />}</span>
          </button>
          {themeOpen ? (
            <div className="theme-menu" role="menu" aria-label="Theme">
              <button
                type="button"
                className={`theme-option${mode === 'light' ? ' active' : ''}`}
                onClick={() => {
                  setTheme('light');
                  setThemeOpen(false);
                }}
              >
                <span>
                  <SunIcon /> Light
                </span>
                {mode === 'light' ? <CheckIcon className="theme-check" /> : null}
              </button>
              <button
                type="button"
                className={`theme-option${mode === 'dark' ? ' active' : ''}`}
                onClick={() => {
                  setTheme('dark');
                  setThemeOpen(false);
                }}
              >
                <span>
                  <MoonIcon /> Dark
                </span>
                {mode === 'dark' ? <CheckIcon className="theme-check" /> : null}
              </button>
              <button
                type="button"
                className={`theme-option${mode === 'system' ? ' active' : ''}`}
                onClick={() => {
                  setTheme('system');
                  setThemeOpen(false);
                }}
              >
                <span>
                  <MonitorIcon /> System
                </span>
                {mode === 'system' ? <CheckIcon className="theme-check" /> : null}
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
  icon?: ReactNode;
  message: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, message, detail, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon ? <span className="empty-state-icon">{icon}</span> : null}
      <span className="empty-state-message">{message}</span>
      {detail ? <span className="empty-state-detail">{detail}</span> : null}
      {actionLabel && onAction ? (
        <button type="button" className="empty-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const { state, approveLiveIntent, rejectLiveIntent } = useTradingSystem();
  const [collapsed, setCollapsed] = useState(() => {
    const stored = window.localStorage.getItem('quantpilot-sidebar-collapsed');
    if (stored !== null) return stored === 'true';
    return window.innerWidth < 720;
  });
  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      // Cmd+K: command palette
      if (meta && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
        return;
      }

      // Cmd+/: shortcut help
      if (meta && e.key === '/') {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      // Escape: close modals
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setShortcutsOpen(false);
        return;
      }

      // Cmd+1-9: navigation
      if (meta && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const routes = listSidebarRoutes();
        const idx = Number(e.key) - 1;
        if (routes[idx]) {
          // Use the router navigate() — setting location.hash does not change
          // the path under BrowserRouter, so navigation silently no-ops.
          navigate(routes[idx].path);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className={`${appShell}${collapsed ? ` ${appShellCollapsed}` : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <main className={mainPanel}>
        <GlobalToolbar onCommandOpen={() => setCmdOpen(true)} />
        <Outlet />
      </main>
      {cmdOpen && <CommandPalette locale={locale} onClose={() => setCmdOpen(false)} />}
      <ShortcutHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <MobileBottomNav />
      <ApprovalDrawer
        locale={locale}
        queue={state.approvalQueue}
        onApprove={approveLiveIntent}
        onReject={rejectLiveIntent}
      />
    </div>
  );
}
