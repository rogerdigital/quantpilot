// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';

import { createFeatureRegistry } from '../src/feature-registry.ts';
import { createMemoryStore } from './helpers/memory-store.ts';

test('feature registry: register and list feature sets', () => {
  const store = createMemoryStore();
  const registry = createFeatureRegistry(store);

  registry.registerFeatureSet({
    id: 'fs-001',
    name: 'Momentum Features',
    description: 'Cross-sectional momentum signals',
    owner: 'researcher-01',
    activeVersionId: null,
    versions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
  });

  const sets = registry.listFeatureSets();
  assert.equal(sets.length, 1);
  assert.equal(sets[0].name, 'Momentum Features');
});

test('feature registry: create version with lineage linked to dataset versions', () => {
  const store = createMemoryStore();
  const registry = createFeatureRegistry(store);

  registry.createFeatureVersion({
    id: 'fv-001',
    featureSetId: 'fs-001',
    version: 1,
    formulaFingerprint: 'sha256:momentum_cross_sectional_v1',
    lineage: {
      sourceDatasetVersionIds: ['dsv-001', 'dsv-002'],
      transformationHash: 'transform-001',
      lookbackWindow: '20d',
      rebalanceCadence: 'weekly',
      leakagePreventionFlags: ['no_future_data'],
      leakageRisk: false,
    },
    columnCount: 10,
    rowCount: 50000,
    status: 'active',
    createdAt: new Date().toISOString(),
    metadata: {},
  });

  const versions = registry.listFeatureVersions('fs-001');
  assert.equal(versions.length, 1);
  assert.deepEqual(versions[0].lineage.sourceDatasetVersionIds, ['dsv-001', 'dsv-002']);
});

test('feature registry: compute lineage hash is deterministic', () => {
  const store = createMemoryStore();
  const registry = createFeatureRegistry(store);

  const lineage = {
    sourceDatasetVersionIds: ['dsv-002', 'dsv-001'],
    transformationHash: 'transform-001',
    lookbackWindow: '20d',
    rebalanceCadence: 'weekly',
    leakagePreventionFlags: [],
    leakageRisk: false,
  };

  const hash1 = registry.computeLineageHash(lineage);
  const hash2 = registry.computeLineageHash(lineage);
  assert.equal(hash1, hash2);

  // Order of sourceDatasetVersionIds should not matter (sorted internally)
  const lineageReordered = { ...lineage, sourceDatasetVersionIds: ['dsv-001', 'dsv-002'] };
  const hash3 = registry.computeLineageHash(lineageReordered);
  assert.equal(hash1, hash3);
});

test('feature registry: compare feature versions', () => {
  const store = createMemoryStore();
  const registry = createFeatureRegistry(store);

  registry.createFeatureVersion({
    id: 'fv-001',
    featureSetId: 'fs-001',
    version: 1,
    formulaFingerprint: 'fp-v1',
    lineage: {
      sourceDatasetVersionIds: ['dsv-001'],
      transformationHash: 't1',
      lookbackWindow: '20d',
      rebalanceCadence: 'weekly',
      leakagePreventionFlags: [],
      leakageRisk: false,
    },
    columnCount: 10,
    rowCount: 5000,
    status: 'active',
    createdAt: new Date().toISOString(),
    metadata: {},
  });

  registry.createFeatureVersion({
    id: 'fv-002',
    featureSetId: 'fs-001',
    version: 2,
    formulaFingerprint: 'fp-v2',
    lineage: {
      sourceDatasetVersionIds: ['dsv-001', 'dsv-002'],
      transformationHash: 't2',
      lookbackWindow: '20d',
      rebalanceCadence: 'weekly',
      leakagePreventionFlags: [],
      leakageRisk: false,
    },
    columnCount: 12,
    rowCount: 5000,
    status: 'active',
    createdAt: new Date().toISOString(),
    metadata: {},
  });

  const comparison = registry.compareFeatureVersions('fv-001', 'fv-002');
  assert.ok(comparison);
  assert.equal(comparison.sameLineageSources, false);
  assert.equal(comparison.sameTransformation, false);
  assert.equal(comparison.sameLookback, true);
  assert.equal(comparison.sameCadence, true);
  assert.equal(comparison.formulaChanged, true);
});

test('feature registry: feature version with leakage risk is flagged', () => {
  const store = createMemoryStore();
  const registry = createFeatureRegistry(store);

  registry.createFeatureVersion({
    id: 'fv-leaky',
    featureSetId: 'fs-001',
    version: 1,
    formulaFingerprint: 'fp-leaky',
    lineage: {
      sourceDatasetVersionIds: ['dsv-001'],
      transformationHash: 't-leaky',
      lookbackWindow: '0d',
      rebalanceCadence: 'daily',
      leakagePreventionFlags: [],
      leakageRisk: true,
    },
    columnCount: 5,
    rowCount: 1000,
    status: 'draft',
    createdAt: new Date().toISOString(),
    metadata: {},
  });

  const version = registry.getFeatureVersion('fv-leaky');
  assert.equal(version.lineage.leakageRisk, true);
});
