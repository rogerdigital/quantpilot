import { getUserAccount } from '../../../../../packages/control-plane-runtime/src/index.mjs';

const ROLE_PERMISSIONS = {
  admin: ['dashboard:read', 'strategy:write', 'risk:review', 'execution:approve', 'account:write'],
  operator: ['dashboard:read', 'strategy:write', 'risk:review'],
  viewer: ['dashboard:read'],
};

export function getSession() {
  const account = getUserAccount();
  const permissions = ROLE_PERMISSIONS[account.profile.role] || ROLE_PERMISSIONS.viewer;
  const defaultBrokerBinding = account.brokerBindings.find((binding) => binding.isDefault) || account.brokerBindings[0] || null;

  return {
    ok: true,
    user: {
      id: account.profile.id,
      name: account.profile.name,
      email: account.profile.email,
      role: account.profile.role,
      organization: account.profile.organization,
      permissions,
    },
    preferences: account.preferences,
    brokerBinding: defaultBrokerBinding ? {
      id: defaultBrokerBinding.id,
      provider: defaultBrokerBinding.provider,
      label: defaultBrokerBinding.label,
      environment: defaultBrokerBinding.environment,
      status: defaultBrokerBinding.status,
    } : null,
    issuedAt: new Date().toISOString(),
  };
}

export function hasPermission(permission) {
  return getSession().user.permissions.includes(permission);
}
