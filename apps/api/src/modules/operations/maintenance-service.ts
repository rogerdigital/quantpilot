import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.js';
import { controlPlaneContext } from '../../../../../packages/control-plane-store/src/context.js';
import {
  exportControlPlaneBackup,
  getControlPlaneIntegrityReport,
  restoreControlPlaneBackup,
} from '../../../../../packages/control-plane-store/src/index.js';
import { appendAuditRecord } from '../audit/service.js';
import { getSession } from '../auth/service.js';
import { getMonitoringStatus } from '../monitoring/service.js';

function toPositiveLimit(value: any, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function currentActor() {
  return getSession()?.user?.id || 'operator-demo';
}

function recordMaintenanceAudit(type: string, title: string, detail: string, metadata: Record<string, any> = {}) {
  appendAuditRecord({
    type,
    actor: currentActor(),
    title,
    detail,
    metadata,
  });
}

export async function getOperationsMaintenanceSnapshot(options: Record<string, any> = {}) {
  const generatedAt = new Date().toISOString();
  const monitoring = await getMonitoringStatus(options as any);
  const integrity = getControlPlaneIntegrityReport(controlPlaneContext.store, {
    generatedAt,
  });
  const failedWorkflows = controlPlaneRuntime.listWorkflowRuns(toPositiveLimit(options.limit, 10), {
    status: 'failed',
  });
  const retryScheduledWorkflows = controlPlaneRuntime.listWorkflowRuns(
    toPositiveLimit(options.limit, 10),
    {
      status: 'retry_scheduled',
    }
  );

  return {
    ok: true,
    generatedAt,
    storageAdapter: (controlPlaneContext as any).storageAdapter,
    integrity,
    backlog: {
      pendingNotificationJobs: (monitoring as any).services.queues.pendingNotificationJobs,
      pendingRiskScanJobs: (monitoring as any).services.queues.pendingRiskScanJobs,
      pendingAgentReviews: (monitoring as any).services.queues.pendingAgentReviews,
      retryScheduledWorkflows: (monitoring as any).services.queues.retryScheduledWorkflows,
      failedWorkflows: failedWorkflows.length,
      totalPending: (monitoring as any).services.queues.totalPending,
      backlogStatus: (monitoring as any).services.queues.backlogStatus,
    },
    recentFailedWorkflows: failedWorkflows,
    recentRetryScheduledWorkflows: retryScheduledWorkflows,
    supportedRepairs: [
      {
        key: 'workflow-retry-release',
        label: 'Release due retry-scheduled workflows',
        detail:
          'Moves due retry-scheduled workflow runs back into queued state and records workflow-control fanout.',
      },
    ],
  };
}

export function createOperationsMaintenanceBackup() {
  const backup = exportControlPlaneBackup(controlPlaneContext.store);
  recordMaintenanceAudit(
    'operations.maintenance.backup.created',
    'Control-plane backup exported',
    `Exported control-plane backup with ${(backup as any).files.length} files.`,
    {
      adapterKind: (backup as any).adapter.kind,
      fileCount: (backup as any).files.length,
    }
  );
  return {
    ok: true,
    backup,
  };
}

export function restoreOperationsMaintenanceBackup(payload: Record<string, any> = {}) {
  const result = restoreControlPlaneBackup(controlPlaneContext.store, payload.backup || payload, {
    dryRun: payload.dryRun,
  }) as any;

  recordMaintenanceAudit(
    result.dryRun
      ? 'operations.maintenance.restore.dry-run'
      : 'operations.maintenance.restore.applied',
    result.dryRun ? 'Control-plane restore dry run executed' : 'Control-plane restore applied',
    result.dryRun
      ? `Validated restore payload for ${result.restoredFiles.length} files.`
      : `Restored ${result.restoredFiles.length} control-plane files from backup.`,
    {
      dryRun: result.dryRun,
      restoredFileCount: result.restoredFiles.length,
      skippedFiles: result.skippedFiles,
    }
  );

  return {
    ok: true,
    ...result,
    integrity: getControlPlaneIntegrityReport(controlPlaneContext.store),
  };
}

export function releaseWorkflowMaintenanceBacklog(payload: Record<string, any> = {}) {
  const result = controlPlaneRuntime.releaseScheduledWorkflowRuns({
    worker: payload.worker || 'operations-maintenance',
    limit: toPositiveLimit(payload.limit, 20),
    now: payload.now || new Date().toISOString(),
  }) as any;

  recordMaintenanceAudit(
    'operations.maintenance.workflow-repair',
    'Workflow retry backlog repaired',
    `Released ${result.releasedCount} retry-scheduled workflow runs back into queued state.`,
    {
      worker: result.worker,
      releasedCount: result.releasedCount,
      workflowIds: result.workflows.map((item: any) => item.id),
    }
  );

  return {
    ok: true,
    ...result,
  };
}
