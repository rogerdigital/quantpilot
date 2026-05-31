import type { AppLocale } from '@shared-types/trading.ts';
import { lazy, type ReactElement, Suspense } from 'react';
import { ErrorBoundary } from '../../app/components/ErrorBoundary.tsx';
import { type ConsolePageKey, copy } from './console.i18n.tsx';

const DashboardPage = lazy(() =>
  import('../../pages/console/routes/OverviewPage.tsx').then((m) => ({ default: m.OverviewPage }))
);
const MarketPage = lazy(() =>
  import('../../pages/console/routes/MarketPage.tsx').then((m) => ({ default: m.MarketPage }))
);
const TradingPage = lazy(() =>
  import('../../pages/trading/TradingPage.tsx').then((m) => ({ default: m.TradingPage }))
);
const StrategiesPage = lazy(() => import('../../pages/strategies/StrategiesPage.tsx'));
const StrategyDetailPage = lazy(() =>
  import('../../pages/strategies/StrategyDetailPage.tsx').then((m) => ({
    default: m.StrategyDetailPage,
  }))
);
const BacktestPage = lazy(() => import('../../pages/backtest/BacktestPage.tsx'));
const RiskPage = lazy(() => import('../../pages/risk/RiskPage.tsx'));
const ExecutionPage = lazy(() =>
  import('../../pages/console/routes/ExecutionPage.tsx').then((m) => ({ default: m.ExecutionPage }))
);
const SettingsPage = lazy(() =>
  import('../../pages/console/routes/SettingsPage.tsx').then((m) => ({ default: m.SettingsPage }))
);

type ConsoleNavKey =
  | 'dashboard'
  | 'market'
  | 'trading'
  | 'strategies'
  | 'strategy-detail'
  | 'backtest'
  | 'risk'
  | 'execution'
  | 'settings';

export type ConsoleRouteDefinition = {
  id: ConsoleNavKey;
  pageKey: ConsolePageKey;
  path: string;
  aliases?: string[];
  includeInSidebar?: boolean;
  element: ReactElement;
};

function renderLazyRoute(element: ReactElement) {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={<div style={{ padding: '2rem', color: '#6f6257' }}>Loading workspace...</div>}
      >
        {element}
      </Suspense>
    </ErrorBoundary>
  );
}

export const CONSOLE_ROUTES: ConsoleRouteDefinition[] = [
  {
    id: 'dashboard',
    pageKey: 'dashboard',
    path: '/dashboard',
    aliases: ['/', '/overview'],
    includeInSidebar: true,
    element: renderLazyRoute(<DashboardPage />),
  },
  {
    id: 'market',
    pageKey: 'market',
    path: '/market',
    includeInSidebar: true,
    element: renderLazyRoute(<MarketPage />),
  },
  {
    id: 'trading',
    pageKey: 'trading',
    path: '/trading',
    includeInSidebar: true,
    element: renderLazyRoute(<TradingPage />),
  },
  {
    id: 'strategies',
    pageKey: 'strategies',
    path: '/strategies',
    aliases: ['/signals', '/strategy'],
    includeInSidebar: true,
    element: renderLazyRoute(<StrategiesPage />),
  },
  {
    id: 'strategy-detail',
    pageKey: 'strategies',
    path: '/strategies/:id',
    includeInSidebar: false,
    element: renderLazyRoute(<StrategyDetailPage />),
  },
  {
    id: 'backtest',
    pageKey: 'backtest',
    path: '/backtest',
    includeInSidebar: true,
    element: renderLazyRoute(<BacktestPage />),
  },
  {
    id: 'risk',
    pageKey: 'risk',
    path: '/risk',
    aliases: ['/portfolio', '/accounts'],
    includeInSidebar: true,
    element: renderLazyRoute(<RiskPage />),
  },
  {
    id: 'execution',
    pageKey: 'execution',
    path: '/execution',
    aliases: ['/orders'],
    includeInSidebar: true,
    element: renderLazyRoute(<ExecutionPage />),
  },
  {
    id: 'settings',
    pageKey: 'settings',
    path: '/settings',
    includeInSidebar: true,
    element: renderLazyRoute(<SettingsPage />),
  },
];

export function listConsoleRoutes() {
  return CONSOLE_ROUTES;
}

export function listSidebarRoutes() {
  return CONSOLE_ROUTES.filter((route) => route.includeInSidebar);
}

export function findConsoleRoute(pathname: string) {
  return CONSOLE_ROUTES.find(
    (route) => route.path === pathname || route.aliases?.includes(pathname)
  );
}

export function getConsoleDocumentTitle(locale: AppLocale, pathname: string) {
  const route = findConsoleRoute(pathname);
  if (!route) return 'quantpilot';
  return `${copy[locale].nav[route.id]} | quantpilot`;
}
