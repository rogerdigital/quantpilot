import { handleAgentRoutes } from './routers/agent-router.js';
import { handleAnalyticsRoutes } from './routers/analytics-router.js';
import { handleAuthRoutes } from './routers/auth-router.js';
import { handleBacktestRoutes } from './routers/backtest-router.js';
import { handleCollaborationRoutes } from './routers/collaboration-router.js';
import { handleDocsRoutes } from './routers/docs-router.js';
import { handleExecutionRoutes } from './routers/execution-router.js';
import { handleExportRoutes } from './routers/export-router.js';
import { handleHealthRoutes } from './routers/health-router.js';
import { handleMarketRoutes } from './routers/market-router.js';
import { handleMarketplaceRoutes } from './routers/marketplace-router.js';
import { handleMonitoringRoutes } from './routers/monitoring-router.js';
import { handleOperationsRoutes } from './routers/operations-router.js';
import { handleResearchRoutes } from './routers/research-router.js';
import { handleSseRoutes } from './routers/sse-router.js';
import { handleStrategyRoutes } from './routers/strategy-router.js';
import { handleTradingRoutes } from './routers/trading-router.js';
import { handleUserAccountRoutes } from './routers/user-account-router.js';
import type { GatewayRouteContext, RouteHandler } from './types.js';

const routers: RouteHandler[] = [
  handleSseRoutes,
  handleHealthRoutes,
  handleMonitoringRoutes,
  handleOperationsRoutes,
  handleAuthRoutes,
  handleUserAccountRoutes,
  handleAgentRoutes,
  handleStrategyRoutes,
  handleBacktestRoutes,
  handleResearchRoutes,
  handleExecutionRoutes,
  handleTradingRoutes,
  handleMarketRoutes,
  handleMarketplaceRoutes,
  handleCollaborationRoutes,
  handleAnalyticsRoutes,
  handleExportRoutes,
  handleDocsRoutes,
];

export async function handlePlatformRoutes(context: GatewayRouteContext) {
  for (const router of routers) {
    const handled = await router(context);
    if (handled) return true;
  }
  return false;
}
