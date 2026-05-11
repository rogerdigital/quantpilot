import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calcCommission } from '../src/backtest/commission.ts';
import { calcSlippage } from '../src/backtest/slippage.ts';

describe('commission models comprehensive', () => {
  describe('fixed commission', () => {
    it('applies flat fee regardless of size', () => {
      const small = calcCommission(
        { quantity: 1, price: 10, side: 'buy' },
        { model: 'fixed', fixedAmount: 5 }
      );
      const large = calcCommission(
        { quantity: 10000, price: 100, side: 'sell' },
        { model: 'fixed', fixedAmount: 5 }
      );
      assert.equal(small.commission, 5);
      assert.equal(large.commission, 5);
    });

    it('respects min cap', () => {
      const result = calcCommission(
        { quantity: 1, price: 1, side: 'buy' },
        { model: 'fixed', fixedAmount: 0.5, minCommission: 1 }
      );
      assert.equal(result.commission, 1);
    });
  });

  describe('per-share commission', () => {
    it('scales with quantity not price', () => {
      const result = calcCommission(
        { quantity: 500, price: 200, side: 'buy' },
        { model: 'per_share', perShareAmount: 0.005 }
      );
      assert.equal(result.commission, 2.5);
    });

    it('applies min fee for small orders', () => {
      const result = calcCommission(
        { quantity: 10, price: 5, side: 'buy' },
        { model: 'per_share', perShareAmount: 0.005, minCommission: 1 }
      );
      assert.equal(result.commission, 1);
    });

    it('applies max cap for large orders', () => {
      const result = calcCommission(
        { quantity: 100_000, price: 100, side: 'sell' },
        { model: 'per_share', perShareAmount: 0.01, maxCommission: 50 }
      );
      assert.equal(result.commission, 50);
    });
  });

  describe('percentage commission', () => {
    it('scales with trade value', () => {
      const result = calcCommission(
        { quantity: 100, price: 50, side: 'buy' },
        { model: 'percentage', percentage: 0.001 }
      );
      assert.equal(result.commission, 5);
    });
  });

  describe('tiered commission', () => {
    it('small trade gets highest rate', () => {
      const result = calcCommission({ quantity: 100, price: 50, side: 'buy' }, { model: 'tiered' });
      // 5000 * 0.001 = 5
      assert.equal(result.commission, 5);
    });

    it('large trade gets lowest rate', () => {
      const result = calcCommission(
        { quantity: 20000, price: 100, side: 'buy' },
        { model: 'tiered' }
      );
      // 2M * 0.0005 = 1000
      assert.equal(result.commission, 1000);
    });
  });

  describe('bps commission', () => {
    it('calculates from basis points', () => {
      const result = calcCommission(
        { quantity: 1000, price: 100, side: 'buy' },
        { model: 'bps', bps: 3 }
      );
      // 100000 * 3/10000 = 30
      assert.ok(Math.abs(result.commission - 30) < 1e-10);
    });

    it('handles zero bps', () => {
      const result = calcCommission(
        { quantity: 100, price: 50, side: 'buy' },
        { model: 'bps', bps: 0 }
      );
      assert.equal(result.commission, 0);
    });
  });
});

describe('slippage models comprehensive', () => {
  describe('fixed slippage', () => {
    it('buy adds fixed percentage', () => {
      const result = calcSlippage(
        { price: 100, quantity: 100, side: 'buy' },
        { model: 'fixed', fixedPct: 0.002 }
      );
      assert.equal(result.executionPrice, 100.2);
      assert.equal(result.slippagePct, 0.002);
    });

    it('sell subtracts fixed percentage', () => {
      const result = calcSlippage(
        { price: 100, quantity: 100, side: 'sell' },
        { model: 'fixed', fixedPct: 0.002 }
      );
      assert.equal(result.executionPrice, 99.8);
    });
  });

  describe('volume slippage', () => {
    it('small order relative to volume has minimal impact', () => {
      const result = calcSlippage(
        { price: 100, quantity: 100, side: 'buy', volume: 10_000_000 },
        { model: 'volume', volumeImpact: 0.1 }
      );
      assert.ok(result.slippagePct < 0.0001);
    });

    it('large order relative to volume has significant impact', () => {
      const result = calcSlippage(
        { price: 100, quantity: 500_000, side: 'buy', volume: 1_000_000 },
        { model: 'volume', volumeImpact: 0.1 }
      );
      assert.ok(result.slippagePct > 0.01);
    });

    it('falls back to fixed on zero volume', () => {
      const result = calcSlippage(
        { price: 100, quantity: 100, side: 'buy', volume: 0 },
        { model: 'volume', volumeImpact: 0.1 }
      );
      assert.equal(result.slippagePct, 0.001);
    });
  });

  describe('spread slippage', () => {
    it('applies half-spread for buy', () => {
      const result = calcSlippage(
        { price: 100, quantity: 100, side: 'buy' },
        { model: 'spread', spreadBps: 10 }
      );
      // 10 bps = 0.1%, half = 0.05%
      const expected = 100 * (1 + 10 / 10_000 / 2);
      assert.ok(Math.abs(result.executionPrice - expected) < 0.0001);
    });

    it('applies half-spread for sell', () => {
      const result = calcSlippage(
        { price: 100, quantity: 100, side: 'sell' },
        { model: 'spread', spreadBps: 10 }
      );
      const expected = 100 * (1 - 10 / 10_000 / 2);
      assert.ok(Math.abs(result.executionPrice - expected) < 0.0001);
    });
  });

  describe('volatility-adjusted slippage', () => {
    it('multiplier scales impact', () => {
      const base = calcSlippage(
        { price: 100, quantity: 1000, side: 'buy', volume: 100_000, volatility: 0.2 },
        { model: 'volatility_adjusted', volatilityMultiplier: 1.0 }
      );
      const doubled = calcSlippage(
        { price: 100, quantity: 1000, side: 'buy', volume: 100_000, volatility: 0.2 },
        { model: 'volatility_adjusted', volatilityMultiplier: 2.0 }
      );
      assert.ok(Math.abs(doubled.slippagePct - base.slippagePct * 2) < 1e-10);
    });

    it('caps participation at 100%', () => {
      const result = calcSlippage(
        { price: 100, quantity: 200_000, side: 'buy', volume: 100_000, volatility: 0.2 },
        { model: 'volatility_adjusted', volatilityMultiplier: 1.0 }
      );
      const dailyVol = 0.2 / Math.sqrt(252);
      assert.ok(Math.abs(result.slippagePct - dailyVol) < 1e-10);
    });
  });
});
