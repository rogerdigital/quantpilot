import {
  deleteBrokerBinding,
  getUserAccount,
  getUserAccess,
  getUserPreferences,
  getUserProfile,
  listBrokerBindings,
  setDefaultBrokerBinding,
  updateUserProfile,
  updateUserAccess,
  updateUserPreferences,
  upsertBrokerBinding,
} from '../../../../../packages/control-plane-runtime/src/index.mjs';
import { appendAuditRecord } from '../audit/service.mjs';

function recordAccountAuditEvent(type, title, detail, metadata = {}) {
  const account = getUserAccount();
  appendAuditRecord({
    type,
    actor: account.profile.id || 'operator-demo',
    title,
    detail,
    metadata,
  });
}

export function getUserAccountSnapshot() {
  const account = getUserAccount();
  return {
    ok: true,
    profile: account.profile,
    access: account.access,
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
    access: getUserAccess(),
    preferences: getUserPreferences(),
  };
}

export function patchUserProfile(payload = {}) {
  const updated = updateUserProfile(payload);
  recordAccountAuditEvent(
    'user-account.profile.updated',
    'User profile updated',
    `Updated account profile for ${updated.name}.`,
    {
      userId: updated.id,
      email: updated.email,
      organization: updated.organization,
    },
  );
  return {
    ok: true,
    profile: updated,
  };
}

export function patchUserPreferences(payload = {}) {
  const updated = updateUserPreferences(payload);
  recordAccountAuditEvent(
    'user-account.preferences.updated',
    'User preferences updated',
    `Updated preferences for locale ${updated.locale} and mode ${updated.defaultMode}.`,
    {
      locale: updated.locale,
      timezone: updated.timezone,
      defaultMode: updated.defaultMode,
      notificationChannels: updated.notificationChannels,
    },
  );
  return {
    ok: true,
    preferences: updated,
  };
}

export function patchUserAccess(payload = {}) {
  const updated = updateUserAccess(payload);
  recordAccountAuditEvent(
    'user-account.access.updated',
    'User access policy updated',
    `Updated access policy for role ${updated.role}.`,
    {
      role: updated.role,
      status: updated.status,
      permissions: updated.permissions,
    },
  );
  return {
    ok: true,
    access: updated,
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

  recordAccountAuditEvent(
    'user-account.broker-binding.runtime-synced',
    'Broker binding runtime synced',
    `Synced runtime state for ${updatedBinding.label}.`,
    {
      bindingId: updatedBinding.id,
      provider: updatedBinding.provider,
      adapter: runtimeSnapshot.runtime.adapter,
      connected: runtimeSnapshot.runtime.connected,
      mismatch: runtimeSnapshot.runtime.mismatch,
    },
  );

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
  recordAccountAuditEvent(
    'user-account.broker-binding.saved',
    'Broker binding saved',
    `Saved broker binding ${binding.label}.`,
    {
      bindingId: binding.id,
      provider: binding.provider,
      environment: binding.environment,
      isDefault: binding.isDefault,
      status: binding.status,
    },
  );
  return {
    ok: true,
    binding,
  };
}

export function setPrimaryBrokerBinding(bindingId) {
  const binding = setDefaultBrokerBinding(bindingId);
  if (!binding) {
    return {
      ok: false,
      error: 'broker binding was not found',
    };
  }

  recordAccountAuditEvent(
    'user-account.broker-binding.default-set',
    'Default broker binding updated',
    `Set ${binding.label} as the default broker binding.`,
    {
      bindingId: binding.id,
      provider: binding.provider,
      environment: binding.environment,
    },
  );

  return {
    ok: true,
    binding,
    bindings: listBrokerBindings(),
  };
}

export function removeBrokerBinding(bindingId) {
  const result = deleteBrokerBinding(bindingId);
  if (!result.ok) {
    return result;
  }

  recordAccountAuditEvent(
    'user-account.broker-binding.deleted',
    'Broker binding deleted',
    `Deleted broker binding ${result.binding.label}.`,
    {
      bindingId: result.binding.id,
      provider: result.binding.provider,
      environment: result.binding.environment,
    },
  );

  return {
    ok: true,
    binding: result.binding,
    bindings: result.bindings,
  };
}
