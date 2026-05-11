// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';

import { PromotionStore } from '../src/promotion-store.ts';

function makeRequest(overrides = {}) {
  return {
    id: `promo-${Date.now()}`,
    strategyCandidateId: 'strat-1',
    strategyVersionId: 'sv-1',
    status: 'draft',
    gates: [],
    decisions: [],
    requestedBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
    ...overrides,
  };
}

function makeDecision(action, overrides = {}) {
  return {
    id: `dec-${Date.now()}`,
    promotionRequestId: 'promo-1',
    actor: 'reviewer-1',
    actorType: 'human',
    role: 'risk_manager',
    action,
    reason: 'Acceptable risk profile',
    evidenceLinks: [],
    timestamp: new Date().toISOString(),
    metadata: {},
    ...overrides,
  };
}

test('promotion store: create and retrieve', () => {
  const store = new PromotionStore();
  const req = makeRequest({ id: 'promo-1' });
  store.create(req);
  const retrieved = store.get('promo-1');
  assert.equal(retrieved.id, 'promo-1');
  assert.equal(retrieved.status, 'draft');
});

test('promotion store: list all', () => {
  const store = new PromotionStore();
  store.create(makeRequest({ id: 'p1', strategyCandidateId: 's1' }));
  store.create(makeRequest({ id: 'p2', strategyCandidateId: 's2' }));
  assert.equal(store.list().length, 2);
});

test('promotion store: list by strategy', () => {
  const store = new PromotionStore();
  store.create(makeRequest({ id: 'p1', strategyCandidateId: 's1' }));
  store.create(makeRequest({ id: 'p2', strategyCandidateId: 's1' }));
  store.create(makeRequest({ id: 'p3', strategyCandidateId: 's2' }));
  assert.equal(store.listByStrategy('s1').length, 2);
});

test('promotion store: submit changes status', () => {
  const store = new PromotionStore();
  store.create(makeRequest({ id: 'p1' }));
  const result = store.submit('p1');
  assert.equal(result.status, 'submitted');
});

test('promotion store: approve paper from submitted', () => {
  const store = new PromotionStore();
  store.create(makeRequest({ id: 'p1', status: 'submitted' }));
  const decision = makeDecision('approve_paper');
  const result = store.approvePaper('p1', decision);
  assert.equal(result.status, 'approved_for_paper');
  assert.equal(result.decisions.length, 1);
});

test('promotion store: approve paper blocked from draft', () => {
  const store = new PromotionStore();
  store.create(makeRequest({ id: 'p1', status: 'draft' }));
  const decision = makeDecision('approve_paper');
  const result = store.approvePaper('p1', decision);
  assert.equal(result, null);
});

test('promotion store: approve live from paper_observed', () => {
  const store = new PromotionStore();
  store.create(makeRequest({ id: 'p1', status: 'paper_observed' }));
  const decision = makeDecision('approve_live');
  const result = store.approveLive('p1', decision);
  assert.equal(result.status, 'approved_for_live');
});

test('promotion store: approve live blocked from submitted', () => {
  const store = new PromotionStore();
  store.create(makeRequest({ id: 'p1', status: 'submitted' }));
  const decision = makeDecision('approve_live');
  const result = store.approveLive('p1', decision);
  assert.equal(result, null);
});

test('promotion store: reject requires reason', () => {
  const store = new PromotionStore();
  store.create(makeRequest({ id: 'p1', status: 'submitted' }));
  const decision = makeDecision('reject', { reason: '' });
  const result = store.reject('p1', decision);
  assert.equal(result, null);
});

test('promotion store: reject with reason', () => {
  const store = new PromotionStore();
  store.create(makeRequest({ id: 'p1', status: 'submitted' }));
  const decision = makeDecision('reject', { reason: 'High drawdown risk' });
  const result = store.reject('p1', decision);
  assert.equal(result.status, 'suspended');
});

test('promotion store: update gate', () => {
  const store = new PromotionStore();
  store.create(makeRequest({ id: 'p1' }));
  const gate = {
    key: 'dataset_quality',
    label: 'Dataset Quality',
    status: 'passed',
    evidenceId: 'dq-1',
    evaluatedAt: new Date().toISOString(),
    evaluatedBy: 'system',
    reason: 'All checks pass',
    metadata: {},
  };
  const result = store.updateGate('p1', gate);
  assert.equal(result.gates.length, 1);
  assert.equal(result.gates[0].key, 'dataset_quality');
});

test('promotion store: suspend with reason', () => {
  const store = new PromotionStore();
  store.create(makeRequest({ id: 'p1', status: 'approved_for_paper' }));
  const decision = makeDecision('suspend', { reason: 'Market regime changed' });
  const result = store.suspend('p1', decision);
  assert.equal(result.status, 'suspended');
});

test('promotion store: immutability - external mutation does not affect store', () => {
  const store = new PromotionStore();
  const req = makeRequest({ id: 'p1' });
  store.create(req);
  const retrieved = store.get('p1');
  retrieved.status = 'live_expanded';
  const fresh = store.get('p1');
  assert.equal(fresh.status, 'draft');
});
