import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';

export function createAgentInstruction(payload: Record<string, unknown> = {}) {
  const instruction = controlPlaneRuntime.recordAgentInstruction(payload);
  return { ok: true, instruction };
}

export function listActiveAgentInstructions(filter: Record<string, unknown> = {}) {
  const activeAt = (filter.activeAt as string) || new Date().toISOString();
  return controlPlaneRuntime.listAgentInstructions(50, {
    ...filter,
    activeOnly: true,
    activeAt,
  });
}
