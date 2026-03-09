import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCollectionStore } from './collection-store.mjs';
import { ensureDirectory, readJsonFile, writeJsonFile } from './filesystem.mjs';
import { createKeyValueStore } from './kv-store.mjs';

const packageDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(packageDir, '..', '..', '..');

export function createJsonFileStore({ namespace }) {
  const rootDir = join(repoRoot, '.quantpilot-runtime', namespace);

  function resolvePath(filename) {
    return join(rootDir, filename);
  }

  function ensureRoot() {
    ensureDirectory(rootDir);
  }

  return {
    rootDir,
    ...createCollectionStore({ ensureRoot, resolvePath, readJsonFile, writeJsonFile }),
    ...createKeyValueStore({ ensureRoot, resolvePath, readJsonFile, writeJsonFile }),
  };
}
