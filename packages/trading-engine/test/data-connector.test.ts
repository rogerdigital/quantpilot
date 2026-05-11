// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDataIngestionResult,
  runDataQualityChecks,
  shouldActivateVersion,
} from '../src/connectors/data-connector.js';

test('runDataQualityChecks passes when all checks pass', () => {
  const checks = [
    { name: 'completeness', passed: true, detail: 'All fields present' },
    { name: 'freshness', passed: true, detail: 'Data within 24h' },
  ];
  const result = runDataQualityChecks([{ price: 100 }], checks);
  assert.equal(result.passed, true);
  assert.equal(result.issues.length, 0);
});

test('runDataQualityChecks fails when a check fails', () => {
  const checks = [
    { name: 'completeness', passed: true, detail: 'ok' },
    { name: 'freshness', passed: false, detail: 'Data is 3 days old' },
  ];
  const result = runDataQualityChecks([{ price: 100 }], checks);
  assert.equal(result.passed, false);
  assert.equal(result.issues.length, 1);
  assert.ok(result.issues[0].includes('freshness'));
});

test('runDataQualityChecks fails on empty records', () => {
  const checks = [{ name: 'format', passed: true, detail: 'ok' }];
  const result = runDataQualityChecks([], checks);
  assert.equal(result.passed, false);
  assert.ok(result.issues[0].includes('empty_dataset'));
});

test('createDataIngestionResult emits dataset version', () => {
  const result = createDataIngestionResult({
    connectorId: 'conn-yahoo',
    datasetId: 'ds-sp500',
    versionId: 'v-20260501',
    records: [
      { symbol: 'AAPL', price: 180 },
      { symbol: 'MSFT', price: 420 },
    ],
    qualityChecks: [{ name: 'completeness', passed: true, detail: 'ok' }],
  });
  assert.equal(result.connectorId, 'conn-yahoo');
  assert.equal(result.datasetId, 'ds-sp500');
  assert.equal(result.versionId, 'v-20260501');
  assert.equal(result.recordCount, 2);
  assert.equal(result.qualityCheckPassed, true);
  assert.equal(result.activatedVersion, true);
});

test('failed ingestion does not activate version', () => {
  const result = createDataIngestionResult({
    connectorId: 'conn-yahoo',
    datasetId: 'ds-sp500',
    versionId: 'v-bad',
    records: [{ symbol: 'AAPL' }],
    qualityChecks: [{ name: 'freshness', passed: false, detail: 'stale data' }],
  });
  assert.equal(result.qualityCheckPassed, false);
  assert.equal(result.activatedVersion, false);
  assert.ok(result.qualityIssues.length > 0);
});

test('shouldActivateVersion returns false on quality failure', () => {
  assert.equal(
    shouldActivateVersion({
      connectorId: 'c',
      datasetId: 'd',
      versionId: 'v',
      recordCount: 10,
      qualityCheckPassed: false,
      qualityIssues: ['stale'],
      activatedVersion: false,
      timestamp: '',
    }),
    false
  );
});

test('shouldActivateVersion returns false on zero records', () => {
  assert.equal(
    shouldActivateVersion({
      connectorId: 'c',
      datasetId: 'd',
      versionId: 'v',
      recordCount: 0,
      qualityCheckPassed: true,
      qualityIssues: [],
      activatedVersion: false,
      timestamp: '',
    }),
    false
  );
});

test('shouldActivateVersion returns true on pass with records', () => {
  assert.equal(
    shouldActivateVersion({
      connectorId: 'c',
      datasetId: 'd',
      versionId: 'v',
      recordCount: 50,
      qualityCheckPassed: true,
      qualityIssues: [],
      activatedVersion: true,
      timestamp: '',
    }),
    true
  );
});
