export type LifecycleStage =
  | 'research'
  | 'backtest'
  | 'candidate'
  | 'paper_observation'
  | 'live_limited'
  | 'live_expanded'
  | 'suspended'
  | 'retired';

export type LifecycleTransition = {
  from: LifecycleStage;
  to: LifecycleStage;
  requiredGates: string[];
};

const TRANSITIONS: LifecycleTransition[] = [
  { from: 'research', to: 'backtest', requiredGates: ['research_evidence'] },
  {
    from: 'backtest',
    to: 'candidate',
    requiredGates: ['backtest_reproducibility', 'robustness_diagnostics'],
  },
  {
    from: 'candidate',
    to: 'paper_observation',
    requiredGates: [
      'dataset_quality',
      'feature_leakage_check',
      'risk_assessment',
      'backtest_reproducibility',
      'robustness_diagnostics',
    ],
  },
  { from: 'paper_observation', to: 'live_limited', requiredGates: ['paper_observation'] },
  { from: 'live_limited', to: 'live_expanded', requiredGates: ['live_acknowledgement'] },
  { from: 'live_expanded', to: 'suspended', requiredGates: [] },
  { from: 'live_limited', to: 'suspended', requiredGates: [] },
  { from: 'paper_observation', to: 'suspended', requiredGates: [] },
  { from: 'suspended', to: 'retired', requiredGates: [] },
  { from: 'suspended', to: 'paper_observation', requiredGates: ['risk_assessment'] },
];

export type GateEvaluation = {
  gate: string;
  passed: boolean;
  reason: string;
};

export type PromotionTransitionResult =
  | { allowed: true; from: LifecycleStage; to: LifecycleStage }
  | { allowed: false; from: LifecycleStage; to: LifecycleStage; blockers: string[] };

export function getAvailableTransitions(current: LifecycleStage): LifecycleTransition[] {
  return TRANSITIONS.filter((t) => t.from === current);
}

export function evaluateTransition(
  from: LifecycleStage,
  to: LifecycleStage,
  gateResults: GateEvaluation[]
): PromotionTransitionResult {
  const transition = TRANSITIONS.find((t) => t.from === from && t.to === to);
  if (!transition) {
    return { allowed: false, from, to, blockers: [`No valid transition from ${from} to ${to}`] };
  }

  const gateMap = new Map(gateResults.map((g) => [g.gate, g]));
  const blockers: string[] = [];

  for (const required of transition.requiredGates) {
    const evaluation = gateMap.get(required);
    if (!evaluation) {
      blockers.push(`Gate '${required}' not evaluated`);
    } else if (!evaluation.passed) {
      blockers.push(`Gate '${required}' failed: ${evaluation.reason}`);
    }
  }

  if (blockers.length > 0) {
    return { allowed: false, from, to, blockers };
  }

  return { allowed: true, from, to };
}

export function canPromoteToPaper(gateResults: GateEvaluation[]): PromotionTransitionResult {
  return evaluateTransition('candidate', 'paper_observation', gateResults);
}

export function canPromoteToLive(gateResults: GateEvaluation[]): PromotionTransitionResult {
  return evaluateTransition('paper_observation', 'live_limited', gateResults);
}
