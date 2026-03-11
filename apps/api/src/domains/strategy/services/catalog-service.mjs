import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';

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
