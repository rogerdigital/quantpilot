import { handleAuditRoutes } from './routers/audit-router.js';
import { handleIncidentsRoutes } from './routers/incidents-router.js';
import { handleNotificationRoutes } from './routers/notification-router.js';
import { handleRiskRoutes } from './routers/risk-router.js';
import { handleSchedulerRoutes } from './routers/scheduler-router.js';
import { handleTaskOrchestratorRoutes } from './routers/task-orchestrator-router.js';

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
