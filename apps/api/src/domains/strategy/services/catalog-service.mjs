import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';
import { refreshBacktestSummary } from '../../backtest/services/summary-service.mjs';

export function listStrategyCatalog() {
  const strategies = controlPlaneRuntime.listStrategyCatalog();
  const asOf = strategies[0]?.updatedAt || new Date().toISOString();

  return {
    ok: true,
    asOf,
    strategies,
  };
}

export function getStrategyCatalogItem(strategyId) {
  return controlPlaneRuntime.getStrategyCatalogItem(strategyId);
}

export function saveStrategyCatalogItem(payload = {}) {
  if (!payload.id || !payload.name) {
    return {
      ok: false,
      error: 'invalid strategy payload',
      message: 'strategy id and name are required',
    };
  }

  const strategy = controlPlaneRuntime.upsertStrategyCatalogItem(payload);

  controlPlaneRuntime.appendAuditRecord({
    type: 'strategy-catalog.saved',
    actor: payload.updatedBy || 'operator',
    title: `Strategy catalog saved for ${strategy.name}`,
    detail: `Strategy ${strategy.id} is now registered with status ${strategy.status}.`,
    metadata: {
      strategyId: strategy.id,
      status: strategy.status,
      family: strategy.family,
    },
  });

  controlPlaneRuntime.enqueueNotification({
    level: 'info',
    source: 'strategy-catalog',
    title: 'Strategy catalog updated',
    message: `${strategy.name} was saved to the strategy registry.`,
    metadata: {
      strategyId: strategy.id,
      status: strategy.status,
    },
  });

  refreshBacktestSummary('strategy-catalog.save');

  return {
    ok: true,
    strategy,
  };
}
