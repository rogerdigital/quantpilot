import type {
  StrategyPackageManifest,
  StrategyPackageValidationResult,
  StrategyPermission,
} from '../../../shared-types/src/strategy-package.ts';

const DANGEROUS_PERMISSIONS: StrategyPermission[] = ['live:execute'];

export function validateStrategyPackage(
  manifest: StrategyPackageManifest
): StrategyPackageValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!manifest.name || manifest.name.trim().length === 0) {
    errors.push('Package name is required');
  }

  if (!manifest.version || !/^\d+\.\d+\.\d+/.test(manifest.version)) {
    errors.push('Package version must follow semver (e.g. 1.0.0)');
  }

  if (!manifest.owner || manifest.owner.trim().length === 0) {
    errors.push('Package owner is required');
  }

  if (!manifest.supportedMarkets || manifest.supportedMarkets.length === 0) {
    errors.push('At least one supported market must be declared');
  }

  if (!manifest.requiredDatasets || manifest.requiredDatasets.length === 0) {
    warnings.push(
      'No required datasets declared — strategy may not have data dependencies documented'
    );
  }

  if (manifest.backtestSpecs.minHistoryMonths < 6) {
    warnings.push(
      'Minimum history months less than 6 — results may not be statistically significant'
    );
  }

  if (manifest.backtestSpecs.minimumSharpe < 0.5) {
    warnings.push('Minimum Sharpe ratio below 0.5 — consider raising the threshold');
  }

  if (manifest.riskRequirements.maxLeverage > 5) {
    errors.push('Max leverage exceeds platform limit of 5x');
  }

  if (manifest.riskRequirements.maxDrawdownPct > 50) {
    errors.push('Max drawdown exceeds platform limit of 50%');
  }

  if (hasLiveExecutionByDefault(manifest)) {
    errors.push(
      'Strategy package cannot request live:execute permission by default — must be granted through promotion workflow'
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function hasLiveExecutionByDefault(manifest: StrategyPackageManifest): boolean {
  return manifest.permissionsRequested.includes('live:execute');
}

export function getRequestedPermissions(manifest: StrategyPackageManifest): StrategyPermission[] {
  return [...manifest.permissionsRequested];
}

export function getDangerousPermissions(manifest: StrategyPackageManifest): StrategyPermission[] {
  return manifest.permissionsRequested.filter((p) => DANGEROUS_PERMISSIONS.includes(p));
}

export function createDefaultManifest(
  overrides: Partial<StrategyPackageManifest> = {}
): StrategyPackageManifest {
  return {
    name: '',
    version: '0.0.0',
    owner: '',
    description: '',
    requiredDatasets: [],
    requiredFeatures: [],
    supportedMarkets: [],
    riskRequirements: {
      maxDrawdownPct: 20,
      maxPositionPct: 10,
      maxLeverage: 1,
      requiresKillSwitch: true,
    },
    backtestSpecs: {
      minHistoryMonths: 12,
      requiredMetrics: ['sharpe', 'max_drawdown', 'calmar'],
      minimumSharpe: 0.8,
      outOfSamplePct: 30,
    },
    expectedArtifacts: ['backtest_report', 'risk_assessment'],
    permissionsRequested: ['research:read', 'backtest:run'],
    metadata: {},
    ...overrides,
  };
}
