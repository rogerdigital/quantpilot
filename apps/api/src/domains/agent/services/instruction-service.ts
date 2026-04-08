// @ts-nocheck
import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';

export function createAgentInstruction(payload = {}) {
  const instruction = controlPlaneRuntime.recordAgentInstruction(payload);
  return { ok: true, instruction };
}

export function listActiveAgentInstructions(filter = {}) {
  const activeAt = filter.activeAt || new Date().toISOString();
  return controlPlaneRuntime.listAgentInstructions(50, {
    ...filter,
    activeOnly: true,
    activeAt,
  });
}
