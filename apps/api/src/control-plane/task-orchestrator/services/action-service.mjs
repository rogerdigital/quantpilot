import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';

export function recordAction(payload) {
  return controlPlaneRuntime.recordOperatorAction(payload);
}

export function listActions(limit = 50) {
  return controlPlaneRuntime.listOperatorActions(limit);
}
