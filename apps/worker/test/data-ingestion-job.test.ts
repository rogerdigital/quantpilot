// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import { handleDataIngestionJob } from '../src/job-handlers/data-ingestion-job-handler.js';

test('handleDataIngestionJob succeeds with valid records and quality checks', async () => {
  const result = await handleDataIngestionJob({
    payload: {
      connectorId: 'conn-yahoo',
      datasetId: 'ds-sp500',
      versionId: 'v-20260501',
      records: [
        { symbol: 'AAPL', price: 180 },
        { symbol: 'MSFT', price: 420 },
      ],
      qualityChecks: [{ name: 'completeness', passed: true, detail: 'ok' }],
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.result.connectorId, 'conn-yahoo');
  assert.equal(result.result.recordCount, 2);
  assert.equal(result.result.qualityCheckPassed, true);
  assert.equal(result.result.activatedVersion, true);
});

test('handleDataIngestionJob does not activate on quality failure', async () => {
  const result = await handleDataIngestionJob({
    payload: {
      connectorId: 'conn-yahoo',
      datasetId: 'ds-sp500',
      versionId: 'v-bad',
      records: [{ symbol: 'AAPL' }],
      qualityChecks: [{ name: 'freshness', passed: false, detail: 'Data stale' }],
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.result.qualityCheckPassed, false);
  assert.equal(result.result.activatedVersion, false);
});

test('handleDataIngestionJob does not activate on empty records', async () => {
  const result = await handleDataIngestionJob({
    payload: {
      connectorId: 'conn-yahoo',
      datasetId: 'ds-sp500',
      versionId: 'v-empty',
      records: [],
      qualityChecks: [],
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.result.recordCount, 0);
  assert.equal(result.result.activatedVersion, false);
});

test('handleDataIngestionJob returns error on missing fields', async () => {
  const result = await handleDataIngestionJob({ payload: {} });
  assert.equal(result.ok, false);
  assert.ok(result.error.includes('Missing required'));
});

test('handleDataIngestionJob runs quality checks automatically', async () => {
  const result = await handleDataIngestionJob({
    payload: {
      connectorId: 'conn-1',
      datasetId: 'ds-1',
      versionId: 'v-1',
      records: [{ val: 1 }],
      qualityChecks: [
        { name: 'schema', passed: true, detail: 'ok' },
        { name: 'nulls', passed: false, detail: '5% null values' },
      ],
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.result.qualityCheckPassed, false);
  assert.ok(result.result.qualityIssues.some((i) => i.includes('nulls')));
});
