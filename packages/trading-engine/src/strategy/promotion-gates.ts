import type { GateEvaluation } from './lifecycle.js';

export type PromotionGateSpec = {
  key: string;
  label: string;
  description: string;
  evaluator: (evidence: Record<string, unknown>) => GateEvaluation;
};

function makeGate(
  key: string,
  label: string,
  description: string,
  check: (evidence: Record<string, unknown>) => { passed: boolean; reason: string }
): PromotionGateSpec {
  return {
    key,
    label,
    description,
    evaluator: (evidence) => {
      const result = check(evidence);
      return { gate: key, ...result };
    },
  };
}

export const PROMOTION_GATES: PromotionGateSpec[] = [
  makeGate(
    'research_evidence',
    'Research Evidence',
    'Research idea with hypothesis and decision records must exist',
    (ev) => {
      const has = Boolean(ev.researchIdeaId && ev.hypothesis);
      return {
        passed: has,
        reason: has ? 'Research evidence present' : 'Missing research idea or hypothesis',
      };
    }
  ),
  makeGate(
    'dataset_quality',
    'Dataset Quality',
    'All referenced datasets must pass quality checks without blockers',
    (ev) => {
      const severity = ev.datasetQualitySeverity as string | undefined;
      if (!severity) return { passed: false, reason: 'Dataset quality not assessed' };
      const passed = severity !== 'blocker';
      return {
        passed,
        reason: passed ? 'Dataset quality acceptable' : 'Dataset has blocker-level quality issues',
      };
    }
  ),
  makeGate(
    'feature_leakage_check',
    'Feature Leakage Check',
    'Features must not have forward-looking leakage',
    (ev) => {
      if (!('featureLeakageDetected' in ev))
        return { passed: false, reason: 'Feature leakage check not performed' };
      const hasLeakage = Boolean(ev.featureLeakageDetected);
      return {
        passed: !hasLeakage,
        reason: hasLeakage ? 'Feature leakage detected' : 'No leakage detected',
      };
    }
  ),
  makeGate(
    'backtest_reproducibility',
    'Backtest Reproducibility',
    'Backtest must have a deterministic spec hash and matching results',
    (ev) => {
      const has = Boolean(ev.backtestSpecHash && ev.backtestResultId);
      return { passed: has, reason: has ? 'Backtest reproducible' : 'Missing spec hash or result' };
    }
  ),
  makeGate(
    'robustness_diagnostics',
    'Robustness Diagnostics',
    'Strategy must pass overfit risk assessment',
    (ev) => {
      const risk = ev.overfitRisk as string | undefined;
      const passed = risk === 'low' || risk === 'medium';
      return {
        passed,
        reason: passed
          ? `Overfit risk: ${risk}`
          : `Overfit risk too high: ${risk ?? 'not assessed'}`,
      };
    }
  ),
  makeGate('risk_assessment', 'Risk Assessment', 'Pre-trade risk assessment must pass', (ev) => {
    const passed = ev.riskAssessmentPassed === true;
    return { passed, reason: passed ? 'Risk assessment passed' : 'Risk assessment not passed' };
  }),
  makeGate(
    'paper_observation',
    'Paper Observation',
    'Strategy must have minimum paper trading observation period',
    (ev) => {
      const days = (ev.paperObservationDays as number) ?? 0;
      const minDays = (ev.requiredPaperDays as number) ?? 30;
      const passed = days >= minDays;
      return {
        passed,
        reason: passed
          ? `${days} days observed (min ${minDays})`
          : `Only ${days}/${minDays} days observed`,
      };
    }
  ),
  makeGate(
    'live_acknowledgement',
    'Live Acknowledgement',
    'Human operator must explicitly acknowledge live promotion risks',
    (ev) => {
      const ack = Boolean(ev.liveAcknowledgement);
      return { passed: ack, reason: ack ? 'Live acknowledged' : 'Missing live acknowledgement' };
    }
  ),
];

export function evaluateAllGates(evidence: Record<string, unknown>): GateEvaluation[] {
  return PROMOTION_GATES.map((gate) => gate.evaluator(evidence));
}

export function evaluateGates(
  gateKeys: string[],
  evidence: Record<string, unknown>
): GateEvaluation[] {
  return gateKeys
    .map((key) => PROMOTION_GATES.find((g) => g.key === key))
    .filter((g): g is PromotionGateSpec => g !== undefined)
    .map((gate) => gate.evaluator(evidence));
}
