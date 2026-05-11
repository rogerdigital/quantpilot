// @ts-nocheck

export type ToolPolicyVerdict = {
  tool: string;
  allowed: boolean;
  reason: string;
};

const ALLOWED_TOOLS = [
  {
    name: 'read_research_workspace',
    category: 'read',
    description: 'Read research workspace data',
  },
  {
    name: 'summarize_dataset_quality',
    category: 'read',
    description: 'Summarize dataset quality reports',
  },
  {
    name: 'compare_experiment_runs',
    category: 'read',
    description: 'Compare experiment run metrics',
  },
  {
    name: 'explain_backtest_diagnostics',
    category: 'read',
    description: 'Explain backtest results and diagnostics',
  },
  {
    name: 'draft_promotion_review',
    category: 'write',
    description: 'Draft a promotion review memo',
  },
  { name: 'draft_risk_review', category: 'write', description: 'Draft a risk review assessment' },
  {
    name: 'draft_execution_recovery_memo',
    category: 'write',
    description: 'Draft an execution recovery analysis',
  },
];

const FORBIDDEN_TOOLS = [
  { name: 'place_live_order', reason: 'Agent cannot directly place live orders' },
  { name: 'approve_live_promotion', reason: 'Agent cannot be final approver for live trading' },
  { name: 'read_secrets', reason: 'Secret access is denied to agent' },
  { name: 'bypass_risk_policy', reason: 'Risk policy bypass is forbidden' },
  { name: 'delete_audit_records', reason: 'Audit records are immutable' },
];

const FORBIDDEN_SET = new Set(FORBIDDEN_TOOLS.map((t) => t.name));

export function getAllowedTools() {
  return ALLOWED_TOOLS.map((t) => ({ ...t }));
}

export function getForbiddenTools() {
  return FORBIDDEN_TOOLS.map((t) => ({ ...t }));
}

export function evaluateToolPolicy(toolName: string): ToolPolicyVerdict {
  const forbidden = FORBIDDEN_TOOLS.find((t) => t.name === toolName);
  if (forbidden) {
    return { tool: toolName, allowed: false, reason: forbidden.reason };
  }

  const allowed = ALLOWED_TOOLS.find((t) => t.name === toolName);
  if (allowed) {
    return { tool: toolName, allowed: true, reason: `Allowed: ${allowed.description}` };
  }

  return {
    tool: toolName,
    allowed: false,
    reason: `Tool "${toolName}" is not in the agent allowlist`,
  };
}

export function evaluateToolBatch(toolNames: string[]): ToolPolicyVerdict[] {
  return toolNames.map((name) => evaluateToolPolicy(name));
}

export function isToolForbidden(toolName: string): boolean {
  return FORBIDDEN_SET.has(toolName);
}

export function filterAllowedFromRequest(requestedTools: string[]): {
  allowed: string[];
  rejected: ToolPolicyVerdict[];
} {
  const allowed: string[] = [];
  const rejected: ToolPolicyVerdict[] = [];

  for (const tool of requestedTools) {
    const verdict = evaluateToolPolicy(tool);
    if (verdict.allowed) {
      allowed.push(tool);
    } else {
      rejected.push(verdict);
    }
  }

  return { allowed, rejected };
}
