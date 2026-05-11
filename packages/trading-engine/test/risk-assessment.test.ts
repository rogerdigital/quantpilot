import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { assessExecution, assessOrderBatch, assessPromotion } from '../src/risk/assessment.ts';

const rules = [
  { dimension: 'max_single_name_weight', limit: 0.1, mode: 'both', severity: 'blocker' },
  { dimension: 'max_drawdown', limit: 0.15, mode: 'live', severity: 'blocker' },
  { dimension: 'max_order_notional', limit: 100000, mode: 'live', severity: 'blocker' },
  { dimension: 'allowed_universe', limit: ['AAPL', 'MSFT'], mode: 'both', severity: 'blocker' },
  { dimension: 'max_turnover', limit: 0.5, mode: 'both', severity: 'warning' },
];

describe('risk assessment: promotion', () => {
  it('passes compliant promotion', () => {
    const result = assessPromotion({
      entityId: 'promo-1',
      portfolio: {
        positions: [{ symbol: 'AAPL', weight: 0.05 }],
        grossExposure: 0.5,
        netExposure: 0.3,
        leverage: 1.0,
        drawdownPct: 0.05,
        dailyLossPct: 0.01,
        turnoverPct: 0.2,
      },
      rules,
      mode: 'live',
    });
    assert.equal(result.passed, true);
    assert.equal(result.entityType, 'promotion');
    assert.equal(result.overallSeverity, 'pass');
  });

  it('blocks promotion with overweight position', () => {
    const result = assessPromotion({
      entityId: 'promo-2',
      portfolio: {
        positions: [{ symbol: 'AAPL', weight: 0.15 }],
        grossExposure: 0.5,
        netExposure: 0.3,
        leverage: 1.0,
        drawdownPct: 0.05,
        dailyLossPct: 0.01,
        turnoverPct: 0.2,
      },
      rules,
      mode: 'live',
    });
    assert.equal(result.passed, false);
    assert.equal(result.overallSeverity, 'blocker');
  });

  it('returns warning severity when only warnings present', () => {
    const result = assessPromotion({
      entityId: 'promo-3',
      portfolio: {
        positions: [{ symbol: 'AAPL', weight: 0.05 }],
        grossExposure: 0.5,
        netExposure: 0.3,
        leverage: 1.0,
        drawdownPct: 0.05,
        dailyLossPct: 0.01,
        turnoverPct: 0.6,
      },
      rules,
      mode: 'live',
    });
    assert.equal(result.passed, true);
    assert.equal(result.overallSeverity, 'warning');
  });

  it('result is immutable evidence with timestamp', () => {
    const result = assessPromotion({
      entityId: 'promo-4',
      portfolio: {
        positions: [],
        grossExposure: 0,
        netExposure: 0,
        leverage: 1.0,
        drawdownPct: 0,
        dailyLossPct: 0,
        turnoverPct: 0,
      },
      rules,
      mode: 'paper',
    });
    assert.ok(result.assessedAt);
    assert.equal(typeof result.assessedAt, 'string');
  });
});

describe('risk assessment: execution', () => {
  it('passes compliant execution plan', () => {
    const result = assessExecution({
      entityId: 'exec-1',
      orderPlan: {
        orders: [{ symbol: 'AAPL', notional: 50000, side: 'buy' }],
        tradingMode: 'live',
      },
      portfolio: {
        positions: [{ symbol: 'AAPL', weight: 0.05 }],
        grossExposure: 0.5,
        netExposure: 0.3,
        leverage: 1.0,
        drawdownPct: 0.05,
        dailyLossPct: 0.01,
        turnoverPct: 0.2,
      },
      rules,
    });
    assert.equal(result.passed, true);
  });

  it('blocks execution with oversized order', () => {
    const result = assessExecution({
      entityId: 'exec-2',
      orderPlan: {
        orders: [{ symbol: 'AAPL', notional: 200000, side: 'buy' }],
        tradingMode: 'live',
      },
      portfolio: {
        positions: [],
        grossExposure: 0.5,
        netExposure: 0.3,
        leverage: 1.0,
        drawdownPct: 0.05,
        dailyLossPct: 0.01,
        turnoverPct: 0.2,
      },
      rules,
    });
    assert.equal(result.passed, false);
    assert.ok(result.findings.some((f) => f.dimension === 'max_order_notional'));
  });

  it('combines portfolio and order violations', () => {
    const result = assessExecution({
      entityId: 'exec-3',
      orderPlan: {
        orders: [{ symbol: 'TSLA', notional: 200000, side: 'buy' }],
        tradingMode: 'live',
      },
      portfolio: {
        positions: [{ symbol: 'AAPL', weight: 0.15 }],
        grossExposure: 0.5,
        netExposure: 0.3,
        leverage: 1.0,
        drawdownPct: 0.05,
        dailyLossPct: 0.01,
        turnoverPct: 0.2,
      },
      rules,
    });
    assert.equal(result.passed, false);
    assert.ok(result.findings.length >= 2);
  });
});

describe('risk assessment: order batch', () => {
  it('passes compliant order batch', () => {
    const result = assessOrderBatch(
      'batch-1',
      { orders: [{ symbol: 'AAPL', notional: 50000, side: 'buy' }], tradingMode: 'live' },
      rules
    );
    assert.equal(result.passed, true);
    assert.equal(result.entityType, 'order_batch');
  });

  it('blocks order batch with disallowed symbol', () => {
    const result = assessOrderBatch(
      'batch-2',
      { orders: [{ symbol: 'TSLA', notional: 5000, side: 'buy' }], tradingMode: 'paper' },
      rules
    );
    assert.equal(result.passed, false);
  });
});
