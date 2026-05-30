import { handleAuthRoutes } from './routers/auth-router.js';
import { handleBacktestRoutes } from './routers/backtest-router.js';
import { handleExecutionRoutes } from './routers/execution-router.js';
import { handleHealthRoutes } from './routers/health-router.js';
import { handleMarketRoutes } from './routers/market-router.js';
import { handleRiskRoutes } from './routers/risk-router.js';
import { handleStrategyRoutes } from './routers/strategy-router.js';
import { handleTradingRoutes } from './routers/trading-router.js';
import type { GatewayRouteContext, RouteHandler } from './types.js';

const routers: RouteHandler[] = [
  handleHealthRoutes,
  handleAuthRoutes,
  handleStrategyRoutes,
  handleBacktestRoutes,
  handleExecutionRoutes,
  handleTradingRoutes,
  handleMarketRoutes,
  handleRiskRoutes,
];

export async function handlePlatformRoutes(context: GatewayRouteContext) {
  for (const router of routers) {
    const handled = await router(context);
    if (handled) return true;
  }
  return false;
}
