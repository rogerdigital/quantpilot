// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkHashMismatch,
  checkMissingMetadata,
  checkMissingPayload,
  checkOrphaned,
  checkPromotionMissingEvidence,
  checkStaleActiveDataset,
  computePayloadHash,
  runIntegrityChecks,
} from '../src/artifact-integrity.js';

test('computePayloadHash produces deterministic sha256', () => {
  const hash1 = computePayloadHash('hello world');
  const hash2 = computePayloadHash('hello world');
  assert.equal(hash1, hash2);
  assert.equal(hash1.length, 64);
});

test('checkMissingMetadata detects artifacts without metadata', () => {
  const artifacts = [
    {
      id: 'a1',
      type: 'report',
      metadata: null,
      payload: 'data',
      hash: null,
      createdAt: '2026-01-01',
    },
    {
      id: 'a2',
      type: 'report',
      metadata: { key: 'val' },
      payload: 'data',
      hash: null,
      createdAt: '2026-01-01',
    },
    {
      id: 'a3',
      type: 'report',
      metadata: {},
      payload: 'data',
      hash: null,
      createdAt: '2026-01-01',
    },
  ];
  const issues = checkMissingMetadata(artifacts);
  assert.equal(issues.length, 2);
  assert.equal(issues[0].check, 'missing_metadata');
  assert.equal(issues[0].severity, 'warning');
});

test('checkMissingPayload detects artifacts without payload', () => {
  const artifacts = [
    {
      id: 'a1',
      type: 'report',
      metadata: { k: 1 },
      payload: null,
      hash: null,
      createdAt: '2026-01-01',
    },
    {
      id: 'a2',
      type: 'report',
      metadata: { k: 1 },
      payload: 'content',
      hash: null,
      createdAt: '2026-01-01',
    },
  ];
  const issues = checkMissingPayload(artifacts);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].check, 'missing_payload');
  assert.equal(issues[0].severity, 'error');
});

test('checkHashMismatch detects corrupted payloads', () => {
  const correctHash = computePayloadHash('good-content');
  const artifacts = [
    {
      id: 'a1',
      type: 'r',
      metadata: {},
      payload: 'good-content',
      hash: correctHash,
      createdAt: '',
    },
    { id: 'a2', type: 'r', metadata: {}, payload: 'tampered', hash: correctHash, createdAt: '' },
    { id: 'a3', type: 'r', metadata: {}, payload: 'no-hash', hash: null, createdAt: '' },
  ];
  const issues = checkHashMismatch(artifacts);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].artifactId, 'a2');
  assert.equal(issues[0].check, 'hash_mismatch');
});

test('checkOrphaned detects artifacts with missing parent', () => {
  const artifacts = [
    { id: 'a1', type: 'r', metadata: {}, payload: 'x', hash: null, parentId: null, createdAt: '' },
    { id: 'a2', type: 'r', metadata: {}, payload: 'x', hash: null, parentId: 'a1', createdAt: '' },
    {
      id: 'a3',
      type: 'r',
      metadata: {},
      payload: 'x',
      hash: null,
      parentId: 'deleted-id',
      createdAt: '',
    },
  ];
  const issues = checkOrphaned(artifacts);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].artifactId, 'a3');
  assert.equal(issues[0].check, 'orphaned');
});

test('checkStaleActiveDataset detects old active versions', () => {
  const now = Date.now();
  const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString();
  const datasets = [
    { id: 'v1', datasetId: 'ds1', active: true, activatedAt: eightDaysAgo },
    { id: 'v2', datasetId: 'ds2', active: true, activatedAt: oneDayAgo },
    { id: 'v3', datasetId: 'ds3', active: false, activatedAt: eightDaysAgo },
  ];
  const issues = checkStaleActiveDataset(datasets);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].artifactId, 'v1');
  assert.equal(issues[0].check, 'stale_active_dataset');
});

test('checkPromotionMissingEvidence detects promotions without evidence', () => {
  const promotions = [
    { id: 'p1', strategyId: 's1', evidence: ['backtest-report-123'] },
    { id: 'p2', strategyId: 's2', evidence: [] },
    { id: 'p3', strategyId: 's3', evidence: null },
  ];
  const issues = checkPromotionMissingEvidence(promotions);
  assert.equal(issues.length, 2);
  assert.ok(issues.every((i) => i.check === 'promotion_missing_evidence'));
  assert.ok(issues.every((i) => i.severity === 'error'));
});

test('runIntegrityChecks aggregates all checks', () => {
  const correctHash = computePayloadHash('content');
  const artifacts = [
    { id: 'a1', type: 'r', metadata: null, payload: 'content', hash: correctHash, createdAt: '' },
    { id: 'a2', type: 'r', metadata: { k: 1 }, payload: null, hash: null, createdAt: '' },
  ];
  const report = runIntegrityChecks({ artifacts });
  assert.ok(report.checkedAt);
  assert.equal(report.totalArtifacts, 2);
  assert.ok(report.issues.length >= 2);
  assert.equal(report.healthy + report.unhealthy, report.totalArtifacts);
});

test('runIntegrityChecks reports zero issues for healthy set', () => {
  const hash = computePayloadHash('good');
  const artifacts = [
    { id: 'a1', type: 'r', metadata: { k: 1 }, payload: 'good', hash, createdAt: '' },
  ];
  const report = runIntegrityChecks({ artifacts });
  assert.equal(report.issues.length, 0);
  assert.equal(report.healthy, 1);
  assert.equal(report.unhealthy, 0);
});
