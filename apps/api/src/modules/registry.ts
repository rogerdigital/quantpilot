export const ARCHITECTURE_LAYERS = [
  {
    id: 'frontend',
    name: 'Frontend',
    status: 'active',
    responsibility: 'core dashboard, market view, strategy, backtest, risk and execution screens',
    codeLocations: ['apps/web'],
  },
  {
    id: 'backend',
    name: 'Backend',
    status: 'active',
    responsibility: 'small REST gateway with local-session auth and core console routes',
    codeLocations: ['apps/api/src/app/routes', 'apps/api/src/modules/auth'],
  },
  {
    id: 'engine',
    name: 'Trading Engine',
    status: 'active',
    responsibility: 'simulation, risk assessment, execution helpers and strategy validation',
    codeLocations: ['packages/trading-engine'],
  },
];

export const MODULE_REGISTRY = [
  {
    id: 'auth',
    name: 'Local Session',
    layer: 'backend',
    status: 'active',
    responsibility: 'single-user session and local permission checks',
  },
  {
    id: 'market',
    name: 'Market Data',
    layer: 'backend',
    status: 'active',
    responsibility: 'simulated OHLCV and provider status endpoints',
  },
  {
    id: 'strategy',
    name: 'Strategy Catalog',
    layer: 'backend',
    status: 'active',
    responsibility: 'lightweight strategy catalog and execution handoff endpoints',
  },
  {
    id: 'backtest',
    name: 'Backtest',
    layer: 'backend',
    status: 'active',
    responsibility: 'local backtest run and result endpoints',
  },
  {
    id: 'risk',
    name: 'Risk',
    layer: 'backend',
    status: 'active',
    responsibility: 'risk parameters, policy checks and risk event endpoints',
  },
  {
    id: 'execution',
    name: 'Execution',
    layer: 'backend',
    status: 'active',
    responsibility: 'paper execution plans, broker events and ledger endpoints',
  },
];

export function listModules() {
  return MODULE_REGISTRY;
}

export function listArchitectureLayers() {
  return ARCHITECTURE_LAYERS;
}

export function describeArchitecture() {
  const moduleCountByLayer = MODULE_REGISTRY.reduce((acc: Record<string, number>, module: any) => {
    acc[module.layer] = (acc[module.layer] || 0) + 1;
    return acc;
  }, {});

  return {
    summary: {
      layerCount: ARCHITECTURE_LAYERS.length,
      moduleCount: MODULE_REGISTRY.length,
    },
    layers: ARCHITECTURE_LAYERS.map((layer) => ({
      ...layer,
      moduleCount: moduleCountByLayer[layer.id] || 0,
      modules: MODULE_REGISTRY.filter((module) => module.layer === layer.id),
    })),
  };
}
