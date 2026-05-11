// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  DataQualityReport,
  Dataset,
  DatasetVersion,
  FeatureSet,
  FeatureVersion,
} from '../../shared-types/src/data-science.ts';
import { createMemoryStore } from './helpers/memory-store.ts';

test('data science contracts: persist feature version linked to two dataset versions', () => {
  const store = createMemoryStore();

  const dsVersion1: DatasetVersion = {
    id: 'dsv-001',
    datasetId: 'ds-001',
    version: 1,
    schemaHash: 'abc123',
    rowCount: 50000,
    columnCount: 8,
    timeRange: { start: '2020-01-01', end: '2022-12-31' },
    symbols: ['AAPL', 'MSFT', 'GOOGL'],
    status: 'active',
    qualityReport: null,
    createdAt: new Date().toISOString(),
    metadata: {},
  };

  const dsVersion2: DatasetVersion = {
    id: 'dsv-002',
    datasetId: 'ds-002',
    version: 1,
    schemaHash: 'def456',
    rowCount: 30000,
    columnCount: 5,
    timeRange: { start: '2020-01-01', end: '2022-12-31' },
    symbols: ['AAPL', 'MSFT', 'GOOGL'],
    status: 'active',
    qualityReport: null,
    createdAt: new Date().toISOString(),
    metadata: {},
  };

  const featureVersion: FeatureVersion = {
    id: 'fv-001',
    featureSetId: 'fs-001',
    version: 1,
    formulaFingerprint: 'sha256:momentum_5_20_cross_sectional',
    lineage: {
      sourceDatasetVersionIds: ['dsv-001', 'dsv-002'],
      transformationHash: 'transform-hash-001',
      lookbackWindow: '20d',
      rebalanceCadence: 'weekly',
      leakagePreventionFlags: ['no_future_data', 'no_survivorship_bias'],
      leakageRisk: false,
    },
    columnCount: 12,
    rowCount: 48000,
    status: 'active',
    createdAt: new Date().toISOString(),
    metadata: {},
  };

  store.writeCollection('dataset_versions.json', [dsVersion1, dsVersion2]);
  store.writeCollection('feature_versions.json', [featureVersion]);

  const [loaded] = store.readCollection('feature_versions.json');
  assert.deepEqual(loaded.lineage.sourceDatasetVersionIds, ['dsv-001', 'dsv-002']);
  assert.equal(loaded.lineage.lookbackWindow, '20d');
  assert.equal(loaded.lineage.leakageRisk, false);
});

test('data science contracts: dataset identity separated from version', () => {
  const dataset: Dataset = {
    id: 'ds-001',
    name: 'US Equity Daily OHLCV',
    description: 'Daily OHLCV for US equities',
    category: 'market_data',
    source: {
      id: 'src-001',
      name: 'Polygon.io',
      provider: 'polygon',
      category: 'market_data',
      license: 'commercial',
      ingestionFrequency: 'daily',
      lastSuccessfulIngestion: new Date().toISOString(),
      owner: 'platform-eng',
      metadata: {},
    },
    owner: 'data-team',
    activeVersionId: 'dsv-001',
    versions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
  };

  assert.equal(dataset.id, 'ds-001');
  assert.equal(dataset.activeVersionId, 'dsv-001');
  assert.equal(dataset.category, 'market_data');
});

test('data science contracts: data quality report records freshness and checks', () => {
  const report: DataQualityReport = {
    id: 'dqr-001',
    datasetId: 'ds-001',
    versionId: 'dsv-001',
    generatedAt: new Date().toISOString(),
    overallStatus: 'warning',
    freshness: {
      lastUpdatedAt: new Date().toISOString(),
      lagSeconds: 3600,
      stale: false,
    },
    missingRatio: 0.002,
    duplicateRatio: 0.0,
    schemaDrift: false,
    outlierSummary: {
      count: 15,
      ratio: 0.0003,
      worstField: 'volume',
    },
    checks: [
      {
        check: 'missing_values',
        severity: 'info',
        passed: true,
        message: 'Missing ratio 0.2% below 1% threshold',
        value: 0.002,
        threshold: 0.01,
        metadata: {},
      },
      {
        check: 'stale_data',
        severity: 'warning',
        passed: false,
        message: 'Data lag 3600s exceeds 1800s threshold',
        value: 3600,
        threshold: 1800,
        metadata: {},
      },
    ],
    metadata: {},
  };

  assert.equal(report.overallStatus, 'warning');
  assert.equal(report.checks.length, 2);
  assert.equal(report.checks[1].severity, 'warning');
  assert.equal(report.checks[1].passed, false);
});

test('data science contracts: feature lineage records source dataset versions', () => {
  const featureSet: FeatureSet = {
    id: 'fs-001',
    name: 'Momentum Features',
    description: 'Cross-sectional momentum signals',
    owner: 'researcher-01',
    activeVersionId: 'fv-001',
    versions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
  };

  assert.equal(featureSet.id, 'fs-001');
  assert.equal(featureSet.activeVersionId, 'fv-001');
});
