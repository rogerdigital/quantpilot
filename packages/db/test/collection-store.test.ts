import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import { createCollectionStore } from '../src/collection-store.js';
import { ensureDirectory, readJsonFile, writeJsonFile } from '../src/filesystem.js';
import { createKeyValueStore } from '../src/kv-store.js';

describe('collection-store', () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), 'db-test-'));
  });

  function createStore() {
    const resolvePath = (filename: string) => join(rootDir, filename);
    return createCollectionStore({
      ensureRoot: () => ensureDirectory(rootDir),
      resolvePath,
      readJsonFile,
      writeJsonFile,
    });
  }

  it('reads empty collection when file does not exist', () => {
    const store = createStore();
    const result = store.readCollection('items.json');
    assert.deepEqual(result, []);
  });

  it('writes and reads back a collection', () => {
    const store = createStore();
    const items = [
      { id: 1, name: 'test' },
      { id: 2, name: 'other' },
    ];
    store.writeCollection('items.json', items);
    const result = store.readCollection('items.json');
    assert.deepEqual(result, items);
  });

  it('overwrites existing collection', () => {
    const store = createStore();
    store.writeCollection('items.json', [{ id: 1 }]);
    store.writeCollection('items.json', [{ id: 2 }, { id: 3 }]);
    const result = store.readCollection('items.json');
    assert.equal(result.length, 2);
    assert.equal(result[0].id, 2);
  });

  it('isolates collections by filename', () => {
    const store = createStore();
    store.writeCollection('a.json', [{ x: 1 }]);
    store.writeCollection('b.json', [{ y: 2 }]);
    assert.deepEqual(store.readCollection('a.json'), [{ x: 1 }]);
    assert.deepEqual(store.readCollection('b.json'), [{ y: 2 }]);
  });

  it('returns empty array for corrupted JSON', () => {
    const filePath = join(rootDir, 'bad.json');
    ensureDirectory(rootDir);
    writeFileSync(filePath, 'not-json');
    const store = createStore();
    const result = store.readCollection('bad.json');
    assert.deepEqual(result, []);
  });
});

describe('kv-store', () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), 'db-test-'));
  });

  function createStore() {
    const resolvePath = (filename: string) => join(rootDir, filename);
    return createKeyValueStore({
      ensureRoot: () => ensureDirectory(rootDir),
      resolvePath,
      readJsonFile,
      writeJsonFile,
    });
  }

  it('reads fallback when file does not exist', () => {
    const store = createStore();
    const result = store.readObject('config.json', { default: true });
    assert.deepEqual(result, { default: true });
  });

  it('writes and reads back an object', () => {
    const store = createStore();
    const config = { theme: 'dark', lang: 'en' };
    store.writeObject('config.json', config);
    const result = store.readObject('config.json', {});
    assert.deepEqual(result, config);
  });

  it('overwrites existing object', () => {
    const store = createStore();
    store.writeObject('config.json', { version: 1 });
    store.writeObject('config.json', { version: 2 });
    const result = store.readObject('config.json', {});
    assert.equal(result.version, 2);
  });

  it('isolates objects by filename', () => {
    const store = createStore();
    store.writeObject('a.json', { x: 1 });
    store.writeObject('b.json', { y: 2 });
    assert.deepEqual(store.readObject('a.json', {}), { x: 1 });
    assert.deepEqual(store.readObject('b.json', {}), { y: 2 });
  });

  it('returns fallback for corrupted JSON', () => {
    const filePath = join(rootDir, 'bad.json');
    ensureDirectory(rootDir);
    writeFileSync(filePath, 'not-json');
    const store = createStore();
    const result = store.readObject('bad.json', { fallback: true });
    assert.deepEqual(result, { fallback: true });
  });
});
