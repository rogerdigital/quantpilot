import { createJsonFileStore } from '../../db/src/json-file-adapter.mjs';

export const controlPlaneStore = createJsonFileStore({ namespace: 'control-plane' });

export function createControlPlaneStore(options = {}) {
  return createJsonFileStore({ namespace: options.namespace || 'control-plane' });
}
