// @ts-nocheck
import { getUserAccount } from '../../../../../packages/control-plane-runtime/src/index.js';

export function getSession() {
  const account = getUserAccount();
  const defaultBrokerBinding =
    account.brokerBindings.find((binding) => binding.isDefault) ||
    account.brokerBindings[0] ||
    null;
  const currentWorkspace =
    account.currentWorkspace ||
    account.workspaces?.find((workspace) => workspace.isCurrent) ||
    null;
  const accountPermissions =
    account.access?.status === 'active'
      ? account.access.effectivePermissions || account.access.permissions || []
      : [];
  const workspacePermissions = Array.isArray(currentWorkspace?.effectivePermissions)
    ? currentWorkspace.effectivePermissions
    : [];
  const permissions = workspacePermissions.length
    ? accountPermissions.filter((item) => workspacePermissions.includes(item))
    : accountPermissions;

  return {
    ok: true,
    user: {
      id: account.profile.id,
      name: account.profile.name,
      email: account.profile.email,
      role: account.access?.role || account.profile.role,
      organization: account.profile.organization,
      tenantId: account.tenant?.id || '',
      workspaceId: currentWorkspace?.id || '',
      permissions,
      accessStatus: account.access?.status || 'active',
    },
    tenant: account.tenant || null,
    workspace: currentWorkspace,
    preferences: account.preferences,
    brokerBinding: defaultBrokerBinding
      ? {
          id: defaultBrokerBinding.id,
          provider: defaultBrokerBinding.provider,
          label: defaultBrokerBinding.label,
          environment: defaultBrokerBinding.environment,
          status: defaultBrokerBinding.status,
          healthStatus: defaultBrokerBinding.health?.status || 'idle',
        }
      : null,
    issuedAt: new Date().toISOString(),
  };
}

export function hasPermission(permission) {
  return getSession().user.permissions.includes(permission);
}
