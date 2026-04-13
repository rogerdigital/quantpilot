// @ts-nocheck

import { handleAgentRoutes } from './routers/agent-router.js';
import { handleAuthRoutes } from './routers/auth-router.js';
import { handleBacktestRoutes } from './routers/backtest-router.js';
import { handleExecutionRoutes } from './routers/execution-router.js';
import { handleHealthRoutes } from './routers/health-router.js';
import { handleMonitoringRoutes } from './routers/monitoring-router.js';
import { handleOperationsRoutes } from './routers/operations-router.js';
import { handleResearchRoutes } from './routers/research-router.js';
import { handleStrategyRoutes } from './routers/strategy-router.js';
import { handleUserAccountRoutes } from './routers/user-account-router.js';

const routers = [
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
];

export async function handlePlatformRoutes(context) {
  for (const router of routers) {
    const handled = await router(context);
    if (handled) return true;
  }
  return false;
}
