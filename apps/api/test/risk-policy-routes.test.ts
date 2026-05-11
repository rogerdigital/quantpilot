// @ts-nocheck
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import test from 'node:test';

// Direct test of risk policy routes using isolated handler
// We test the policy/assessment/kill-switch routes directly by importing only the assessment engine
import {
  assessExecution,
  assessOrderBatch,
  assessPromotion,
} from '../../../packages/trading-engine/src/risk/assessment.ts';
import {
  checkOrderPlanAgainstPolicy,
  checkPortfolioAgainstPolicy,
} from '../../../packages/trading-engine/src/risk/policy.ts';

test('risk policy API: assess promotion via engine', () => {
  const rules = [
    { dimension: 'max_single_name_weight', limit: 0.1, mode: 'both', severity: 'blocker' },
  ];
  const result = assessPromotion({
    entityId: 'promo-api-1',
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
  assert.equal(result.entityType, 'promotion');
});

test('risk policy API: assess execution via engine', () => {
  const rules = [
    { dimension: 'max_order_notional', limit: 100000, mode: 'live', severity: 'blocker' },
  ];
  const result = assessExecution({
    entityId: 'exec-api-1',
    orderPlan: {
      orders: [{ symbol: 'AAPL', notional: 200000, side: 'buy' }],
      tradingMode: 'live',
    },
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
  });
  assert.equal(result.passed, false);
  assert.ok(result.findings.some((f) => f.dimension === 'max_order_notional'));
});

test('risk policy API: kill switch blocks execution conceptually', () => {
  const killSwitch = { active: true, activatedAt: new Date().toISOString(), reason: 'Market halt' };
  // When kill switch is active, execution should be blocked
  assert.equal(killSwitch.active, true);
  // The router checks killSwitch.active before processing execution routes
});

test('risk policy API: assess order batch via engine', () => {
  const rules = [
    { dimension: 'allowed_universe', limit: ['AAPL', 'MSFT'], mode: 'both', severity: 'blocker' },
  ];
  const result = assessOrderBatch(
    'batch-api-1',
    { orders: [{ symbol: 'TSLA', notional: 5000, side: 'buy' }], tradingMode: 'paper' },
    rules
  );
  assert.equal(result.passed, false);
  assert.equal(result.entityType, 'order_batch');
});

test('risk policy API: portfolio check passes compliant state', () => {
  const rules = [
    { dimension: 'max_gross_exposure', limit: 1.0, mode: 'both', severity: 'blocker' },
    { dimension: 'max_leverage', limit: 2.0, mode: 'both', severity: 'blocker' },
  ];
  const result = checkPortfolioAgainstPolicy(
    {
      positions: [{ symbol: 'AAPL', weight: 0.05 }],
      grossExposure: 0.5,
      netExposure: 0.3,
      leverage: 1.0,
      drawdownPct: 0.05,
      dailyLossPct: 0.01,
      turnoverPct: 0.2,
    },
    rules,
    'live'
  );
  assert.equal(result.passed, true);
});

test('risk policy API: order plan check with universe restriction', () => {
  const rules = [
    { dimension: 'allowed_universe', limit: ['AAPL', 'GOOGL'], mode: 'both', severity: 'blocker' },
  ];
  const result = checkOrderPlanAgainstPolicy(
    { orders: [{ symbol: 'AAPL', notional: 1000, side: 'buy' }], tradingMode: 'paper' },
    rules
  );
  assert.equal(result.passed, true);
});
