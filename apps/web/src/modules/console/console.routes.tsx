import type { AppLocale } from '@shared-types/trading.ts';
import type { ReactElement } from 'react';
import AgentPage from '../agent/AgentPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import ExecutionPage from './pages/ExecutionPage.tsx';
import MarketPage from './pages/MarketPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import NotificationsPage from '../notifications/NotificationsPage.tsx';
import BacktestPage from '../research/BacktestPage.tsx';
import StrategiesPage from '../research/StrategiesPage.tsx';
import RiskPage from '../risk/RiskPage.tsx';
import { copy, type ConsolePageKey } from './console.i18n.tsx';

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

export const CONSOLE_ROUTES: ConsoleRouteDefinition[] = [
  {
    id: 'dashboard',
    pageKey: 'dashboard',
    path: '/dashboard',
    aliases: ['/', '/overview'],
    includeInSidebar: true,
    element: <DashboardPage />,
  },
  {
    id: 'market',
    pageKey: 'market',
    path: '/market',
    includeInSidebar: true,
    element: <MarketPage />,
  },
  {
    id: 'strategies',
    pageKey: 'strategies',
    path: '/strategies',
    aliases: ['/signals', '/strategy'],
    includeInSidebar: true,
    element: <StrategiesPage />,
  },
  {
    id: 'backtest',
    pageKey: 'backtest',
    path: '/backtest',
    includeInSidebar: true,
    element: <BacktestPage />,
  },
  {
    id: 'risk',
    pageKey: 'risk',
    path: '/risk',
    aliases: ['/portfolio', '/accounts'],
    includeInSidebar: true,
    element: <RiskPage />,
  },
  {
    id: 'execution',
    pageKey: 'execution',
    path: '/execution',
    aliases: ['/orders'],
    includeInSidebar: true,
    element: <ExecutionPage />,
  },
  {
    id: 'agent',
    pageKey: 'agent',
    path: '/agent',
    aliases: ['/analysis'],
    includeInSidebar: true,
    element: <AgentPage />,
  },
  {
    id: 'notifications',
    pageKey: 'notifications',
    path: '/notifications',
    includeInSidebar: true,
    element: <NotificationsPage />,
  },
  {
    id: 'settings',
    pageKey: 'settings',
    path: '/settings',
    includeInSidebar: true,
    element: <SettingsPage />,
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
