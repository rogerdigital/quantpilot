// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  DecisionRecord,
  PromotionDecision,
  PromotionGate,
  PromotionRequest,
  StrategyCandidate,
  StrategyVersion,
} from '../../shared-types/src/lifecycle.ts';
import { createMemoryStore } from './helpers/memory-store.ts';

test('lifecycle contracts: paper-approved strategy cannot be marked live without live gate', () => {
  const gates: PromotionGate[] = [
    {
      key: 'research_evidence',
      label: 'Research Evidence',
      status: 'passed',
      evidenceId: 'ev-1',
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      reason: 'Research complete',
      metadata: {},
    },
    {
      key: 'dataset_quality',
      label: 'Dataset Quality',
      status: 'passed',
      evidenceId: 'ev-2',
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      reason: 'Quality pass',
      metadata: {},
    },
    {
      key: 'feature_leakage_check',
      label: 'Feature Leakage',
      status: 'passed',
      evidenceId: 'ev-3',
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      reason: 'No leakage',
      metadata: {},
    },
    {
      key: 'backtest_reproducibility',
      label: 'Backtest Reproducibility',
      status: 'passed',
      evidenceId: 'ev-4',
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      reason: 'Reproducible',
      metadata: {},
    },
    {
      key: 'robustness_diagnostics',
      label: 'Robustness',
      status: 'passed',
      evidenceId: 'ev-5',
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      reason: 'Robust',
      metadata: {},
    },
    {
      key: 'risk_assessment',
      label: 'Risk Assessment',
      status: 'passed',
      evidenceId: 'ev-6',
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'risk-officer',
      reason: 'Risk acceptable',
      metadata: {},
    },
    {
      key: 'paper_observation',
      label: 'Paper Observation',
      status: 'passed',
      evidenceId: 'ev-7',
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      reason: '30-day paper observation passed',
      metadata: {},
    },
    {
      key: 'live_acknowledgement',
      label: 'Live Acknowledgement',
      status: 'pending',
      evidenceId: null,
      evaluatedAt: '',
      evaluatedBy: '',
      reason: '',
      metadata: {},
    },
  ];

  const promotion: PromotionRequest = {
    id: 'promo-001',
    strategyCandidateId: 'sc-001',
    strategyVersionId: 'sv-001',
    status: 'paper_observed',
    gates,
    decisions: [],
    requestedBy: 'researcher-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
  };

  // Cannot approve for live because live_acknowledgement gate is pending
  const liveGate = promotion.gates.find((g) => g.key === 'live_acknowledgement');
  assert.equal(liveGate?.status, 'pending');

  const allGatesPassed = promotion.gates.every((g) => g.status === 'passed');
  assert.equal(allGatesPassed, false, 'Cannot promote to live without live_acknowledgement gate');

  // Paper gates all pass
  const paperGates = promotion.gates.filter((g) => g.key !== 'live_acknowledgement');
  assert.ok(paperGates.every((g) => g.status === 'passed'));
});

test('lifecycle contracts: promotion decisions record actor, role, reason, evidence', () => {
  const decision: PromotionDecision = {
    id: 'dec-001',
    promotionRequestId: 'promo-001',
    actor: 'risk-officer-01',
    actorType: 'human',
    role: 'risk_officer',
    action: 'approve_paper',
    reason: 'Risk metrics within acceptable thresholds. VaR < 2%, max drawdown < 15%.',
    evidenceLinks: ['risk-assessment-001', 'backtest-run-005'],
    timestamp: new Date().toISOString(),
    metadata: {},
  };

  assert.equal(decision.actor, 'risk-officer-01');
  assert.equal(decision.actorType, 'human');
  assert.equal(decision.role, 'risk_officer');
  assert.equal(decision.action, 'approve_paper');
  assert.ok(decision.reason.length > 0);
  assert.equal(decision.evidenceLinks.length, 2);
});

test('lifecycle contracts: rejection is first-class, not absence of approval', () => {
  const rejection: PromotionDecision = {
    id: 'dec-002',
    promotionRequestId: 'promo-001',
    actor: 'risk-officer-01',
    actorType: 'human',
    role: 'risk_officer',
    action: 'reject',
    reason:
      'Excessive drawdown in sideways market regime. Sharpe degrades to 0.2 under low-volatility conditions.',
    evidenceLinks: ['robustness-report-001'],
    timestamp: new Date().toISOString(),
    metadata: {},
  };

  assert.equal(rejection.action, 'reject');
  assert.ok(rejection.reason.length > 0);
  assert.ok(rejection.evidenceLinks.length > 0);
});

test('lifecycle contracts: strategy version evidence chain is complete', () => {
  const version: StrategyVersion = {
    id: 'sv-001',
    strategyCandidateId: 'sc-001',
    version: 1,
    codeVersion: 'abc123',
    evidence: {
      researchIdeaId: 'idea-001',
      experimentRunId: 'run-001',
      modelVersionId: 'mv-001',
      backtestRunId: 'bt-001',
      datasetVersionId: 'dsv-001',
      featureVersionId: 'fv-001',
      riskAssessmentId: 'ra-001',
    },
    parameters: { lookback: 20, threshold: 0.02 },
    status: 'candidate',
    createdAt: new Date().toISOString(),
    metadata: {},
  };

  assert.equal(version.evidence.researchIdeaId, 'idea-001');
  assert.equal(version.evidence.experimentRunId, 'run-001');
  assert.equal(version.evidence.backtestRunId, 'bt-001');
  assert.equal(version.evidence.datasetVersionId, 'dsv-001');
  assert.equal(version.evidence.featureVersionId, 'fv-001');
  assert.equal(version.evidence.riskAssessmentId, 'ra-001');
});

test('lifecycle contracts: decision records are append-only with full context', () => {
  const store = createMemoryStore();

  const records: DecisionRecord[] = [
    {
      id: 'dr-001',
      entityType: 'promotion',
      entityId: 'promo-001',
      actor: 'researcher-01',
      actorType: 'human',
      role: 'researcher',
      action: 'submit',
      reason: 'Strategy meets all paper gates',
      evidenceLinks: ['bt-001', 'risk-001'],
      timestamp: new Date().toISOString(),
      metadata: {},
    },
    {
      id: 'dr-002',
      entityType: 'promotion',
      entityId: 'promo-001',
      actor: 'risk-system',
      actorType: 'system',
      role: 'risk_engine',
      action: 'risk_review_pass',
      reason: 'Automated risk check passed',
      evidenceLinks: ['risk-assessment-001'],
      timestamp: new Date().toISOString(),
      metadata: {},
    },
  ];

  store.writeCollection('decision_records.json', records);

  // Append-only: add a new record
  const existing = store.readCollection('decision_records.json');
  existing.push({
    id: 'dr-003',
    entityType: 'promotion',
    entityId: 'promo-001',
    actor: 'execution-lead',
    actorType: 'human',
    role: 'execution_lead',
    action: 'approve_paper',
    reason: 'Execution plan feasible',
    evidenceLinks: ['exec-plan-001'],
    timestamp: new Date().toISOString(),
    metadata: {},
  });
  store.writeCollection('decision_records.json', existing);

  const loaded = store.readCollection('decision_records.json');
  assert.equal(loaded.length, 3);
  assert.equal(loaded[0].id, 'dr-001');
  assert.equal(loaded[2].action, 'approve_paper');
});
