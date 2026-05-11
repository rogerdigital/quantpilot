import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { checkOrderPlanAgainstPolicy, checkPortfolioAgainstPolicy } from '../src/risk/policy.ts';

describe('risk policy engine', () => {
  const baseRules = [
    { dimension: 'max_gross_exposure', limit: 1.0, mode: 'both', severity: 'blocker' },
    { dimension: 'max_net_exposure', limit: 0.5, mode: 'both', severity: 'blocker' },
    { dimension: 'max_single_name_weight', limit: 0.1, mode: 'both', severity: 'blocker' },
    { dimension: 'max_sector_exposure', limit: 0.3, mode: 'both', severity: 'warning' },
    { dimension: 'max_leverage', limit: 1.5, mode: 'both', severity: 'blocker' },
    { dimension: 'max_drawdown', limit: 0.15, mode: 'live', severity: 'blocker' },
    { dimension: 'max_daily_loss', limit: 0.03, mode: 'live', severity: 'blocker' },
    { dimension: 'max_turnover', limit: 0.5, mode: 'both', severity: 'warning' },
    { dimension: 'max_order_notional', limit: 100000, mode: 'live', severity: 'blocker' },
    {
      dimension: 'allowed_universe',
      limit: ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
      mode: 'both',
      severity: 'blocker',
    },
    { dimension: 'allowed_modes', limit: ['paper', 'live'], mode: 'both', severity: 'blocker' },
  ];

  it('passes compliant portfolio', () => {
    const result = checkPortfolioAgainstPolicy(
      {
        positions: [
          { symbol: 'AAPL', weight: 0.05, sector: 'tech' },
          { symbol: 'MSFT', weight: 0.08, sector: 'tech' },
        ],
        grossExposure: 0.8,
        netExposure: 0.3,
        leverage: 1.0,
        drawdownPct: 0.05,
        dailyLossPct: 0.01,
        turnoverPct: 0.2,
      },
      baseRules,
      'live'
    );
    assert.equal(result.passed, true);
    assert.equal(result.violations.length, 0);
  });

  it('blocks single-name overweight', () => {
    const result = checkPortfolioAgainstPolicy(
      {
        positions: [{ symbol: 'AAPL', weight: 0.15, sector: 'tech' }],
        grossExposure: 0.15,
        netExposure: 0.15,
        leverage: 1.0,
        drawdownPct: 0.0,
        dailyLossPct: 0.0,
        turnoverPct: 0.0,
      },
      baseRules,
      'live'
    );
    assert.equal(result.passed, false);
    assert.ok(result.violations.some((v) => v.dimension === 'max_single_name_weight'));
  });

  it('blocks excess leverage', () => {
    const result = checkPortfolioAgainstPolicy(
      {
        positions: [],
        grossExposure: 0.5,
        netExposure: 0.2,
        leverage: 2.0,
        drawdownPct: 0.0,
        dailyLossPct: 0.0,
        turnoverPct: 0.0,
      },
      baseRules,
      'paper'
    );
    assert.equal(result.passed, false);
    assert.ok(result.violations.some((v) => v.dimension === 'max_leverage'));
  });

  it('applies live-only rules only in live mode', () => {
    const result = checkPortfolioAgainstPolicy(
      {
        positions: [],
        grossExposure: 0.5,
        netExposure: 0.2,
        leverage: 1.0,
        drawdownPct: 0.2,
        dailyLossPct: 0.05,
        turnoverPct: 0.1,
      },
      baseRules,
      'paper'
    );
    assert.equal(result.passed, true);
  });

  it('blocks drawdown in live mode', () => {
    const result = checkPortfolioAgainstPolicy(
      {
        positions: [],
        grossExposure: 0.5,
        netExposure: 0.2,
        leverage: 1.0,
        drawdownPct: 0.2,
        dailyLossPct: 0.05,
        turnoverPct: 0.1,
      },
      baseRules,
      'live'
    );
    assert.equal(result.passed, false);
    assert.ok(result.violations.some((v) => v.dimension === 'max_drawdown'));
    assert.ok(result.violations.some((v) => v.dimension === 'max_daily_loss'));
  });

  it('warns on sector overexposure without blocking', () => {
    const result = checkPortfolioAgainstPolicy(
      {
        positions: [
          { symbol: 'AAPL', weight: 0.09, sector: 'tech' },
          { symbol: 'MSFT', weight: 0.09, sector: 'tech' },
          { symbol: 'GOOGL', weight: 0.09, sector: 'tech' },
          { symbol: 'AMZN', weight: 0.09, sector: 'tech' },
        ],
        grossExposure: 0.36,
        netExposure: 0.36,
        leverage: 1.0,
        drawdownPct: 0.0,
        dailyLossPct: 0.0,
        turnoverPct: 0.0,
      },
      baseRules,
      'live'
    );
    assert.equal(result.passed, true);
    assert.ok(
      result.violations.some(
        (v) => v.dimension === 'max_sector_exposure' && v.severity === 'warning'
      )
    );
  });

  it('blocks order notional in live mode', () => {
    const result = checkOrderPlanAgainstPolicy(
      {
        orders: [{ symbol: 'AAPL', notional: 150000, side: 'buy' }],
        tradingMode: 'live',
      },
      baseRules
    );
    assert.equal(result.passed, false);
    assert.ok(result.violations.some((v) => v.dimension === 'max_order_notional'));
  });

  it('passes order notional in paper mode (live-only rule)', () => {
    const result = checkOrderPlanAgainstPolicy(
      {
        orders: [{ symbol: 'AAPL', notional: 150000, side: 'buy' }],
        tradingMode: 'paper',
      },
      baseRules
    );
    assert.equal(result.passed, true);
  });

  it('blocks symbol not in allowed universe', () => {
    const result = checkOrderPlanAgainstPolicy(
      {
        orders: [{ symbol: 'TSLA', notional: 50000, side: 'buy' }],
        tradingMode: 'paper',
      },
      baseRules
    );
    assert.equal(result.passed, false);
    assert.ok(result.violations.some((v) => v.dimension === 'allowed_universe'));
  });

  it('passes symbols in allowed universe', () => {
    const result = checkOrderPlanAgainstPolicy(
      {
        orders: [
          { symbol: 'AAPL', notional: 50000, side: 'buy' },
          { symbol: 'MSFT', notional: 30000, side: 'sell' },
        ],
        tradingMode: 'paper',
      },
      baseRules
    );
    assert.equal(result.passed, true);
  });

  it('blocks disallowed trading mode', () => {
    const restrictedRules = [
      { dimension: 'allowed_modes', limit: ['paper'], mode: 'both', severity: 'blocker' },
    ];
    const result = checkOrderPlanAgainstPolicy(
      {
        orders: [{ symbol: 'AAPL', notional: 1000, side: 'buy' }],
        tradingMode: 'live',
      },
      restrictedRules
    );
    assert.equal(result.passed, false);
    assert.ok(result.violations.some((v) => v.dimension === 'allowed_modes'));
  });
});
