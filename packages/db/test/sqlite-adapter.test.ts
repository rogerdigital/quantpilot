import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createSQLiteAdapter } from '../src/sqlite-adapter.js';

describe('sqlite-adapter', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'sqlite-test-'));
    dbPath = join(tmpDir, 'test.db');
  });

  function createAdapter() {
    return createSQLiteAdapter({ namespace: 'test-ns', dbPath });
  }

  it('creates adapter with correct metadata', () => {
    const adapter = createAdapter();
    assert.equal(adapter.adapter.kind, 'db');
    assert.equal(adapter.adapter.namespace, 'test-ns');
    assert.equal(adapter.adapter.persistence, 'embedded-json-db');
    assert.ok(adapter.adapter.capabilities.collections);
    assert.ok(adapter.adapter.capabilities.objects);
  });

  it('reads empty collection when no data written', () => {
    const adapter = createAdapter();
    const result = adapter.readCollection('items.json');
    assert.deepEqual(result, []);
  });

  it('writes and reads back a collection', () => {
    const adapter = createAdapter();
    const items = [{ id: 1, name: 'test' }];
    adapter.writeCollection('items.json', items);
    const result = adapter.readCollection('items.json');
    assert.deepEqual(result, items);
  });

  it('overwrites existing collection', () => {
    const adapter = createAdapter();
    adapter.writeCollection('items.json', [{ v: 1 }]);
    adapter.writeCollection('items.json', [{ v: 2 }]);
    const result = adapter.readCollection('items.json');
    assert.equal(result.length, 1);
    assert.equal(result[0].v, 2);
  });

  it('isolates collections by namespace', () => {
    const a = createSQLiteAdapter({ namespace: 'ns-a', dbPath });
    const b = createSQLiteAdapter({ namespace: 'ns-b', dbPath });
    a.writeCollection('data.json', [{ from: 'a' }]);
    b.writeCollection('data.json', [{ from: 'b' }]);
    assert.equal(a.readCollection('data.json')[0].from, 'a');
    assert.equal(b.readCollection('data.json')[0].from, 'b');
  });

  it('reads fallback when object does not exist', () => {
    const adapter = createAdapter();
    const result = adapter.readObject('config.json', { default: true });
    assert.deepEqual(result, { default: true });
  });

  it('writes and reads back an object', () => {
    const adapter = createAdapter();
    const config = { theme: 'dark' };
    adapter.writeObject('config.json', config);
    const result = adapter.readObject('config.json', {});
    assert.deepEqual(result, config);
  });

  it('overwrites existing object', () => {
    const adapter = createAdapter();
    adapter.writeObject('config.json', { version: 1 });
    adapter.writeObject('config.json', { version: 2 });
    const result = adapter.readObject('config.json', {});
    assert.equal(result.version, 2);
  });

  it('creates db file on disk', () => {
    createAdapter();
    assert.ok(existsSync(dbPath));
  });

  it('describeAdapter returns adapter metadata', () => {
    const adapter = createAdapter();
    const desc = adapter.describeAdapter();
    assert.equal(desc.kind, 'db');
    assert.equal(desc.namespace, 'test-ns');
  });

  it('ensureAdapterManifest creates manifest if missing', () => {
    const adapter = createAdapter();
    const manifest = adapter.ensureAdapterManifest();
    assert.equal(manifest.version, 1);
    assert.equal(manifest.adapterKind, 'db');
    assert.ok(manifest.initializedAt);
  });

  it('getMigrationPlan reports up to date', () => {
    const adapter = createAdapter();
    const plan = adapter.getMigrationPlan();
    assert.ok(plan.upToDate);
    assert.deepEqual(plan.pending, []);
  });
});
