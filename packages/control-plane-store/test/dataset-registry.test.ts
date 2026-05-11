// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';

import { createDatasetRegistry } from '../src/dataset-registry.ts';
import { createMemoryStore } from './helpers/memory-store.ts';

test('dataset registry: register and list datasets', () => {
  const store = createMemoryStore();
  const registry = createDatasetRegistry(store);

  registry.registerDataset({
    id: 'ds-001',
    name: 'US Equity Daily',
    description: 'Daily OHLCV',
    category: 'market_data',
    source: {
      id: 'src-001',
      name: 'Polygon',
      provider: 'polygon',
      category: 'market_data',
      license: 'commercial',
      ingestionFrequency: 'daily',
      lastSuccessfulIngestion: new Date().toISOString(),
      owner: 'data-team',
      metadata: {},
    },
    owner: 'data-team',
    activeVersionId: null,
    versions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
  });

  const datasets = registry.listDatasets();
  assert.equal(datasets.length, 1);
  assert.equal(datasets[0].name, 'US Equity Daily');
});

test('dataset registry: create version and mark active', () => {
  const store = createMemoryStore();
  const registry = createDatasetRegistry(store);

  registry.registerDataset({
    id: 'ds-001',
    name: 'Test',
    description: '',
    category: 'market_data',
    source: {
      id: 's',
      name: 's',
      provider: 'p',
      category: 'market_data',
      license: 'mit',
      ingestionFrequency: 'daily',
      lastSuccessfulIngestion: new Date().toISOString(),
      owner: 'o',
      metadata: {},
    },
    owner: 'o',
    activeVersionId: null,
    versions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
  });

  registry.createDatasetVersion({
    id: 'dsv-001',
    datasetId: 'ds-001',
    version: 1,
    schemaHash: 'hash1',
    rowCount: 1000,
    columnCount: 5,
    timeRange: { start: '2020-01-01', end: '2023-01-01' },
    symbols: ['AAPL'],
    status: 'draft',
    qualityReport: null,
    createdAt: new Date().toISOString(),
    metadata: {},
  });

  registry.markVersionActive('ds-001', 'dsv-001');

  const ds = registry.getDataset('ds-001');
  assert.equal(ds.activeVersionId, 'dsv-001');

  const versions = registry.listDatasetVersions('ds-001');
  assert.equal(versions[0].status, 'active');
});

test('dataset registry: attach quality report to version', () => {
  const store = createMemoryStore();
  const registry = createDatasetRegistry(store);

  registry.registerDataset({
    id: 'ds-001',
    name: 'T',
    description: '',
    category: 'market_data',
    source: {
      id: 's',
      name: 's',
      provider: 'p',
      category: 'market_data',
      license: 'mit',
      ingestionFrequency: 'daily',
      lastSuccessfulIngestion: new Date().toISOString(),
      owner: 'o',
      metadata: {},
    },
    owner: 'o',
    activeVersionId: null,
    versions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
  });

  registry.createDatasetVersion({
    id: 'dsv-001',
    datasetId: 'ds-001',
    version: 1,
    schemaHash: 'h',
    rowCount: 100,
    columnCount: 3,
    timeRange: { start: '2020-01-01', end: '2023-01-01' },
    symbols: [],
    status: 'active',
    qualityReport: null,
    createdAt: new Date().toISOString(),
    metadata: {},
  });

  registry.attachQualityReport({
    id: 'dqr-001',
    datasetId: 'ds-001',
    versionId: 'dsv-001',
    generatedAt: new Date().toISOString(),
    overallStatus: 'pass',
    freshness: { lastUpdatedAt: new Date().toISOString(), lagSeconds: 60, stale: false },
    missingRatio: 0.001,
    duplicateRatio: 0,
    schemaDrift: false,
    outlierSummary: { count: 0, ratio: 0, worstField: '' },
    checks: [],
    metadata: {},
  });

  const report = registry.getQualityReport('dsv-001');
  assert.equal(report.overallStatus, 'pass');
});

test('dataset registry: list stale datasets', () => {
  const store = createMemoryStore();
  const registry = createDatasetRegistry(store);

  const staleDate = new Date(Date.now() - 200000 * 1000).toISOString();
  registry.registerDataset({
    id: 'ds-stale',
    name: 'Stale',
    description: '',
    category: 'fundamental',
    source: {
      id: 's',
      name: 's',
      provider: 'p',
      category: 'fundamental',
      license: 'mit',
      ingestionFrequency: 'daily',
      lastSuccessfulIngestion: staleDate,
      owner: 'o',
      metadata: {},
    },
    owner: 'o',
    activeVersionId: null,
    versions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
  });

  registry.registerDataset({
    id: 'ds-fresh',
    name: 'Fresh',
    description: '',
    category: 'market_data',
    source: {
      id: 's2',
      name: 's2',
      provider: 'p',
      category: 'market_data',
      license: 'mit',
      ingestionFrequency: 'daily',
      lastSuccessfulIngestion: new Date().toISOString(),
      owner: 'o',
      metadata: {},
    },
    owner: 'o',
    activeVersionId: null,
    versions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
  });

  const stale = registry.listStaleDatasets(86400);
  assert.equal(stale.length, 1);
  assert.equal(stale[0].id, 'ds-stale');
});
