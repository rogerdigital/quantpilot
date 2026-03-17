import { getUserAccount } from '../../../../../packages/control-plane-runtime/src/index.mjs';

export function getSession() {
  const account = getUserAccount();
  const permissions = account.access?.status === 'active' ? (account.access.permissions || []) : [];
  const defaultBrokerBinding = account.brokerBindings.find((binding) => binding.isDefault) || account.brokerBindings[0] || null;

  return {
    ok: true,
    user: {
      id: account.profile.id,
      name: account.profile.name,
      email: account.profile.email,
      role: account.access?.role || account.profile.role,
      organization: account.profile.organization,
      permissions,
      accessStatus: account.access?.status || 'active',
    },
    preferences: account.preferences,
    brokerBinding: defaultBrokerBinding ? {
      id: defaultBrokerBinding.id,
      provider: defaultBrokerBinding.provider,
      label: defaultBrokerBinding.label,
      environment: defaultBrokerBinding.environment,
      status: defaultBrokerBinding.status,
      healthStatus: defaultBrokerBinding.health?.status || 'idle',
    } : null,
    issuedAt: new Date().toISOString(),
  };
}

export function hasPermission(permission) {
  return getSession().user.permissions.includes(permission);
}
