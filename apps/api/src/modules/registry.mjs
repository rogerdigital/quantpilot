export const ARCHITECTURE_LAYERS = [
  {
    id: 'frontend',
    name: 'Frontend',
    status: 'prototype',
    responsibility: 'dashboard, strategy workspace, risk console, execution console, and agent interaction surfaces',
    codeLocations: ['apps/web'],
  },
  {
    id: 'backend',
    name: 'Backend',
    status: 'prototype',
    responsibility: 'gateway entry, auth, orchestration, notifications, audit, monitoring, and scheduler boundaries',
    codeLocations: ['apps/api', 'apps/api/src/control-plane', 'packages/control-plane-runtime'],
  },
  {
    id: 'data',
    name: 'Data Layer',
    status: 'prototype',
    responsibility: 'market, research, control-plane, and state persistence abstractions',
    codeLocations: ['packages/db', 'packages/control-plane-store'],
  },
  {
    id: 'strategy',
    name: 'Strategy Layer',
    status: 'prototype',
    responsibility: 'strategy catalog, signal generation, backtest entry, and research promotion flow',
    codeLocations: ['packages/trading-engine/src/strategy', 'apps/api/src/domains/strategy', 'apps/api/src/domains/backtest', 'apps/api/src/modules/strategy', 'apps/api/src/modules/backtest'],
  },
  {
    id: 'agent',
    name: 'Agent Layer',
    status: 'prototype',
    responsibility: 'intent parsing, session-linked planning, tool allowlist, structured summaries, and approval-gated action requests',
    codeLocations: ['apps/api/src/domains/agent', 'apps/api/src/modules/agent', 'apps/web/src/pages/agent'],
  },
  {
    id: 'risk',
    name: 'Risk Layer',
    status: 'prototype',
    responsibility: 'risk scan jobs, risk events, approvals, and final execution gates',
    codeLocations: ['packages/trading-engine/src/risk', 'apps/api/src/domains/risk', 'apps/api/src/modules/risk', 'apps/worker/src/tasks/risk-scan-task.mjs'],
  },
  {
    id: 'execution',
    name: 'Execution Layer',
    status: 'prototype',
    responsibility: 'execution plans, broker handoff, order intent routing, and execution-facing workflows',
    codeLocations: ['packages/trading-engine/src/execution', 'apps/api/src/domains/execution', 'apps/api/src/modules/execution', 'apps/api/src/gateways/alpaca.mjs'],
  },
];

export const MODULE_REGISTRY = [
  {
    id: 'api-gateway',
    name: 'API Gateway',
    layer: 'backend',
    status: 'planned',
    responsibility: 'REST, WebSocket, request entry, and rate limiting',
  },
  {
    id: 'auth',
    name: 'Auth',
    layer: 'backend',
    status: 'prototype',
    responsibility: 'identity, access tokens, and permission checks',
  },
  {
    id: 'user-account',
    name: 'User Account',
    layer: 'backend',
    status: 'prototype',
    responsibility: 'user profile, account state, and broker bindings',
  },
  {
    id: 'task-orchestrator',
    name: 'Task Orchestrator',
    layer: 'backend',
    status: 'prototype',
    responsibility: 'backtest, optimization, agent, and execution workflows',
  },
  {
    id: 'notification',
    name: 'Notification',
    layer: 'backend',
    status: 'prototype',
    responsibility: 'inbox, email, and IM alert delivery',
  },
  {
    id: 'risk',
    name: 'Risk',
    layer: 'backend',
    status: 'prototype',
    responsibility: 'risk scan jobs, risk events, and approval-oriented controls',
  },
  {
    id: 'audit',
    name: 'Audit',
    layer: 'backend',
    status: 'prototype',
    responsibility: 'operator actions, execution reasons, and traceability',
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    layer: 'backend',
    status: 'prototype',
    responsibility: 'runtime health, queue depth, and subsystem status summaries',
  },
  {
    id: 'scheduler',
    name: 'Scheduler',
    layer: 'backend',
    status: 'prototype',
    responsibility: 'pre-open, post-close, and periodic jobs',
  },
  {
    id: 'strategy',
    name: 'Strategy Research',
    layer: 'strategy',
    status: 'prototype',
    responsibility: 'strategy catalog, scoring, and promotion pipeline',
  },
  {
    id: 'backtest',
    name: 'Backtest Center',
    layer: 'strategy',
    status: 'prototype',
    responsibility: 'research summary, run queue, and performance review data',
  },
  {
    id: 'execution',
    name: 'Execution Planning',
    layer: 'execution',
    status: 'prototype',
    responsibility: 'execution plan persistence and order intent handoff',
  },
  {
    id: 'agent',
    name: 'Agent Tool Layer',
    layer: 'agent',
    status: 'prototype',
    responsibility: 'tool allowlist and structured agent-facing read access',
  },
];

export function listModules() {
  return MODULE_REGISTRY;
}

export function listArchitectureLayers() {
  return ARCHITECTURE_LAYERS;
}

export function describeArchitecture() {
  const moduleCountByLayer = MODULE_REGISTRY.reduce((acc, module) => {
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
