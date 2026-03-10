import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';

export function listRiskEvents(limit = 50) {
  return controlPlaneRuntime.listRiskEvents(limit);
}
