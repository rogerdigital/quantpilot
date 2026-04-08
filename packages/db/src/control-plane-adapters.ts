import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCollectionStore } from './collection-store.js';
import { ensureDirectory, readJsonFile, writeJsonFile } from './filesystem.js';
import { createKeyValueStore } from './kv-store.js';

const packageDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(packageDir, '..', '..', '..');
export const CONTROL_PLANE_ADAPTER_MANIFEST_FILENAME = '_control-plane-adapter.json';
export const CONTROL_PLANE_SCHEMA_VERSION = 1;

function createAdapterMetadata(input = {}) {
  return {
    kind: input.kind || 'file',
    label: input.label || 'JSON File Adapter',
    namespace: input.namespace || 'control-plane',
    rootDir: input.rootDir || '',
    persistence: input.persistence || 'filesystem-json',
    capabilities: {
      collections: true,
      objects: true,
      namespaces: true,
      transactions: false,
      migrations: false,
      replication: false,
      ...(input.capabilities || {}),
    },
  };
}

function createAdapterManifest(metadata, input = {}) {
  return {
    version: 1,
    schemaVersion: Number.isInteger(input.schemaVersion) ? input.schemaVersion : CONTROL_PLANE_SCHEMA_VERSION,
    initializedAt: input.initializedAt || new Date().toISOString(),
    updatedAt: input.updatedAt || input.initializedAt || new Date().toISOString(),
    namespace: metadata.namespace,
    adapterKind: metadata.kind,
    persistence: metadata.persistence,
    storageModel: input.storageModel || (metadata.kind === 'db' ? 'embedded-docstore' : 'flat-file-json'),
    migrations: Array.isArray(input.migrations) ? input.migrations : [],
  };
}

function normalizeAdapterManifest(metadata, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createAdapterManifest(metadata);
  }
  return createAdapterManifest(metadata, {
    ...value,
    schemaVersion: Number.isInteger(Number(value.schemaVersion))
      ? Number(value.schemaVersion)
      : CONTROL_PLANE_SCHEMA_VERSION,
    migrations: Array.isArray(value.migrations) ? value.migrations : [],
  });
}

function buildMigrationSteps(metadata, manifest, targetVersion = CONTROL_PLANE_SCHEMA_VERSION) {
  const pending = [];
  if (metadata.kind !== 'db') {
    return pending;
  }
  if (!manifest.initializedAt) {
    pending.push({
      id: 'initialize-embedded-db',
      kind: 'initialize',
      fromVersion: 0,
      toVersion: CONTROL_PLANE_SCHEMA_VERSION,
      summary: 'Initialize the embedded control-plane DB manifest and storage layout.',
    });
  }
  const currentVersion = Number(manifest.schemaVersion || 0);
  for (let version = Math.max(currentVersion + 1, 1); version <= targetVersion; version += 1) {
    pending.push({
      id: `schema-v${version}`,
      kind: currentVersion === 0 ? 'initialize' : 'upgrade',
      fromVersion: Math.max(version - 1, 0),
      toVersion: version,
      summary: version === 1
        ? 'Register the embedded DB document layout and baseline schema contract.'
        : `Upgrade the embedded DB schema contract to version ${version}.`,
    });
  }
  return pending.filter((item, index, items) => items.findIndex((entry) => entry.id === item.id) === index);
}

function createAdapterStore({ rootDir, metadata, resolveCollectionPath, resolveObjectPath }) {
  function ensureRoot() {
    ensureDirectory(rootDir);
  }

  const store = {
    adapter: metadata,
    rootDir,
    ...createCollectionStore({
      ensureRoot,
      resolvePath: resolveCollectionPath,
      readJsonFile,
      writeJsonFile,
    }),
    ...createKeyValueStore({
      ensureRoot,
      resolvePath: resolveObjectPath,
      readJsonFile,
      writeJsonFile,
    }),
  };

  function readAdapterManifest() {
    ensureRoot();
    return normalizeAdapterManifest(metadata, store.readObject(CONTROL_PLANE_ADAPTER_MANIFEST_FILENAME, {}));
  }

  function writeAdapterManifest(value) {
    ensureRoot();
    store.writeObject(CONTROL_PLANE_ADAPTER_MANIFEST_FILENAME, normalizeAdapterManifest(metadata, value));
  }

  function ensureAdapterManifest() {
    const manifest = readAdapterManifest();
    if (!store.readObject(CONTROL_PLANE_ADAPTER_MANIFEST_FILENAME, null)) {
      writeAdapterManifest(manifest);
    }
    return readAdapterManifest();
  }

  function getMigrationPlan(options = {}) {
    const manifest = ensureAdapterManifest();
    const targetVersion = Number(options.targetVersion || CONTROL_PLANE_SCHEMA_VERSION);
    const pending = buildMigrationSteps(metadata, manifest, targetVersion);
    return {
      adapter: metadata,
      currentVersion: manifest.schemaVersion || 0,
      targetVersion,
      pending,
      upToDate: pending.length === 0 && (manifest.schemaVersion || 0) >= targetVersion,
    };
  }

  function applyMigrations(options = {}) {
    const startedAt = options.startedAt || new Date().toISOString();
    const manifest = ensureAdapterManifest();
    const plan = getMigrationPlan(options);
    if (!plan.pending.length) {
      return {
        ok: true,
        adapter: metadata,
        appliedSteps: [],
        manifest,
        targetVersion: plan.targetVersion,
      };
    }
    const nextManifest = createAdapterManifest(metadata, {
      ...manifest,
      schemaVersion: plan.targetVersion,
      initializedAt: manifest.initializedAt || startedAt,
      updatedAt: startedAt,
      migrations: [
        ...(Array.isArray(manifest.migrations) ? manifest.migrations : []),
        ...plan.pending.map((step) => ({
          id: step.id,
          kind: step.kind,
          fromVersion: step.fromVersion,
          toVersion: step.toVersion,
          appliedAt: startedAt,
        })),
      ],
    });
    writeAdapterManifest(nextManifest);
    return {
      ok: true,
      adapter: metadata,
      appliedSteps: plan.pending,
      manifest: nextManifest,
      targetVersion: plan.targetVersion,
    };
  }

  store.readAdapterManifest = readAdapterManifest;
  store.ensureAdapterManifest = ensureAdapterManifest;
  store.getMigrationPlan = getMigrationPlan;
  store.applyMigrations = applyMigrations;
  store.describeAdapter = () => store.adapter;
  store.describePersistence = () => ({
    adapter: store.adapter,
    manifest: ensureAdapterManifest(),
    migrationPlan: getMigrationPlan(),
  });
  ensureAdapterManifest();
  return store;
}

export function createJsonFileStore({ namespace }) {
  const rootDir = join(repoRoot, '.quantpilot-runtime', namespace);

  return createAdapterStore({
    rootDir,
    metadata: createAdapterMetadata({
      kind: 'file',
      label: 'Filesystem JSON Store',
      namespace,
      rootDir,
      persistence: 'filesystem-json',
    }),
    resolveCollectionPath: (filename) => join(rootDir, filename),
    resolveObjectPath: (filename) => join(rootDir, filename),
  });
}

export function createEmbeddedDbStore({ namespace }) {
  const rootDir = join(repoRoot, '.quantpilot-runtime-db', namespace);
  const collectionsDir = join(rootDir, 'collections');
  const objectsDir = join(rootDir, 'objects');

  return createAdapterStore({
    rootDir,
    metadata: createAdapterMetadata({
      kind: 'db',
      label: 'Embedded Control Plane DB',
      namespace,
      rootDir,
      persistence: 'embedded-json-db',
      capabilities: {
        migrations: true,
      },
    }),
    resolveCollectionPath: (filename) => {
      ensureDirectory(collectionsDir);
      return join(collectionsDir, filename);
    },
    resolveObjectPath: (filename) => {
      ensureDirectory(objectsDir);
      return join(objectsDir, filename);
    },
  });
}

export function listSupportedControlPlaneAdapters() {
  return [
    {
      kind: 'file',
      label: 'Filesystem JSON Store',
      persistence: 'filesystem-json',
      schemaVersion: CONTROL_PLANE_SCHEMA_VERSION,
      supportsMigrations: false,
    },
    {
      kind: 'db',
      label: 'Embedded Control Plane DB',
      persistence: 'embedded-json-db',
      schemaVersion: CONTROL_PLANE_SCHEMA_VERSION,
      supportsMigrations: true,
    },
  ];
}
