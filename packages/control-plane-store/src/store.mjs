import { createJsonFileStore } from '../../db/src/json-file-adapter.mjs';

export const controlPlaneStore = createJsonFileStore({ namespace: 'control-plane' });
