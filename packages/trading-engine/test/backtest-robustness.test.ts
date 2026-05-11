import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assessRobustness,
  detectDrawdownClusters,
  runParameterSensitivity,
  runWalkForwardAnalysis,
} from '../src/backtest/robustness.ts';

function makeEquityCurve(days: number, dailyReturn: number, noise: number = 0) {
  let equity = 100_000;
  return Array.from({ length: days }, (_, i) => {
    const r = dailyReturn + (noise > 0 ? (Math.random() - 0.5) * noise : 0);
    equity *= 1 + r;
    return { date: `2023-01-${String(i + 1).padStart(2, '0')}`, equity };
  });
}

describe('parameter sensitivity', () => {
  it('returns sensitivity for each parameter', () => {
    const curve = makeEquityCurve(252, 0.001);
    const params = [
      { name: 'lookback', value: 20, range: [10, 40] as [number, number] },
      { name: 'threshold', value: 0.5, range: [0.3, 0.7] as [number, number] },
    ];
    const result = runParameterSensitivity(curve, params);
    assert.equal(result.length, 2);
    assert.equal(result[0].parameter, 'lookback');
    assert.ok(result[0].sharpeRange[0] <= result[0].sharpeRange[1]);
  });
});

describe('walk-forward analysis', () => {
  it('splits equity curve into windows and computes sharpe', () => {
    const curve = makeEquityCurve(252, 0.001);
    const sharpes = runWalkForwardAnalysis(curve, 4);
    assert.equal(sharpes.length, 4);
    for (const s of sharpes) {
      assert.ok(typeof s === 'number');
    }
  });

  it('returns empty for insufficient data', () => {
    const curve = makeEquityCurve(5, 0.001);
    const sharpes = runWalkForwardAnalysis(curve, 4);
    assert.equal(sharpes.length, 0);
  });
});

describe('drawdown cluster detection', () => {
  it('detects no clusters in monotonically rising equity', () => {
    const curve = makeEquityCurve(100, 0.005);
    const clusters = detectDrawdownClusters(curve);
    assert.equal(clusters, 0);
  });

  it('detects clusters from drawdown events', () => {
    let equity = 100_000;
    const curve = [];
    for (let i = 0; i < 300; i++) {
      if (i >= 50 && i < 60) equity *= 0.98;
      else if (i >= 150 && i < 160) equity *= 0.98;
      else equity *= 1.005;
      curve.push({ date: `d-${i}`, equity });
    }
    const clusters = detectDrawdownClusters(curve);
    assert.ok(clusters >= 2);
  });
});

describe('assessRobustness', () => {
  it('flags high overfit risk when OOS sharpe collapses', () => {
    // In-sample: strong uptrend with some noise to get positive sharpe
    let equity = 100_000;
    const inSample = Array.from({ length: 126 }, (_, i) => {
      equity *= 1 + 0.003 + (i % 3 === 0 ? -0.001 : 0.0005);
      return { date: `is-${i}`, equity };
    });
    const lastEquity = inSample[inSample.length - 1].equity;
    // OOS: steady decline
    const oos = Array.from({ length: 126 }, (_, i) => ({
      date: `oos-${i}`,
      equity: lastEquity * (1 - i * 0.002),
    }));
    const curve = [...inSample, ...oos];

    const report = assessRobustness({
      equityCurve: curve,
      parameters: [{ name: 'window', value: 20, range: [10, 40] }],
      trainEndIndex: 126,
    });

    assert.ok(report.inSampleSharpe > 0);
    assert.ok(report.outOfSampleSharpe < report.inSampleSharpe);
    assert.ok(report.overfitRisk === 'medium' || report.overfitRisk === 'high');
  });

  it('reports low overfit risk when IS and OOS are consistent', () => {
    // Consistent positive returns with variance throughout
    let equity = 100_000;
    const curve = Array.from({ length: 252 }, (_, i) => {
      equity *= 1 + 0.001 + (i % 3 === 0 ? -0.0005 : 0.0003);
      return { date: `d-${i}`, equity };
    });
    const report = assessRobustness({
      equityCurve: curve,
      parameters: [{ name: 'window', value: 20, range: [10, 40] }],
      trainEndIndex: 126,
    });
    assert.equal(report.overfitRisk, 'low');
  });

  it('detects low trade count', () => {
    const curve = makeEquityCurve(10, 0.001);
    const report = assessRobustness({
      equityCurve: curve,
      parameters: [],
      trainEndIndex: 5,
      minTradeCount: 30,
    });
    assert.equal(report.lowTradeCount, true);
  });

  it('includes all report fields', () => {
    const curve = makeEquityCurve(252, 0.001);
    const report = assessRobustness({
      equityCurve: curve,
      parameters: [{ name: 'p1', value: 1, range: [0, 2] }],
      trainEndIndex: 126,
    });
    assert.ok(Array.isArray(report.parameterSensitivity));
    assert.ok(Array.isArray(report.walkForwardSharpe));
    assert.ok(typeof report.inSampleSharpe === 'number');
    assert.ok(typeof report.outOfSampleSharpe === 'number');
    assert.ok(typeof report.drawdownClusters === 'number');
    assert.ok(typeof report.turnoverExplosion === 'boolean');
    assert.ok(typeof report.lowTradeCount === 'boolean');
    assert.ok(['low', 'medium', 'high'].includes(report.overfitRisk));
  });
});
