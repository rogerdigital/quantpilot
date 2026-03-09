import { createJsonFileStore } from '../../db/src/json-file-adapter.mjs';

function resolveNamespace() {
  return process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE || 'control-plane';
}

export const controlPlaneStore = createJsonFileStore({ namespace: resolveNamespace() });

export function createControlPlaneStore(options = {}) {
  return createJsonFileStore({ namespace: options.namespace || resolveNamespace() });
}
