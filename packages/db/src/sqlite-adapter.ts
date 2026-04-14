// @ts-nocheck
import Database from 'better-sqlite3';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const packageDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(packageDir, '..', '..', '..');

const CREATE_COLLECTIONS = `
  CREATE TABLE IF NOT EXISTS collections (
    id TEXT NOT NULL,
    namespace TEXT NOT NULL,
    entries TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (id, namespace)
  )
`;

const CREATE_OBJECTS = `
  CREATE TABLE IF NOT EXISTS objects (
    id TEXT NOT NULL,
    namespace TEXT NOT NULL,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (id, namespace)
  )
`;

export function createSQLiteAdapter({ namespace, dbPath }) {
  const resolvedPath = dbPath || join(repoRoot, '.quantpilot', 'control-plane.db');
  mkdirSync(dirname(resolvedPath), { recursive: true });

  const db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.exec(CREATE_COLLECTIONS);
  db.exec(CREATE_OBJECTS);

  const stmts = {
    getCollection: db.prepare(
      'SELECT entries FROM collections WHERE id = ? AND namespace = ?'
    ),
    upsertCollection: db.prepare(
      'INSERT OR REPLACE INTO collections (id, namespace, entries, updated_at) VALUES (?, ?, ?, ?)'
    ),
    getObject: db.prepare(
      'SELECT data FROM objects WHERE id = ? AND namespace = ?'
    ),
    upsertObject: db.prepare(
      'INSERT OR REPLACE INTO objects (id, namespace, data, updated_at) VALUES (?, ?, ?, ?)'
    ),
  };

  function readCollection(filename) {
    const row = stmts.getCollection.get(filename, namespace);
    if (!row) return [];
    try {
      const parsed = JSON.parse(row.entries);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeCollection(filename, entries) {
    stmts.upsertCollection.run(
      filename,
      namespace,
      JSON.stringify(entries),
      new Date().toISOString()
    );
  }

  function readObject(filename, fallback = null) {
    const row = stmts.getObject.get(filename, namespace);
    if (!row) return fallback;
    try {
      return JSON.parse(row.data);
    } catch {
      return fallback;
    }
  }

  function writeObject(filename, value) {
    stmts.upsertObject.run(
      filename,
      namespace,
      JSON.stringify(value),
      new Date().toISOString()
    );
  }

  return {
    adapter: {
      kind: 'sqlite',
      label: 'SQLite Adapter',
      namespace,
      rootDir: resolvedPath,
      persistence: 'sqlite',
      capabilities: {
        collections: true,
        objects: true,
        namespaces: true,
        transactions: true,
        migrations: false,
        replication: false,
      },
    },
    readCollection,
    writeCollection,
    readObject,
    writeObject,
    describeAdapter() {
      return this.adapter;
    },
    describePersistence() {
      return { adapter: this.adapter };
    },
    readAdapterManifest() {
      return this.readObject('_control-plane-adapter.json', {});
    },
    ensureAdapterManifest() {
      const existing = this.readObject('_control-plane-adapter.json', null);
      if (!existing) {
        this.writeObject('_control-plane-adapter.json', {
          version: 1,
          schemaVersion: 1,
          initializedAt: new Date().toISOString(),
          namespace,
          adapterKind: 'sqlite',
          persistence: 'sqlite',
          storageModel: 'sqlite-docstore',
          migrations: [],
        });
      }
      return this.readAdapterManifest();
    },
    getMigrationPlan() {
      return { adapter: this.adapter, pending: [], upToDate: true, currentVersion: 1, targetVersion: 1 };
    },
    applyMigrations() {
      return { ok: true, adapter: this.adapter, appliedSteps: [] };
    },
  };
}
