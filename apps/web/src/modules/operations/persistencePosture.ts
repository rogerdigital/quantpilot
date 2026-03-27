import type { OperationsMaintenanceResponse, OperationsPersistencePosture } from '@shared-types/trading.ts';

export function derivePersistencePostureFromMaintenance(maintenance: OperationsMaintenanceResponse | null | undefined): OperationsPersistencePosture {
  const persistence = maintenance?.integrity?.persistence;
  const manifest = persistence?.manifest || null;
  const migrationPlan = persistence?.migrationPlan || {
    currentVersion: null,
    targetVersion: null,
    pending: [],
    upToDate: true,
  };
  const pendingCount = Array.isArray(migrationPlan.pending) ? migrationPlan.pending.length : 0;
  const storageModel = manifest?.storageModel || manifest?.persistence || maintenance?.storageAdapter?.persistence || 'filesystem-json';
  const adapter = persistence?.adapter || maintenance?.storageAdapter || {
    kind: 'custom',
    label: 'Custom Store',
    namespace: 'control-plane',
  };
  const latestMigration = Array.isArray(manifest?.migrations) && manifest.migrations.length
    ? manifest.migrations[manifest.migrations.length - 1]
    : null;

  let posture: OperationsPersistencePosture['posture'] = 'healthy';
  let headline = 'Persistence posture is current.';
  let detail = `The ${storageModel} backend is aligned with schema version ${manifest?.schemaVersion ?? 'unknown'}.`;
  let recommendedAction = 'Continue monitoring.';

  if (!manifest || migrationPlan.currentVersion === null || migrationPlan.targetVersion === null) {
    posture = 'degraded';
    headline = 'Persistence metadata needs inspection.';
    detail = 'Manifest or migration planning data is incomplete, so maintenance posture should be reviewed before making changes.';
    recommendedAction = 'Inspect maintenance posture before making changes.';
  } else if (!migrationPlan.upToDate || pendingCount > 0) {
    posture = 'attention';
    headline = 'Migration follow-up recommended.';
    detail = `The ${storageModel} backend is readable, but ${pendingCount} migrations are still pending between versions ${migrationPlan.currentVersion} and ${migrationPlan.targetVersion}.`;
    recommendedAction = 'Back up before applying migrations.';
  }

  return {
    posture,
    headline,
    detail,
    adapter,
    storageModel,
    schemaVersion: manifest?.schemaVersion ?? null,
    currentVersion: migrationPlan.currentVersion ?? null,
    targetVersion: migrationPlan.targetVersion ?? null,
    pendingCount,
    upToDate: Boolean(migrationPlan.upToDate && pendingCount === 0),
    recommendedAction,
    latestMigration,
    links: {
      maintenance: '/notifications#operations-workbench',
      settings: '/settings#persistence-migration',
    },
  };
}

export function buildPersistenceCliCommands(adapterKind = 'db') {
  return [
    `npm run control-plane:maintenance -- backup --adapter ${adapterKind}`,
    `npm run control-plane:maintenance -- migrate --adapter ${adapterKind}`,
    `npm run control-plane:maintenance -- repair-workflows --adapter ${adapterKind}`,
  ];
}

export function buildPersistenceApiExamples() {
  return [
    'GET /api/operations/maintenance',
    'POST /api/operations/maintenance/backup',
    'POST /api/operations/maintenance/repair/workflows',
  ];
}

export function translatePersistencePosture(locale: 'zh' | 'en', posture: OperationsPersistencePosture['posture']) {
  if (locale === 'zh') {
    if (posture === 'attention') return '待迁移';
    if (posture === 'degraded') return '需检查';
    return '健康';
  }
  if (posture === 'attention') return 'migration pending';
  if (posture === 'degraded') return 'inspect now';
  return 'healthy';
}
