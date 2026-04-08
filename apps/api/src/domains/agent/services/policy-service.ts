import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';

const AUTHORITY_ORDER = ['full_auto', 'bounded_auto', 'ask_first', 'manual_only', 'stopped'];

function rankAuthority(mode) {
  const idx = AUTHORITY_ORDER.indexOf(mode);
  return idx >= 0 ? idx : AUTHORITY_ORDER.indexOf('manual_only');
}

function mostRestrictiveMode(modes) {
  return modes.reduce((worst, mode) => (
    rankAuthority(mode) > rankAuthority(worst) ? mode : worst
  ), 'full_auto');
}

export function saveAgentPolicy(payload = {}) {
  const policy = controlPlaneRuntime.saveAgentPolicy(payload);
  return { ok: true, policy };
}

export function resolveAgentAuthority({
  accountId = 'all',
  strategyId = 'all',
  actionType = 'all',
  environment = 'paper',
  riskMode = 'healthy',
  anomalyMode = 'healthy',
} = {}) {
  const policies = controlPlaneRuntime.listAgentPolicies(200).filter((item) => (
    (item.accountId === accountId || item.accountId === 'all')
    && (item.strategyId === strategyId || item.strategyId === 'all')
    && (item.actionType === actionType || item.actionType === 'all')
    && (item.environment === environment || item.environment === 'all')
  ));

  const baseMode = policies.length > 0
    ? mostRestrictiveMode(policies.map((p) => p.authority))
    : 'manual_only';

  let effectiveMode = baseMode;
  let reason = policies.length > 0
    ? `Derived from ${policies.length} matching policy record${policies.length > 1 ? 's' : ''}.`
    : 'No agent governance policy configured.';

  if (riskMode === 'risk_off' || anomalyMode === 'critical') {
    effectiveMode = 'stopped';
    reason = 'Authority stopped: active risk-off or critical anomaly condition.';
  } else if (anomalyMode === 'warn' && rankAuthority(baseMode) < rankAuthority('ask_first')) {
    effectiveMode = 'ask_first';
    reason = 'Authority downgraded to ask_first: anomaly warning is active.';
  }

  return {
    ok: true,
    mode: effectiveMode,
    reason,
    policies,
  };
}
