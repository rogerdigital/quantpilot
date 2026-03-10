import {
  getUserAccount,
  getUserPreferences,
  getUserProfile,
  listBrokerBindings,
  updateUserProfile,
  updateUserPreferences,
  upsertBrokerBinding,
} from '../../../../../packages/control-plane-runtime/src/index.mjs';

export function getUserAccountSnapshot() {
  const account = getUserAccount();
  return {
    ok: true,
    profile: account.profile,
    preferences: account.preferences,
    subscription: account.subscription,
    brokerBindings: account.brokerBindings,
    updatedAt: account.updatedAt,
  };
}

export function getUserProfileSnapshot() {
  return {
    ok: true,
    profile: getUserProfile(),
    preferences: getUserPreferences(),
  };
}

export function patchUserProfile(payload = {}) {
  const updated = updateUserProfile(payload);
  return {
    ok: true,
    profile: updated,
  };
}

export function patchUserPreferences(payload = {}) {
  const updated = updateUserPreferences(payload);
  return {
    ok: true,
    preferences: updated,
  };
}

export function getBrokerBindingsSnapshot() {
  return {
    ok: true,
    bindings: listBrokerBindings(),
  };
}

function buildBrokerRuntimeSnapshot(binding, health) {
  if (!binding) {
    return {
      ok: false,
      error: 'default broker binding is not configured',
    };
  }

  return {
    ok: true,
    binding,
    runtime: {
      adapter: health.adapter,
      connected: health.connected,
      customBrokerConfigured: Boolean(health.customBrokerConfigured),
      alpacaConfigured: Boolean(health.alpacaConfigured),
      status: health.connected ? 'connected' : 'disconnected',
      lastCheckedAt: new Date().toISOString(),
      mismatch: binding.provider !== health.adapter,
    },
  };
}

export async function getBrokerBindingRuntimeSnapshot(getBrokerHealth) {
  const binding = listBrokerBindings().find((item) => item.isDefault) || listBrokerBindings()[0] || null;
  const health = await getBrokerHealth();
  return buildBrokerRuntimeSnapshot(binding, health);
}

export async function syncBrokerBindingRuntime(getBrokerHealth) {
  const binding = listBrokerBindings().find((item) => item.isDefault) || listBrokerBindings()[0] || null;
  const health = await getBrokerHealth();
  const runtimeSnapshot = buildBrokerRuntimeSnapshot(binding, health);
  if (!runtimeSnapshot.ok) {
    return runtimeSnapshot;
  }

  const updatedBinding = upsertBrokerBinding({
    ...runtimeSnapshot.binding,
    status: runtimeSnapshot.runtime.status,
    lastSyncAt: runtimeSnapshot.runtime.lastCheckedAt,
    metadata: {
      ...(runtimeSnapshot.binding.metadata || {}),
      runtimeAdapter: runtimeSnapshot.runtime.adapter,
      customBrokerConfigured: runtimeSnapshot.runtime.customBrokerConfigured,
      alpacaConfigured: runtimeSnapshot.runtime.alpacaConfigured,
      mismatch: runtimeSnapshot.runtime.mismatch,
    },
  });

  return {
    ok: true,
    binding: updatedBinding,
    runtime: runtimeSnapshot.runtime,
  };
}

export function saveBrokerBinding(payload = {}) {
  if (!payload.provider || !payload.label) {
    return {
      ok: false,
      error: 'provider and label are required',
    };
  }

  const binding = upsertBrokerBinding(payload);
  return {
    ok: true,
    binding,
  };
}
