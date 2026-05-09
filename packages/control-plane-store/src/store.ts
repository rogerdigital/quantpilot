import {
  createEmbeddedDbStore,
  createJsonFileStore,
  listSupportedControlPlaneAdapters,
} from '../../db/src/control-plane-adapters.js';

type ControlPlaneAdapterKind = 'file' | 'db';

type ControlPlaneStorageOptions = {
  namespace?: string;
  adapter?: ControlPlaneAdapterKind | string;
};

type ControlPlaneAdapterMetadata = {
  kind: string;
  label: string;
  namespace: string;
  rootDir?: string;
  persistence?: string;
};

type ControlPlaneMigrationPlan = {
  adapter: ControlPlaneAdapterMetadata;
  currentVersion: number | null;
  targetVersion: number | null;
  pending: unknown[];
  upToDate: boolean;
};

type ControlPlaneStore = {
  adapter: ControlPlaneAdapterMetadata;
  describeAdapter?: () => ControlPlaneAdapterMetadata;
  describePersistence?: () => {
    adapter: ControlPlaneAdapterMetadata;
    manifest: unknown;
    migrationPlan: ControlPlaneMigrationPlan;
  };
};

function resolveNamespace(): string {
  return process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE || 'control-plane';
}

function resolveAdapterKind(input = ''): ControlPlaneAdapterKind {
  const kind = String(input || process.env.QUANTPILOT_CONTROL_PLANE_ADAPTER || 'file')
    .trim()
    .toLowerCase();
  return kind === 'db' ? 'db' : 'file';
}

export function createControlPlaneStorageAdapter(
  options: ControlPlaneStorageOptions = {}
): ControlPlaneStore {
  const namespace = options.namespace || resolveNamespace();
  const adapter = resolveAdapterKind(options.adapter);

  if (adapter === 'db') {
    return createEmbeddedDbStore({ namespace });
  }

  return createJsonFileStore({ namespace });
}

export function createControlPlaneStore(options: ControlPlaneStorageOptions = {}) {
  return createControlPlaneStorageAdapter(options);
}

export function getControlPlaneStorageConfig(options: ControlPlaneStorageOptions = {}) {
  const store = createControlPlaneStorageAdapter(options);
  return store.describeAdapter ? store.describeAdapter() : store.adapter;
}

export function getControlPlanePersistenceStatus(options: ControlPlaneStorageOptions = {}) {
  const store = createControlPlaneStorageAdapter(options);
  if (store.describePersistence) {
    return store.describePersistence();
  }
  return {
    adapter: store.describeAdapter ? store.describeAdapter() : store.adapter,
    manifest: null,
    migrationPlan: {
      adapter: store.describeAdapter ? store.describeAdapter() : store.adapter,
      currentVersion: null,
      targetVersion: null,
      pending: [],
      upToDate: true,
    },
  };
}

export { listSupportedControlPlaneAdapters };

export const controlPlaneStore = createControlPlaneStorageAdapter({
  namespace: resolveNamespace(),
});
