import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';

export function listRiskEvents(limit = 50) {
  return controlPlaneRuntime.listRiskEvents(limit);
}

export function getRiskEvent(eventId: string) {
  return controlPlaneRuntime.listRiskEvents(200).find((item: any) => item.id === eventId) || null;
}
