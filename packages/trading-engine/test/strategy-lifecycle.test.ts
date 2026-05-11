import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  canPromoteToLive,
  canPromoteToPaper,
  evaluateTransition,
  getAvailableTransitions,
} from '../src/strategy/lifecycle.ts';
import {
  evaluateAllGates,
  evaluateGates,
  PROMOTION_GATES,
} from '../src/strategy/promotion-gates.ts';

describe('strategy lifecycle transitions', () => {
  it('lists available transitions from research', () => {
    const transitions = getAvailableTransitions('research');
    assert.equal(transitions.length, 1);
    assert.equal(transitions[0].to, 'backtest');
  });

  it('lists available transitions from candidate', () => {
    const transitions = getAvailableTransitions('candidate');
    assert.equal(transitions.length, 1);
    assert.equal(transitions[0].to, 'paper_observation');
  });

  it('lists available transitions from live_limited', () => {
    const transitions = getAvailableTransitions('live_limited');
    assert.equal(transitions.length, 2);
    const targets = transitions.map((t) => t.to).sort();
    assert.deepEqual(targets, ['live_expanded', 'suspended']);
  });

  it('blocks transition when gate not evaluated', () => {
    const result = evaluateTransition('research', 'backtest', []);
    assert.equal(result.allowed, false);
    if (!result.allowed) {
      assert.ok(result.blockers[0].includes('research_evidence'));
    }
  });

  it('blocks transition when gate fails', () => {
    const result = evaluateTransition('research', 'backtest', [
      { gate: 'research_evidence', passed: false, reason: 'No hypothesis' },
    ]);
    assert.equal(result.allowed, false);
    if (!result.allowed) {
      assert.ok(result.blockers[0].includes('failed'));
    }
  });

  it('allows transition when all gates pass', () => {
    const result = evaluateTransition('research', 'backtest', [
      { gate: 'research_evidence', passed: true, reason: 'Present' },
    ]);
    assert.equal(result.allowed, true);
  });

  it('rejects invalid transition path', () => {
    const result = evaluateTransition('research', 'live_expanded', []);
    assert.equal(result.allowed, false);
    if (!result.allowed) {
      assert.ok(result.blockers[0].includes('No valid transition'));
    }
  });

  it('canPromoteToPaper requires all candidate gates', () => {
    const result = canPromoteToPaper([]);
    assert.equal(result.allowed, false);
    if (!result.allowed) {
      assert.ok(result.blockers.length >= 4);
    }
  });

  it('canPromoteToPaper passes with all gates', () => {
    const gates = [
      { gate: 'dataset_quality', passed: true, reason: 'ok' },
      { gate: 'feature_leakage_check', passed: true, reason: 'ok' },
      { gate: 'risk_assessment', passed: true, reason: 'ok' },
      { gate: 'backtest_reproducibility', passed: true, reason: 'ok' },
      { gate: 'robustness_diagnostics', passed: true, reason: 'ok' },
    ];
    const result = canPromoteToPaper(gates);
    assert.equal(result.allowed, true);
  });

  it('canPromoteToLive requires paper_observation', () => {
    const result = canPromoteToLive([]);
    assert.equal(result.allowed, false);
  });

  it('canPromoteToLive passes with paper observation gate', () => {
    const result = canPromoteToLive([
      { gate: 'paper_observation', passed: true, reason: '45 days' },
    ]);
    assert.equal(result.allowed, true);
  });
});

describe('promotion gates', () => {
  it('has 8 defined gates', () => {
    assert.equal(PROMOTION_GATES.length, 8);
  });

  it('research_evidence gate fails without hypothesis', () => {
    const results = evaluateGates(['research_evidence'], {});
    assert.equal(results[0].passed, false);
  });

  it('research_evidence gate passes with hypothesis', () => {
    const results = evaluateGates(['research_evidence'], {
      researchIdeaId: 'r-1',
      hypothesis: 'Momentum factor predicts returns',
    });
    assert.equal(results[0].passed, true);
  });

  it('dataset_quality gate fails on blocker severity', () => {
    const results = evaluateGates(['dataset_quality'], { datasetQualitySeverity: 'blocker' });
    assert.equal(results[0].passed, false);
  });

  it('dataset_quality gate passes on warning severity', () => {
    const results = evaluateGates(['dataset_quality'], { datasetQualitySeverity: 'warning' });
    assert.equal(results[0].passed, true);
  });

  it('feature_leakage_check blocks when leakage detected', () => {
    const results = evaluateGates(['feature_leakage_check'], { featureLeakageDetected: true });
    assert.equal(results[0].passed, false);
  });

  it('robustness_diagnostics blocks high overfit risk', () => {
    const results = evaluateGates(['robustness_diagnostics'], { overfitRisk: 'high' });
    assert.equal(results[0].passed, false);
  });

  it('robustness_diagnostics passes medium overfit risk', () => {
    const results = evaluateGates(['robustness_diagnostics'], { overfitRisk: 'medium' });
    assert.equal(results[0].passed, true);
  });

  it('paper_observation blocks insufficient days', () => {
    const results = evaluateGates(['paper_observation'], {
      paperObservationDays: 15,
      requiredPaperDays: 30,
    });
    assert.equal(results[0].passed, false);
  });

  it('paper_observation passes sufficient days', () => {
    const results = evaluateGates(['paper_observation'], {
      paperObservationDays: 45,
      requiredPaperDays: 30,
    });
    assert.equal(results[0].passed, true);
  });

  it('live_acknowledgement blocks without ack', () => {
    const results = evaluateGates(['live_acknowledgement'], {});
    assert.equal(results[0].passed, false);
  });

  it('evaluateAllGates runs all 8 gates', () => {
    const results = evaluateAllGates({});
    assert.equal(results.length, 8);
  });

  it('each missing gate blocks promotion independently', () => {
    const allGateKeys = PROMOTION_GATES.map((g) => g.key);
    for (const key of allGateKeys) {
      const results = evaluateGates([key], {});
      assert.equal(results[0].passed, false, `Gate ${key} should fail with empty evidence`);
    }
  });
});
