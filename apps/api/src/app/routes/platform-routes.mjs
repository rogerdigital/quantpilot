import { handleHealthRoutes } from './routers/health-router.mjs';
import { handleMonitoringRoutes } from './routers/monitoring-router.mjs';
import { handleOperationsRoutes } from './routers/operations-router.mjs';
import { handleAuthRoutes } from './routers/auth-router.mjs';
import { handleUserAccountRoutes } from './routers/user-account-router.mjs';
import { handleAgentRoutes } from './routers/agent-router.mjs';
import { handleStrategyRoutes } from './routers/strategy-router.mjs';
import { handleBacktestRoutes } from './routers/backtest-router.mjs';
import { handleResearchRoutes } from './routers/research-router.mjs';
import { handleExecutionRoutes } from './routers/execution-router.mjs';

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
