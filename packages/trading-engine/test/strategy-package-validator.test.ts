// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDefaultManifest,
  getDangerousPermissions,
  getRequestedPermissions,
  hasLiveExecutionByDefault,
  validateStrategyPackage,
} from '../src/strategy/package-validator.js';

test('valid package passes validation', () => {
  const manifest = createDefaultManifest({
    name: 'momentum-alpha',
    version: '1.0.0',
    owner: 'quant-desk',
    supportedMarkets: ['US_EQUITIES'],
    requiredDatasets: ['sp500_daily'],
  });
  const result = validateStrategyPackage(manifest);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('missing name fails validation', () => {
  const manifest = createDefaultManifest({
    version: '1.0.0',
    owner: 'quant-desk',
    supportedMarkets: ['US_EQUITIES'],
  });
  const result = validateStrategyPackage(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('name')));
});

test('invalid semver fails validation', () => {
  const manifest = createDefaultManifest({
    name: 'test',
    version: 'abc',
    owner: 'quant-desk',
    supportedMarkets: ['US_EQUITIES'],
  });
  const result = validateStrategyPackage(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('semver')));
});

test('no supported markets fails validation', () => {
  const manifest = createDefaultManifest({
    name: 'test',
    version: '1.0.0',
    owner: 'quant-desk',
    supportedMarkets: [],
  });
  const result = validateStrategyPackage(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('market')));
});

test('package requesting live:execute is rejected', () => {
  const manifest = createDefaultManifest({
    name: 'aggressive-strategy',
    version: '1.0.0',
    owner: 'quant-desk',
    supportedMarkets: ['US_EQUITIES'],
    permissionsRequested: ['research:read', 'backtest:run', 'live:execute'],
  });
  const result = validateStrategyPackage(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('live:execute')));
});

test('max leverage over 5x fails', () => {
  const manifest = createDefaultManifest({
    name: 'leveraged',
    version: '1.0.0',
    owner: 'desk',
    supportedMarkets: ['US_EQUITIES'],
    riskRequirements: {
      maxDrawdownPct: 20,
      maxPositionPct: 10,
      maxLeverage: 10,
      requiresKillSwitch: true,
    },
  });
  const result = validateStrategyPackage(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('leverage')));
});

test('max drawdown over 50% fails', () => {
  const manifest = createDefaultManifest({
    name: 'risky',
    version: '1.0.0',
    owner: 'desk',
    supportedMarkets: ['US_EQUITIES'],
    riskRequirements: {
      maxDrawdownPct: 60,
      maxPositionPct: 10,
      maxLeverage: 1,
      requiresKillSwitch: true,
    },
  });
  const result = validateStrategyPackage(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('drawdown')));
});

test('low minimum history generates warning', () => {
  const manifest = createDefaultManifest({
    name: 'short-history',
    version: '1.0.0',
    owner: 'desk',
    supportedMarkets: ['US_EQUITIES'],
    backtestSpecs: {
      minHistoryMonths: 3,
      requiredMetrics: ['sharpe'],
      minimumSharpe: 1.0,
      outOfSamplePct: 30,
    },
  });
  const result = validateStrategyPackage(manifest);
  assert.ok(result.warnings.some((w) => w.includes('history')));
});

test('hasLiveExecutionByDefault detects live:execute', () => {
  const manifest = createDefaultManifest({
    permissionsRequested: ['research:read', 'live:execute'],
  });
  assert.equal(hasLiveExecutionByDefault(manifest), true);

  const safe = createDefaultManifest({
    permissionsRequested: ['research:read', 'backtest:run'],
  });
  assert.equal(hasLiveExecutionByDefault(safe), false);
});

test('getRequestedPermissions returns permissions list', () => {
  const manifest = createDefaultManifest({
    permissionsRequested: ['research:read', 'backtest:run', 'paper:execute'],
  });
  const perms = getRequestedPermissions(manifest);
  assert.equal(perms.length, 3);
  assert.ok(perms.includes('paper:execute'));
});

test('getDangerousPermissions identifies live:execute', () => {
  const manifest = createDefaultManifest({
    permissionsRequested: ['research:read', 'live:execute'],
  });
  const dangerous = getDangerousPermissions(manifest);
  assert.equal(dangerous.length, 1);
  assert.equal(dangerous[0], 'live:execute');
});

test('no datasets warning does not block validation', () => {
  const manifest = createDefaultManifest({
    name: 'no-deps',
    version: '1.0.0',
    owner: 'desk',
    supportedMarkets: ['US_EQUITIES'],
    requiredDatasets: [],
  });
  const result = validateStrategyPackage(manifest);
  assert.equal(result.valid, true);
  assert.ok(result.warnings.some((w) => w.includes('datasets')));
});
