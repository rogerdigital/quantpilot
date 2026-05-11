import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calcCommission } from '../src/backtest/commission.ts';
import { calcSlippage } from '../src/backtest/slippage.ts';
import { computeSpecHash } from '../src/backtest/spec-hash.ts';

describe('backtest spec hash', () => {
  const baseInput = {
    strategyVersionId: 'strat-v1',
    datasetVersionId: 'ds-v3',
    featureVersionId: 'feat-v2',
    benchmark: 'SPX',
    timeRange: { start: '2020-01-01', end: '2023-12-31' },
    rebalanceCadence: 'weekly',
    costModel: { model: 'bps', bps: 5, label: 'Low cost' },
    slippageModel: { model: 'volume', volumeImpact: 0.1, label: 'Volume-based' },
    riskConstraints: {
      maxPositionWeight: 0.1,
      maxSectorExposure: 0.3,
      maxDrawdownLimit: 0.15,
      maxLeverage: 1.0,
    },
    universe: ['AAPL', 'MSFT', 'GOOGL'],
    initialCapital: 1_000_000,
    seed: 42,
  };

  it('produces deterministic hash', () => {
    const h1 = computeSpecHash(baseInput);
    const h2 = computeSpecHash(baseInput);
    assert.equal(h1, h2);
    assert.equal(h1.length, 16);
  });

  it('hash is stable regardless of universe order', () => {
    const reordered = { ...baseInput, universe: ['GOOGL', 'AAPL', 'MSFT'] };
    assert.equal(computeSpecHash(baseInput), computeSpecHash(reordered));
  });

  it('hash changes when spec field changes', () => {
    const altered = { ...baseInput, seed: 99 };
    assert.notEqual(computeSpecHash(baseInput), computeSpecHash(altered));
  });

  it('hash changes when cost model changes', () => {
    const altered = {
      ...baseInput,
      costModel: { model: 'fixed', fixedAmount: 1.0, label: 'Fixed' },
    };
    assert.notEqual(computeSpecHash(baseInput), computeSpecHash(altered));
  });

  it('hash is stable regardless of object key order', () => {
    const reorderedCost = { label: 'Low cost', bps: 5, model: 'bps' };
    const input2 = { ...baseInput, costModel: reorderedCost };
    assert.equal(computeSpecHash(baseInput), computeSpecHash(input2));
  });
});

describe('bps commission model', () => {
  it('calculates correct bps commission', () => {
    const result = calcCommission(
      { quantity: 100, price: 50, side: 'buy' },
      { model: 'bps', bps: 10 }
    );
    // 100 * 50 = 5000 trade value, 10 bps = 0.1% = 5.0
    assert.equal(result.commission, 5.0);
    assert.equal(result.commissionPct, 0.001);
  });

  it('applies min commission cap', () => {
    const result = calcCommission(
      { quantity: 1, price: 10, side: 'buy' },
      { model: 'bps', bps: 5, minCommission: 1.0 }
    );
    // 1 * 10 = 10 trade value, 5 bps = 0.005, min = 1.0
    assert.equal(result.commission, 1.0);
  });

  it('applies max commission cap', () => {
    const result = calcCommission(
      { quantity: 10000, price: 100, side: 'sell' },
      { model: 'bps', bps: 50, maxCommission: 100 }
    );
    // 10000 * 100 = 1M, 50 bps = 0.5% = 5000, max = 100
    assert.equal(result.commission, 100);
  });
});

describe('volatility-adjusted slippage model', () => {
  it('scales with volatility', () => {
    const lowVol = calcSlippage(
      { price: 100, quantity: 1000, side: 'buy', volume: 100_000, volatility: 0.1 },
      { model: 'volatility_adjusted', volatilityMultiplier: 1.0 }
    );
    const highVol = calcSlippage(
      { price: 100, quantity: 1000, side: 'buy', volume: 100_000, volatility: 0.4 },
      { model: 'volatility_adjusted', volatilityMultiplier: 1.0 }
    );
    assert.ok(highVol.slippagePct > lowVol.slippagePct);
  });

  it('scales with participation rate', () => {
    const smallOrder = calcSlippage(
      { price: 100, quantity: 100, side: 'buy', volume: 100_000, volatility: 0.2 },
      { model: 'volatility_adjusted', volatilityMultiplier: 1.0 }
    );
    const largeOrder = calcSlippage(
      { price: 100, quantity: 50_000, side: 'buy', volume: 100_000, volatility: 0.2 },
      { model: 'volatility_adjusted', volatilityMultiplier: 1.0 }
    );
    assert.ok(largeOrder.slippagePct > smallOrder.slippagePct);
  });

  it('buy slippage increases execution price', () => {
    const result = calcSlippage(
      { price: 100, quantity: 1000, side: 'buy', volume: 100_000, volatility: 0.2 },
      { model: 'volatility_adjusted', volatilityMultiplier: 1.0 }
    );
    assert.ok(result.executionPrice > 100);
  });

  it('sell slippage decreases execution price', () => {
    const result = calcSlippage(
      { price: 100, quantity: 1000, side: 'sell', volume: 100_000, volatility: 0.2 },
      { model: 'volatility_adjusted', volatilityMultiplier: 1.0 }
    );
    assert.ok(result.executionPrice < 100);
  });

  it('falls back to fixed model on zero volume', () => {
    const result = calcSlippage(
      { price: 100, quantity: 1000, side: 'buy', volume: 0, volatility: 0.2 },
      { model: 'volatility_adjusted', volatilityMultiplier: 1.0 }
    );
    assert.equal(result.slippagePct, 0.001);
  });
});
