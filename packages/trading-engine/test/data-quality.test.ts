import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  checkDuplicateTimestamps,
  checkExtremeReturnSpikes,
  checkMissingValues,
  checkSchemaMismatch,
  checkStaleData,
  checkSymbolCoverageDrop,
  checkTimestampMonotonicity,
  runAllQualityChecks,
} from '../src/data-quality/index.ts';

describe('checkMissingValues', () => {
  it('passes when no missing values', () => {
    const result = checkMissingValues({
      timestamps: ['2023-01-01', '2023-01-02'],
      values: { close: [100, 101] },
    });
    assert.equal(result.passed, true);
    assert.equal(result.severity, 'info');
  });

  it('fails when missing ratio exceeds threshold', () => {
    const result = checkMissingValues(
      {
        timestamps: ['2023-01-01', '2023-01-02', '2023-01-03'],
        values: { close: [100, null, null] },
      },
      0.5
    );
    assert.equal(result.passed, false);
    assert.equal(result.severity, 'warning');
  });

  it('handles empty data gracefully', () => {
    const result = checkMissingValues({ timestamps: [], values: {} });
    assert.equal(result.passed, true);
  });
});

describe('checkDuplicateTimestamps', () => {
  it('passes with unique timestamps', () => {
    const result = checkDuplicateTimestamps({
      timestamps: ['2023-01-01', '2023-01-02', '2023-01-03'],
      values: {},
    });
    assert.equal(result.passed, true);
  });

  it('fails with duplicate timestamps', () => {
    const result = checkDuplicateTimestamps({
      timestamps: ['2023-01-01', '2023-01-01', '2023-01-02'],
      values: {},
    });
    assert.equal(result.passed, false);
    assert.equal(result.value, 1);
  });
});

describe('checkTimestampMonotonicity', () => {
  it('passes with sorted timestamps', () => {
    const result = checkTimestampMonotonicity({
      timestamps: ['2023-01-01', '2023-01-02', '2023-01-03'],
      values: {},
    });
    assert.equal(result.passed, true);
    assert.equal(result.severity, 'info');
  });

  it('fails with out-of-order timestamps (blocker severity)', () => {
    const result = checkTimestampMonotonicity({
      timestamps: ['2023-01-02', '2023-01-01', '2023-01-03'],
      values: {},
    });
    assert.equal(result.passed, false);
    assert.equal(result.severity, 'blocker');
  });
});

describe('checkStaleData', () => {
  it('passes when data is fresh', () => {
    const result = checkStaleData(
      {
        timestamps: [],
        values: {},
        lastUpdatedAt: new Date().toISOString(),
      },
      86400
    );
    assert.equal(result.passed, true);
  });

  it('fails when data is stale', () => {
    const staleDate = new Date(Date.now() - 200000 * 1000).toISOString();
    const result = checkStaleData(
      {
        timestamps: [],
        values: {},
        lastUpdatedAt: staleDate,
      },
      86400
    );
    assert.equal(result.passed, false);
  });
});

describe('checkExtremeReturnSpikes', () => {
  it('passes with normal returns', () => {
    const result = checkExtremeReturnSpikes({
      timestamps: ['t1', 't2', 't3'],
      values: { close: [100, 102, 101] },
    });
    assert.equal(result.passed, true);
  });

  it('detects extreme spikes', () => {
    const result = checkExtremeReturnSpikes(
      {
        timestamps: ['t1', 't2', 't3'],
        values: { close: [100, 200, 95] },
      },
      0.5
    );
    assert.equal(result.passed, false);
    assert.ok(result.value! > 0);
  });
});

describe('checkSchemaMismatch', () => {
  it('passes when hashes match', () => {
    const result = checkSchemaMismatch({
      timestamps: [],
      values: {},
      schemaHash: 'abc123',
      expectedSchemaHash: 'abc123',
    });
    assert.equal(result.passed, true);
  });

  it('fails when hashes differ (blocker)', () => {
    const result = checkSchemaMismatch({
      timestamps: [],
      values: {},
      schemaHash: 'abc123',
      expectedSchemaHash: 'def456',
    });
    assert.equal(result.passed, false);
    assert.equal(result.severity, 'blocker');
  });
});

describe('checkSymbolCoverageDrop', () => {
  it('passes when coverage is within threshold', () => {
    const result = checkSymbolCoverageDrop(
      {
        timestamps: [],
        values: {},
        symbols: ['AAPL', 'MSFT', 'GOOGL'],
        expectedSymbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
      },
      0.3
    );
    assert.equal(result.passed, true);
  });

  it('fails when too many symbols missing', () => {
    const result = checkSymbolCoverageDrop(
      {
        timestamps: [],
        values: {},
        symbols: ['AAPL'],
        expectedSymbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
      },
      0.1
    );
    assert.equal(result.passed, false);
  });
});

describe('runAllQualityChecks', () => {
  it('runs all 7 checks and returns deterministic output', () => {
    const results = runAllQualityChecks({
      timestamps: ['2023-01-01', '2023-01-02', '2023-01-03'],
      values: { close: [100, 101, 102] },
      lastUpdatedAt: new Date().toISOString(),
      schemaHash: 'abc',
      expectedSchemaHash: 'abc',
      symbols: ['AAPL'],
      expectedSymbols: ['AAPL'],
    });
    assert.equal(results.length, 7);
    assert.ok(results.every((r) => typeof r.check === 'string'));
    assert.ok(results.every((r) => ['info', 'warning', 'blocker'].includes(r.severity)));
  });

  it('quality check output is deterministic for same input', () => {
    const input = {
      timestamps: ['2023-01-01', '2023-01-02'],
      values: { close: [100, 101] },
      lastUpdatedAt: '2023-01-02T12:00:00.000Z',
      staleThresholdSeconds: 999999999,
    };
    const r1 = runAllQualityChecks(input);
    const r2 = runAllQualityChecks(input);
    assert.deepEqual(
      r1.map((r) => ({ check: r.check, passed: r.passed })),
      r2.map((r) => ({ check: r.check, passed: r.passed }))
    );
  });
});
