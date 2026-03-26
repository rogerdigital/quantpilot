import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCollectionStore } from './collection-store.mjs';
import { ensureDirectory, readJsonFile, writeJsonFile } from './filesystem.mjs';
import { createKeyValueStore } from './kv-store.mjs';

const packageDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(packageDir, '..', '..', '..');

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

  store.describeAdapter = () => store.adapter;
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
    },
    {
      kind: 'db',
      label: 'Embedded Control Plane DB',
      persistence: 'embedded-json-db',
    },
  ];
}
