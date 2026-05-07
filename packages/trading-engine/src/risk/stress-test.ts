export interface StressScenario {
  id: string;
  name: string;
  description: string;
  equityShock: number;
  rateShock: number;
  volatilityShock: number;
  creditSpreadShock: number;
}

export interface PositionInput {
  symbol: string;
  weight: number;
  beta: number;
  sector: string;
}

export interface StressTestResult {
  scenario: StressScenario;
  pnlImpact: number;
  positionImpacts: PositionImpact[];
  worstPosition: string;
  recoveryEstimateDays: number;
}

export interface PositionImpact {
  symbol: string;
  weight: number;
  contribution: number;
}

const PREDEFINED_SCENARIOS: StressScenario[] = [
  {
    id: 'gfc_2008',
    name: '2008 Financial Crisis',
    description: 'Global financial crisis with severe equity drawdown and credit crunch',
    equityShock: -0.45,
    rateShock: -0.03,
    volatilityShock: 0.8,
    creditSpreadShock: 0.06,
  },
  {
    id: 'covid_2020',
    name: 'COVID Crash',
    description: 'Rapid pandemic-driven sell-off with extreme volatility spike',
    equityShock: -0.34,
    rateShock: -0.015,
    volatilityShock: 1.2,
    creditSpreadShock: 0.04,
  },
  {
    id: 'flash_crash',
    name: 'Flash Crash',
    description: 'Intraday liquidity crisis with sharp reversal',
    equityShock: -0.1,
    rateShock: 0,
    volatilityShock: 0.5,
    creditSpreadShock: 0.01,
  },
  {
    id: 'rate_hike',
    name: 'Rate Hike Shock',
    description: 'Aggressive central bank tightening cycle',
    equityShock: -0.15,
    rateShock: 0.03,
    volatilityShock: 0.3,
    creditSpreadShock: 0.02,
  },
  {
    id: 'stagflation',
    name: 'Stagflation',
    description: 'Persistent inflation with economic stagnation',
    equityShock: -0.25,
    rateShock: 0.04,
    volatilityShock: 0.4,
    creditSpreadShock: 0.03,
  },
];

export function getPredefinedScenarios(): StressScenario[] {
  return [...PREDEFINED_SCENARIOS];
}

export function getScenarioById(id: string): StressScenario | undefined {
  return PREDEFINED_SCENARIOS.find((s) => s.id === id);
}

export function buildCustomScenario(
  name: string,
  equityShock: number,
  rateShock: number,
  volatilityShock: number,
  creditSpreadShock: number
): StressScenario {
  return {
    id: `custom_${Date.now()}`,
    name,
    description: 'User-defined custom scenario',
    equityShock,
    rateShock,
    volatilityShock,
    creditSpreadShock,
  };
}

function calculatePositionImpact(
  position: PositionInput,
  scenario: StressScenario
): PositionImpact {
  const betaImpact = position.beta * scenario.equityShock;
  const rateImpact = -position.beta * scenario.rateShock * 2;
  const volImpact = -Math.abs(position.beta) * scenario.volatilityShock * 0.02;
  const totalImpact = (betaImpact + rateImpact + volImpact) * position.weight;

  return {
    symbol: position.symbol,
    weight: position.weight,
    contribution: parseFloat(totalImpact.toFixed(6)),
  };
}

export function runStressTest(
  positions: PositionInput[],
  scenario: StressScenario
): StressTestResult {
  const positionImpacts = positions.map((p) => calculatePositionImpact(p, scenario));
  const pnlImpact = positionImpacts.reduce((s, p) => s + p.contribution, 0);

  let worstPosition = positionImpacts[0]?.symbol ?? '';
  let worstImpact = positionImpacts[0]?.contribution ?? 0;
  for (const impact of positionImpacts) {
    if (impact.contribution < worstImpact) {
      worstImpact = impact.contribution;
      worstPosition = impact.symbol;
    }
  }

  const severity = Math.abs(pnlImpact);
  const recoveryEstimateDays =
    severity > 0.3 ? 365 : severity > 0.15 ? 180 : severity > 0.05 ? 90 : 30;

  return {
    scenario,
    pnlImpact: parseFloat(pnlImpact.toFixed(6)),
    positionImpacts,
    worstPosition,
    recoveryEstimateDays,
  };
}

export function runMultiScenarioTest(
  positions: PositionInput[],
  scenarioIds?: string[]
): StressTestResult[] {
  const scenarios = scenarioIds
    ? PREDEFINED_SCENARIOS.filter((s) => scenarioIds.includes(s.id))
    : PREDEFINED_SCENARIOS;

  return scenarios.map((scenario) => runStressTest(positions, scenario));
}
