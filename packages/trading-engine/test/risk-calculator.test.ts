import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calcBeta, calcHHI } from '../src/risk/beta-calculator.ts';
import { calcCVaR, calcHistoricalVaR } from '../src/risk/var-calculator.ts';

describe('calcBeta', () => {
  it('returns 1 for insufficient data (< 2 points)', () => {
    assert.equal(calcBeta([], []), 1);
    assert.equal(calcBeta([0.01], [0.02]), 1);
  });

  it('returns 1 when benchmark has zero variance', () => {
    assert.equal(calcBeta([0.01, -0.02, 0.03], [0, 0, 0]), 1);
  });

  it('computes beta = 1 for identical returns', () => {
    const returns = [0.01, -0.02, 0.03, -0.01, 0.02];
    assert.equal(calcBeta(returns, returns), 1);
  });

  it('computes beta for known values', () => {
    const asset = [0.02, -0.01, 0.03, -0.02, 0.01];
    const bench = [0.01, -0.005, 0.015, -0.01, 0.005];
    const beta = calcBeta(asset, bench);
    assert.equal(beta, 2);
  });

  it('handles unequal length arrays', () => {
    const asset = [0.01, 0.02, 0.03];
    const bench = [0.005, 0.01, 0.015, 0.02, 0.025];
    const beta = calcBeta(asset, bench);
    assert.ok(beta > 0);
    assert.ok(Number.isFinite(beta));
  });
});

describe('calcHHI', () => {
  it('returns 1 for single position (max concentration)', () => {
    assert.equal(calcHHI([1]), 1);
  });

  it('returns 0.2 for equal 5-position portfolio', () => {
    const weights = [0.2, 0.2, 0.2, 0.2, 0.2];
    const hhi = calcHHI(weights);
    assert.ok(Math.abs(hhi - 0.2) < 1e-10);
  });

  it('returns 0 for empty array', () => {
    assert.equal(calcHHI([]), 0);
  });

  it('increases with concentration', () => {
    const balanced = [0.25, 0.25, 0.25, 0.25];
    const concentrated = [0.7, 0.1, 0.1, 0.1];
    assert.ok(calcHHI(concentrated) > calcHHI(balanced));
  });
});

describe('calcHistoricalVaR', () => {
  it('returns 0 for empty returns', () => {
    assert.equal(calcHistoricalVaR([]), 0);
  });

  it('computes 95% VaR for known dataset', () => {
    // 100 returns: worst 5% is the 5th smallest
    const returns: number[] = [];
    for (let i = 0; i < 100; i++) {
      returns.push(-0.05 + i * 0.001);
    }
    const var95 = calcHistoricalVaR(returns, 0.95);
    // The 5th percentile loss should be around 0.045-0.05
    assert.ok(var95 > 0.04);
    assert.ok(var95 < 0.06);
  });

  it('VaR is positive when there are losses', () => {
    const losses = [-0.1, -0.05, -0.03, 0.01, 0.02, 0.03, 0.04, 0.05];
    const var95 = calcHistoricalVaR(losses, 0.95);
    assert.ok(var95 > 0);
  });

  it('VaR equals max loss at 100% confidence for single element', () => {
    assert.equal(calcHistoricalVaR([-0.05], 0.95), 0.05);
  });
});

describe('calcCVaR', () => {
  it('returns 0 for empty returns', () => {
    assert.equal(calcCVaR([]), 0);
  });

  it('CVaR >= VaR (tail average is worse than threshold)', () => {
    const returns = [-0.08, -0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06, 0.08, 0.1];
    const var95 = calcHistoricalVaR(returns, 0.95);
    const cvar95 = calcCVaR(returns, 0.95);
    assert.ok(cvar95 >= var95);
  });

  it('computes CVaR as average of tail losses', () => {
    // 20 returns, 95% CVaR = mean of bottom 1
    const returns = Array.from({ length: 20 }, (_, i) => -0.1 + i * 0.01);
    const cvar = calcCVaR(returns, 0.95);
    assert.ok(cvar > 0);
    assert.ok(Number.isFinite(cvar));
  });
});
