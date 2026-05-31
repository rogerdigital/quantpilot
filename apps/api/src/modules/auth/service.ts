const CORE_PERMISSIONS = [
  'dashboard:read',
  'strategy:write',
  'risk:review',
  'execution:approve',
  'account:write',
];

export function getSession() {
  return {
    ok: true,
    user: {
      id: 'local-user',
      name: 'Local Operator',
      email: 'operator@quantpilot.local',
      role: 'operator',
      organization: 'Local',
      tenantId: 'local',
      workspaceId: 'core-console',
      permissions: CORE_PERMISSIONS,
      accessStatus: 'active',
    },
    tenant: null,
    workspace: {
      id: 'core-console',
      tenantId: 'local',
      key: 'core-console',
      label: 'Core Console',
      description: 'Local core console workspace.',
      role: 'operator',
      grants: [],
      revokes: [],
      defaultPermissions: CORE_PERMISSIONS,
      effectivePermissions: CORE_PERMISSIONS,
      status: 'active',
      isDefault: true,
      isCurrent: true,
    },
    preferences: {
      locale: 'en',
      timezone: 'Asia/Shanghai',
      defaultMode: 'simulated',
      notificationChannels: [],
    },
    brokerBinding: null,
    issuedAt: new Date().toISOString(),
  };
}

export async function hasPermission(permission: string, _authHeader?: string): Promise<boolean> {
  return CORE_PERMISSIONS.includes(permission);
}
