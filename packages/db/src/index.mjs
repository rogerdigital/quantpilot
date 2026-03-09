import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(packageDir, '..', '..', '..');

function ensureDirectory(pathname) {
  mkdirSync(pathname, { recursive: true });
}

export function createJsonFileStore({ namespace }) {
  const rootDir = join(repoRoot, '.quantpilot-runtime', namespace);

  function resolvePath(filename) {
    return join(rootDir, filename);
  }

  function ensureRoot() {
    ensureDirectory(rootDir);
  }

  function readCollection(filename) {
    ensureRoot();
    const pathname = resolvePath(filename);
    if (!existsSync(pathname)) {
      return [];
    }
    try {
      const text = readFileSync(pathname, 'utf8');
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeCollection(filename, entries) {
    ensureRoot();
    writeFileSync(resolvePath(filename), JSON.stringify(entries, null, 2));
  }

  function readObject(filename, fallback) {
    ensureRoot();
    const pathname = resolvePath(filename);
    if (!existsSync(pathname)) {
      return fallback;
    }
    try {
      const text = readFileSync(pathname, 'utf8');
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function writeObject(filename, value) {
    ensureRoot();
    writeFileSync(resolvePath(filename), JSON.stringify(value, null, 2));
  }

  return {
    rootDir,
    readCollection,
    writeCollection,
    readObject,
    writeObject,
  };
}
