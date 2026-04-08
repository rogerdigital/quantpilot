import { createEmbeddedDbStore, createJsonFileStore, listSupportedControlPlaneAdapters } from '../../db/src/control-plane-adapters.js';

function resolveNamespace() {
  return process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE || 'control-plane';
}

function resolveAdapterKind(input = '') {
  const kind = String(input || process.env.QUANTPILOT_CONTROL_PLANE_ADAPTER || 'file').trim().toLowerCase();
  return kind === 'db' ? 'db' : 'file';
}

export function createControlPlaneStorageAdapter(options = {}) {
  const namespace = options.namespace || resolveNamespace();
  const adapter = resolveAdapterKind(options.adapter);

  if (adapter === 'db') {
    return createEmbeddedDbStore({ namespace });
  }

  return createJsonFileStore({ namespace });
}

export function createControlPlaneStore(options = {}) {
  return createControlPlaneStorageAdapter(options);
}

export function getControlPlaneStorageConfig(options = {}) {
  const store = createControlPlaneStorageAdapter(options);
  return store.describeAdapter ? store.describeAdapter() : store.adapter;
}

export function getControlPlanePersistenceStatus(options = {}) {
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

export const controlPlaneStore = createControlPlaneStorageAdapter({ namespace: resolveNamespace() });
