import { createJsonFileStore } from '../../db/src/index.mjs';

export const controlPlaneStore = createJsonFileStore({ namespace: 'control-plane' });
