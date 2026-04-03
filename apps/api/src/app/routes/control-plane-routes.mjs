import { handleAuditRoutes } from './routers/audit-router.mjs';
import { handleIncidentsRoutes } from './routers/incidents-router.mjs';
import { handleNotificationRoutes } from './routers/notification-router.mjs';
import { handleRiskRoutes } from './routers/risk-router.mjs';
import { handleSchedulerRoutes } from './routers/scheduler-router.mjs';
import { handleTaskOrchestratorRoutes } from './routers/task-orchestrator-router.mjs';

const routers = [
  handleAuditRoutes,
  handleIncidentsRoutes,
  handleNotificationRoutes,
  handleRiskRoutes,
  handleSchedulerRoutes,
  handleTaskOrchestratorRoutes,
];

export async function handleControlPlaneRoutes(context) {
  for (const router of routers) {
    const handled = await router(context);
    if (handled) return true;
  }
  return false;
}
