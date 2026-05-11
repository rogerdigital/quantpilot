import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calcSectorAttribution,
  calcSignalAttribution,
  calcTurnoverAttribution,
} from '../src/backtest/attribution.ts';
import { calcRegimePerformance, classifyRegimes } from '../src/backtest/regime.ts';

describe('regime classification', () => {
  it('classifies bull market', () => {
    const dates = Array.from({ length: 63 }, (_, i) => `2023-01-${String(i + 1).padStart(2, '0')}`);
    // Positive trend with vol between 0.1 and 0.25 (sideways vol band)
    const returns = Array.from({ length: 63 }, (_, i) => 0.005 + (i % 2 === 0 ? 0.01 : -0.005));
    const result = classifyRegimes(dates, returns);
    const last = result[result.length - 1];
    assert.equal(last.regime, 'bull');
  });

  it('classifies bear market', () => {
    const dates = Array.from({ length: 63 }, (_, i) => `2023-01-${String(i + 1).padStart(2, '0')}`);
    // Negative trend with vol between 0.1 and 0.25
    const returns = Array.from({ length: 63 }, (_, i) => -0.005 + (i % 2 === 0 ? 0.005 : -0.01));
    const result = classifyRegimes(dates, returns);
    const last = result[result.length - 1];
    assert.equal(last.regime, 'bear');
  });

  it('classifies high volatility', () => {
    const dates = Array.from({ length: 63 }, (_, i) => `2023-01-${String(i + 1).padStart(2, '0')}`);
    const returns = Array.from({ length: 63 }, (_, i) => (i % 2 === 0 ? 0.03 : -0.03));
    const result = classifyRegimes(dates, returns);
    const last = result[result.length - 1];
    assert.equal(last.regime, 'high_vol');
  });

  it('classifies sideways market', () => {
    const dates = Array.from({ length: 63 }, (_, i) => `2023-01-${String(i + 1).padStart(2, '0')}`);
    // Returns that produce moderate vol (between 0.1 and 0.25 annualized) and near-zero trend
    const returns = Array.from({ length: 63 }, (_, i) => (i % 2 === 0 ? 0.008 : -0.008));
    const result = classifyRegimes(dates, returns);
    const last = result[result.length - 1];
    assert.equal(last.regime, 'sideways');
  });
});

describe('regime performance', () => {
  it('calculates performance per regime bucket', () => {
    const dates = Array.from(
      { length: 126 },
      (_, i) => `2023-01-${String(i + 1).padStart(2, '0')}`
    );
    const benchReturns = [
      ...Array.from({ length: 63 }, () => 0.005),
      ...Array.from({ length: 63 }, () => -0.005),
    ];
    const portfolioReturns = [
      ...Array.from({ length: 63 }, () => 0.006),
      ...Array.from({ length: 63 }, () => -0.004),
    ];

    const classifications = classifyRegimes(dates, benchReturns);
    const perf = calcRegimePerformance(portfolioReturns, classifications);

    assert.ok(perf.length > 0);
    for (const p of perf) {
      assert.ok(typeof p.annualizedReturn === 'number');
      assert.ok(typeof p.sharpe === 'number');
      assert.ok(typeof p.maxDrawdown === 'number');
      assert.ok(p.periodCount > 0);
    }
  });

  it('returns empty for no matching regime', () => {
    const perf = calcRegimePerformance([], []);
    assert.equal(perf.length, 0);
  });
});

describe('sector attribution', () => {
  it('attributes returns to sectors', () => {
    const holdings = [
      { sector: 'Technology', weight: 0.4, return: 0.12 },
      { sector: 'Finance', weight: 0.3, return: 0.05 },
      { sector: 'Healthcare', weight: 0.3, return: 0.08 },
    ];
    const result = calcSectorAttribution(holdings);
    assert.equal(result.length, 3);
    assert.equal(result[0].source, 'Technology');
    assert.ok(Math.abs(result[0].contribution - 0.048) < 1e-5);
    assert.equal(result[0].weight, 0.4);
  });
});

describe('signal attribution', () => {
  it('attributes returns to signals', () => {
    const signals = [
      { signal: 'momentum', weight: 0.5, return: 0.1 },
      { signal: 'value', weight: 0.3, return: 0.06 },
      { signal: 'quality', weight: 0.2, return: 0.04 },
    ];
    const result = calcSignalAttribution(signals);
    assert.equal(result.length, 3);
    assert.equal(result[0].source, 'momentum');
    assert.ok(Math.abs(result[0].contribution - 0.05) < 1e-5);
  });
});

describe('turnover attribution', () => {
  it('calculates average turnover across periods', () => {
    const periods = [
      { date: '2023-01-01', weights: [0.5, 0.3, 0.2] },
      { date: '2023-01-08', weights: [0.4, 0.4, 0.2] },
      { date: '2023-01-15', weights: [0.3, 0.3, 0.4] },
    ];
    const result = calcTurnoverAttribution(periods);
    assert.ok(result.avgTurnover > 0);
    assert.equal(result.turnoverByPeriod.length, 2);
  });

  it('returns zero turnover for single period', () => {
    const result = calcTurnoverAttribution([{ date: '2023-01-01', weights: [1.0] }]);
    assert.equal(result.avgTurnover, 0);
    assert.equal(result.turnoverByPeriod.length, 0);
  });

  it('calculates correct turnover for complete rebalance', () => {
    const periods = [
      { date: '2023-01-01', weights: [1.0, 0.0] },
      { date: '2023-01-08', weights: [0.0, 1.0] },
    ];
    const result = calcTurnoverAttribution(periods);
    assert.equal(result.avgTurnover, 1.0);
  });
});
