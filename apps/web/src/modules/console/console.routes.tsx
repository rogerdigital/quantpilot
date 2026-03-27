import type { AppLocale } from '@shared-types/trading.ts';
import { Suspense, lazy, type ReactElement } from 'react';
import { copy, type ConsolePageKey } from './console.i18n.tsx';

const AgentPage = lazy(() => import('../agent/AgentPage.tsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.tsx'));
const ExecutionPage = lazy(() => import('./pages/ExecutionPage.tsx'));
const MarketPage = lazy(() => import('./pages/MarketPage.tsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.tsx'));
const NotificationsPage = lazy(() => import('../notifications/NotificationsPage.tsx'));
const BacktestPage = lazy(() => import('../research/BacktestPage.tsx'));
const StrategiesPage = lazy(() => import('../research/StrategiesPage.tsx'));
const RiskPage = lazy(() => import('../risk/RiskPage.tsx'));

type ConsoleNavKey =
  | 'dashboard'
  | 'market'
  | 'strategies'
  | 'backtest'
  | 'risk'
  | 'execution'
  | 'agent'
  | 'notifications'
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
    <Suspense fallback={<div style={{ padding: '2rem', color: '#6f6257' }}>Loading workspace...</div>}>
      {element}
    </Suspense>
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
    id: 'strategies',
    pageKey: 'strategies',
    path: '/strategies',
    aliases: ['/signals', '/strategy'],
    includeInSidebar: true,
    element: renderLazyRoute(<StrategiesPage />),
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
    id: 'agent',
    pageKey: 'agent',
    path: '/agent',
    aliases: ['/analysis'],
    includeInSidebar: true,
    element: renderLazyRoute(<AgentPage />),
  },
  {
    id: 'notifications',
    pageKey: 'notifications',
    path: '/notifications',
    includeInSidebar: true,
    element: renderLazyRoute(<NotificationsPage />),
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
  return CONSOLE_ROUTES.find((route) => route.path === pathname || route.aliases?.includes(pathname));
}

export function getConsoleDocumentTitle(locale: AppLocale, pathname: string) {
  const route = findConsoleRoute(pathname);
  if (!route) return 'quantpilot';
  return `${copy[locale].nav[route.id]} | quantpilot`;
}
