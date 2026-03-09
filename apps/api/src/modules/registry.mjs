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
    status: 'planned',
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
    status: 'planned',
    responsibility: 'logs, metrics, and runtime health',
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
];

export function listModules() {
  return MODULE_REGISTRY;
}
