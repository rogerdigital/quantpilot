// @ts-nocheck
import {
  deleteUserRoleTemplate,
  getBrokerBindingSummary,
  getCurrentWorkspace,
  deleteBrokerBinding,
  getTenant,
  getUserAccount,
  getUserAccessSummary,
  getUserRoleTemplate,
  listBrokerBindings,
  listWorkspaces,
  setCurrentWorkspace,
  setDefaultBrokerBinding,
  upsertWorkspace,
  upsertUserRoleTemplate,
  updateUserProfile,
  updateUserAccess,
  updateUserPreferences,
  upsertBrokerBinding,
} from '../../../../../packages/control-plane-runtime/src/index.js';
import { appendAuditRecord } from '../audit/service.js';
import { getSession } from '../auth/service.js';

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
  const session = getSession();
  return {
    ok: true,
    profile: account.profile,
    tenant: account.tenant,
    currentWorkspace: account.currentWorkspace,
    workspaces: account.workspaces,
    access: account.access,
    preferences: account.preferences,
    subscription: account.subscription,
    brokerBindings: account.brokerBindings,
    roleTemplates: account.roleTemplates,
    accessSummary: getUserAccessSummary(session.user.permissions),
    brokerSummary: getBrokerBindingSummary(),
    session,
    updatedAt: account.updatedAt,
  };
}

export function getUserProfileSnapshot() {
  const account = getUserAccount();
  const session = getSession();
  return {
    ok: true,
    profile: account.profile,
    tenant: account.tenant,
    currentWorkspace: account.currentWorkspace,
    workspaces: account.workspaces,
    access: account.access,
    preferences: account.preferences,
    roleTemplates: account.roleTemplates,
    accessSummary: getUserAccessSummary(session.user.permissions),
  };
}

export function getUserRoleTemplatesSnapshot() {
  const account = getUserAccount();
  return {
    ok: true,
    roleTemplates: account.roleTemplates,
  };
}

export function getUserWorkspaceSnapshot() {
  return {
    ok: true,
    tenant: getTenant(),
    currentWorkspace: getCurrentWorkspace(),
    workspaces: listWorkspaces(),
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
    session: getSession(),
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
    session: getSession(),
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
      grants: updated.grants || [],
      revokes: updated.revokes || [],
    },
  );
  return {
    ok: true,
    access: updated,
    accessSummary: getUserAccessSummary(getSession().user.permissions),
    session: getSession(),
  };
}

export function saveUserRoleTemplate(payload = {}) {
  if (!payload.id || !payload.label) {
    return {
      ok: false,
      error: 'role template id and label are required',
    };
  }

  const roleTemplate = upsertUserRoleTemplate(payload);
  recordAccountAuditEvent(
    'user-account.role-template.saved',
    'User role template saved',
    `Saved role template ${roleTemplate.label}.`,
    {
      roleTemplateId: roleTemplate.id,
      label: roleTemplate.label,
      defaultPermissions: roleTemplate.defaultPermissions,
      system: Boolean(roleTemplate.system),
    },
  );

  return {
    ok: true,
    roleTemplate,
    roleTemplates: getUserAccount().roleTemplates,
  };
}

export function saveWorkspace(payload = {}) {
  if (!payload.id || !payload.label) {
    return {
      ok: false,
      error: 'workspace id and label are required',
    };
  }

  const workspace = upsertWorkspace(payload);
  recordAccountAuditEvent(
    'user-account.workspace.saved',
    'Workspace saved',
    `Saved workspace ${workspace.label}.`,
    {
      workspaceId: workspace.id,
      tenantId: workspace.tenantId,
      role: workspace.role,
      grants: workspace.grants || [],
      revokes: workspace.revokes || [],
      status: workspace.status,
      isDefault: workspace.isDefault,
    },
  );

  return {
    ok: true,
    tenant: getTenant(),
    currentWorkspace: getCurrentWorkspace(),
    workspaces: listWorkspaces(),
  };
}

export function selectCurrentWorkspace(workspaceId) {
  const workspace = setCurrentWorkspace(workspaceId);
  if (!workspace) {
    return {
      ok: false,
      error: 'workspace was not found',
    };
  }

  recordAccountAuditEvent(
    'user-account.workspace.selected',
    'Workspace switched',
    `Switched current workspace to ${workspace.label}.`,
    {
      workspaceId: workspace.id,
      tenantId: workspace.tenantId,
      role: workspace.role,
      effectivePermissions: workspace.effectivePermissions || [],
    },
  );

  return {
    ok: true,
    tenant: getTenant(),
    currentWorkspace: workspace,
    workspaces: listWorkspaces(),
    session: getSession(),
  };
}

export function removeUserRoleTemplate(roleId) {
  const existing = getUserRoleTemplate(roleId);
  const result = deleteUserRoleTemplate(roleId);
  if (!result?.ok) {
    return result;
  }

  recordAccountAuditEvent(
    'user-account.role-template.deleted',
    'User role template deleted',
    `Deleted role template ${existing?.label || roleId}.`,
    {
      roleTemplateId: existing?.id || roleId,
      label: existing?.label || '',
    },
  );

  return {
    ok: true,
    roleTemplate: result.roleTemplate,
    roleTemplates: result.roleTemplates,
  };
}

export function getBrokerBindingsSnapshot() {
  const session = getSession();
  return {
    ok: true,
    bindings: listBrokerBindings(),
    summary: getBrokerBindingSummary(),
    accessSummary: getUserAccessSummary(session.user.permissions),
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
    health: {
      status: runtimeSnapshot.runtime.mismatch
        ? 'attention'
        : (runtimeSnapshot.runtime.connected ? 'healthy' : 'idle'),
      connected: runtimeSnapshot.runtime.connected,
      requiresAttention: runtimeSnapshot.runtime.mismatch,
      mismatch: runtimeSnapshot.runtime.mismatch,
      lastCheckedAt: runtimeSnapshot.runtime.lastCheckedAt,
      lastError: runtimeSnapshot.runtime.mismatch ? 'binding provider does not match the active gateway adapter' : '',
    },
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
    summary: getBrokerBindingSummary(),
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
    summary: getBrokerBindingSummary(),
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
    summary: getBrokerBindingSummary(),
  };
}
