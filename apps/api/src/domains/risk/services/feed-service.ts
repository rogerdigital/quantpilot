// @ts-nocheck
import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';

export function listRiskEvents(limit = 50) {
  return controlPlaneRuntime.listRiskEvents(limit);
}

export function getRiskEvent(eventId) {
  return controlPlaneRuntime.listRiskEvents(200).find((item) => item.id === eventId) || null;
}
