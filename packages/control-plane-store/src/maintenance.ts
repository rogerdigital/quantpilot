function getAdapterMetadata(store) {
  if (store?.describeAdapter) return store.describeAdapter();
  return store?.adapter || {
    kind: 'custom',
    label: 'Custom Store',
    namespace: 'control-plane',
  };
}

function getPersistenceStatus(store) {
  if (store?.describePersistence) {
    return store.describePersistence();
  }
  return {
    adapter: getAdapterMetadata(store),
    manifest: null,
    migrationPlan: {
      pending: [],
      upToDate: true,
      currentVersion: null,
      targetVersion: null,
    },
  };
}

function cloneValue(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function readFileValue(store, descriptor) {
  if (descriptor.kind === 'object') {
    return cloneValue(store.readObject(descriptor.filename, {}));
  }
  return cloneValue(store.readCollection(descriptor.filename));
}

function normalizeFileValue(descriptor, value) {
  if (descriptor.kind === 'object') {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  return Array.isArray(value) ? value : [];
}

function summarizeFileValue(descriptor, value) {
  if (descriptor.kind === 'object') {
    return {
      filename: descriptor.filename,
      label: descriptor.label,
      kind: descriptor.kind,
      keyCount: Object.keys(value || {}).length,
    };
  }

  return {
    filename: descriptor.filename,
    label: descriptor.label,
    kind: descriptor.kind,
    recordCount: Array.isArray(value) ? value.length : 0,
  };
}

function buildIssue(level, code, filename, message, metadata = {}) {
  return {
    level,
    code,
    filename,
    message,
    metadata,
  };
}

function countBy(items = [], predicate) {
  return items.reduce((count, item) => (predicate(item) ? count + 1 : count), 0);
}

export const CONTROL_PLANE_FILE_MANIFEST = [
  { filename: 'agent-action-requests.json', label: 'Agent Action Requests', kind: 'collection' },
  { filename: 'agent-analysis-runs.json', label: 'Agent Analysis Runs', kind: 'collection' },
  { filename: 'agent-plans.json', label: 'Agent Plans', kind: 'collection' },
  { filename: 'agent-sessions.json', label: 'Agent Sessions', kind: 'collection' },
  { filename: 'audit-records.json', label: 'Audit Records', kind: 'collection' },
  { filename: 'backtest-results.json', label: 'Backtest Results', kind: 'collection' },
  { filename: 'backtest-runs.json', label: 'Backtest Runs', kind: 'collection' },
  { filename: 'broker-account-snapshots.json', label: 'Broker Account Snapshots', kind: 'collection' },
  { filename: 'broker-execution-events.json', label: 'Broker Execution Events', kind: 'collection' },
  { filename: 'cycle-records.json', label: 'Cycle Records', kind: 'collection' },
  { filename: 'execution-candidate-handoffs.json', label: 'Execution Candidate Handoffs', kind: 'collection' },
  { filename: 'execution-order-states.json', label: 'Execution Order States', kind: 'collection' },
  { filename: 'execution-plans.json', label: 'Execution Plans', kind: 'collection' },
  { filename: 'execution-runs.json', label: 'Execution Runs', kind: 'collection' },
  { filename: 'execution-runtime-events.json', label: 'Execution Runtime Events', kind: 'collection' },
  { filename: 'incident-activities.json', label: 'Incident Activities', kind: 'collection' },
  { filename: 'incident-notes.json', label: 'Incident Notes', kind: 'collection' },
  { filename: 'incident-tasks.json', label: 'Incident Tasks', kind: 'collection' },
  { filename: 'incidents.json', label: 'Incidents', kind: 'collection' },
  { filename: 'market-provider-status.json', label: 'Market Provider Status', kind: 'object' },
  { filename: 'monitoring-alerts.json', label: 'Monitoring Alerts', kind: 'collection' },
  { filename: 'monitoring-snapshots.json', label: 'Monitoring Snapshots', kind: 'collection' },
  { filename: 'notification-outbox.json', label: 'Notification Outbox', kind: 'collection' },
  { filename: 'notifications.json', label: 'Notifications', kind: 'collection' },
  { filename: 'operator-actions.json', label: 'Operator Actions', kind: 'collection' },
  { filename: 'research-evaluations.json', label: 'Research Evaluations', kind: 'collection' },
  { filename: 'research-reports.json', label: 'Research Reports', kind: 'collection' },
  { filename: 'research-summary.json', label: 'Research Summary', kind: 'object' },
  { filename: 'research-tasks.json', label: 'Research Tasks', kind: 'collection' },
  { filename: 'risk-events.json', label: 'Risk Events', kind: 'collection' },
  { filename: 'risk-scan-outbox.json', label: 'Risk Scan Outbox', kind: 'collection' },
  { filename: 'scheduler-state.json', label: 'Scheduler State', kind: 'object' },
  { filename: 'scheduler-ticks.json', label: 'Scheduler Ticks', kind: 'collection' },
  { filename: 'strategy-catalog.json', label: 'Strategy Catalog', kind: 'collection' },
  { filename: 'user-account.json', label: 'User Account', kind: 'object' },
  { filename: 'worker-heartbeats.json', label: 'Worker Heartbeats', kind: 'collection' },
  { filename: 'workflow-runs.json', label: 'Workflow Runs', kind: 'collection' },
];

export function exportControlPlaneBackup(store, options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const adapter = getAdapterMetadata(store);
  const persistence = getPersistenceStatus(store);
  const data = {};
  const files = CONTROL_PLANE_FILE_MANIFEST.map((descriptor) => {
    const value = readFileValue(store, descriptor);
    data[descriptor.filename] = value;
    return summarizeFileValue(descriptor, value);
  });

  return {
    ok: true,
    version: 1,
    generatedAt,
    adapter,
    persistence,
    files,
    data,
  };
}

export function restoreControlPlaneBackup(store, input = {}, options = {}) {
  const backup = input?.backup && typeof input.backup === 'object' ? input.backup : input;
  const dryRun = Boolean(options.dryRun ?? input?.dryRun);
  const data = backup?.data && typeof backup.data === 'object' ? backup.data : {};
  const files = [];
  const skippedFiles = [];

  for (const descriptor of CONTROL_PLANE_FILE_MANIFEST) {
    if (!Object.prototype.hasOwnProperty.call(data, descriptor.filename)) continue;
    const nextValue = normalizeFileValue(descriptor, data[descriptor.filename]);
    files.push(summarizeFileValue(descriptor, nextValue));
    if (dryRun) continue;
    if (descriptor.kind === 'object') {
      store.writeObject(descriptor.filename, nextValue);
    } else {
      store.writeCollection(descriptor.filename, nextValue);
    }
  }

  if (backup?.files && Array.isArray(backup.files)) {
    backup.files.forEach((item) => {
      if (!CONTROL_PLANE_FILE_MANIFEST.some((descriptor) => descriptor.filename === item.filename)) {
        skippedFiles.push(item.filename);
      }
    });
  }

  return {
    ok: true,
    dryRun,
    restoredAt: new Date().toISOString(),
    restoredFiles: files,
    skippedFiles,
  };
}

export function getControlPlaneIntegrityReport(store, options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const persistence = getPersistenceStatus(store);
  const issues = [];
  let totalRecords = 0;
  let collectionFiles = 0;
  let objectFiles = 0;
  let duplicateIdCount = 0;
  let missingIdCount = 0;
  let malformedRecordCount = 0;

  const files = CONTROL_PLANE_FILE_MANIFEST.map((descriptor) => {
    const value = readFileValue(store, descriptor);
    const summary = summarizeFileValue(descriptor, value);

    if (descriptor.kind === 'object') {
      objectFiles += 1;
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        issues.push(buildIssue(
          'critical',
          'invalid-object-file',
          descriptor.filename,
          `${descriptor.label} is not stored as an object.`,
        ));
      }
      return summary;
    }

    collectionFiles += 1;
    totalRecords += Array.isArray(value) ? value.length : 0;
    if (!Array.isArray(value)) {
      malformedRecordCount += 1;
      issues.push(buildIssue(
        'critical',
        'invalid-collection-file',
        descriptor.filename,
        `${descriptor.label} is not stored as a collection.`,
      ));
      return summary;
    }

    const seenIds = new Set();
    value.forEach((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        malformedRecordCount += 1;
        issues.push(buildIssue(
          'warn',
          'invalid-record-shape',
          descriptor.filename,
          `${descriptor.label} contains a non-object record.`,
          { index },
        ));
        return;
      }
      if (!item.id) {
        missingIdCount += 1;
        issues.push(buildIssue(
          'warn',
          'missing-record-id',
          descriptor.filename,
          `${descriptor.label} contains a record without an id.`,
          { index },
        ));
        return;
      }
      if (seenIds.has(item.id)) {
        duplicateIdCount += 1;
        issues.push(buildIssue(
          'warn',
          'duplicate-record-id',
          descriptor.filename,
          `${descriptor.label} contains duplicate id ${item.id}.`,
          { id: item.id },
        ));
        return;
      }
      seenIds.add(item.id);
    });

    return summary;
  });

  const workflows = normalizeFileValue(
    { kind: 'collection' },
    readFileValue(store, { filename: 'workflow-runs.json', kind: 'collection' }),
  );
  const notificationJobs = normalizeFileValue(
    { kind: 'collection' },
    readFileValue(store, { filename: 'notification-outbox.json', kind: 'collection' }),
  );
  const riskScanJobs = normalizeFileValue(
    { kind: 'collection' },
    readFileValue(store, { filename: 'risk-scan-outbox.json', kind: 'collection' }),
  );
  const agentRequests = normalizeFileValue(
    { kind: 'collection' },
    readFileValue(store, { filename: 'agent-action-requests.json', kind: 'collection' }),
  );

  const retryScheduledWorkflows = countBy(workflows, (item) => item.status === 'retry_scheduled');
  const failedWorkflows = countBy(workflows, (item) => item.status === 'failed');
  const pendingNotificationJobs = countBy(notificationJobs, (item) => item.status === 'pending');
  const pendingRiskScanJobs = countBy(riskScanJobs, (item) => item.status === 'pending');
  const pendingAgentReviews = countBy(agentRequests, (item) => item.status === 'pending_review');

  return {
    ok: true,
    generatedAt,
    status: issues.some((item) => item.level === 'critical')
      ? 'critical'
      : (issues.length ? 'warn' : 'healthy'),
    adapter: getAdapterMetadata(store),
    persistence,
    files,
    issues,
    summary: {
      fileCount: CONTROL_PLANE_FILE_MANIFEST.length,
      collectionFiles,
      objectFiles,
      totalRecords,
      duplicateIdCount,
      missingIdCount,
      malformedRecordCount,
      retryScheduledWorkflows,
      failedWorkflows,
      pendingNotificationJobs,
      pendingRiskScanJobs,
      pendingAgentReviews,
    },
  };
}

export function runControlPlaneMigrations(store, options = {}) {
  if (!store?.applyMigrations) {
    return {
      ok: true,
      adapter: getAdapterMetadata(store),
      appliedSteps: [],
      manifest: null,
      targetVersion: null,
    };
  }
  return store.applyMigrations(options);
}
