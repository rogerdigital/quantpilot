// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canApprovePromotion,
  canManageRisk,
  evaluatePermissions,
  getPermissionPolicy,
  getRolePermissions,
  isActionAllowed,
  listAllActions,
} from '../src/permission-policy.js';

test('listAllActions returns all 9 institutional permissions', () => {
  const actions = listAllActions();
  assert.equal(actions.length, 9);
  assert.ok(actions.includes('research:read'));
  assert.ok(actions.includes('research:modify'));
  assert.ok(actions.includes('backtest:run'));
  assert.ok(actions.includes('promotion:approve_paper'));
  assert.ok(actions.includes('promotion:approve_live'));
  assert.ok(actions.includes('risk:edit_policy'));
  assert.ok(actions.includes('risk:kill_switch'));
  assert.ok(actions.includes('broker:manage_credentials'));
  assert.ok(actions.includes('audit:export_report'));
});

test('owner role has full permissions', () => {
  const policy = getPermissionPolicy('owner');
  assert.equal(policy.role, 'owner');
  assert.equal(policy.grants.filter((g) => g.granted).length, 9);
  assert.equal(policy.grants.filter((g) => !g.granted).length, 0);
});

test('viewer role has only research:read', () => {
  const policy = getPermissionPolicy('viewer');
  const granted = policy.grants.filter((g) => g.granted);
  assert.equal(granted.length, 1);
  assert.equal(granted[0].action, 'research:read');
});

test('researcher can read, modify research and run backtests', () => {
  const permissions = getRolePermissions('researcher');
  assert.equal(permissions.length, 3);
  assert.ok(permissions.includes('research:read'));
  assert.ok(permissions.includes('research:modify'));
  assert.ok(permissions.includes('backtest:run'));
});

test('researcher cannot approve promotions or manage risk', () => {
  assert.equal(isActionAllowed('researcher', 'promotion:approve_paper'), false);
  assert.equal(isActionAllowed('researcher', 'promotion:approve_live'), false);
  assert.equal(isActionAllowed('researcher', 'risk:edit_policy'), false);
  assert.equal(isActionAllowed('researcher', 'risk:kill_switch'), false);
});

test('risk_officer can approve paper but not live', () => {
  assert.equal(isActionAllowed('risk_officer', 'promotion:approve_paper'), true);
  assert.equal(isActionAllowed('risk_officer', 'promotion:approve_live'), false);
});

test('portfolio_manager can approve both paper and live', () => {
  assert.equal(canApprovePromotion('portfolio_manager', 'paper'), true);
  assert.equal(canApprovePromotion('portfolio_manager', 'live'), true);
});

test('operator cannot approve any promotion', () => {
  assert.equal(canApprovePromotion('operator', 'paper'), false);
  assert.equal(canApprovePromotion('operator', 'live'), false);
});

test('canManageRisk returns true for risk_officer and admin', () => {
  assert.equal(canManageRisk('risk_officer'), true);
  assert.equal(canManageRisk('admin'), true);
  assert.equal(canManageRisk('researcher'), false);
  assert.equal(canManageRisk('viewer'), false);
});

test('evaluatePermissions splits requested actions into allowed and denied', () => {
  const result = evaluatePermissions('researcher', [
    'research:read',
    'research:modify',
    'promotion:approve_live',
    'risk:kill_switch',
  ]);
  assert.equal(result.allowed.length, 2);
  assert.equal(result.denied.length, 2);
  assert.ok(result.allowed.some((g) => g.action === 'research:read'));
  assert.ok(result.allowed.some((g) => g.action === 'research:modify'));
  assert.ok(result.denied.some((g) => g.action === 'promotion:approve_live'));
  assert.ok(result.denied.some((g) => g.action === 'risk:kill_switch'));
});

test('operator can manage broker credentials', () => {
  assert.equal(isActionAllowed('operator', 'broker:manage_credentials'), true);
  assert.equal(isActionAllowed('researcher', 'broker:manage_credentials'), false);
});

test('operator can export audit reports', () => {
  assert.equal(isActionAllowed('operator', 'audit:export_report'), true);
  assert.equal(isActionAllowed('viewer', 'audit:export_report'), false);
});

test('denied grants include a descriptive reason', () => {
  const policy = getPermissionPolicy('viewer');
  const denied = policy.grants.filter((g) => !g.granted);
  assert.ok(denied.length > 0);
  assert.ok(denied[0].reason.includes('viewer'));
});
