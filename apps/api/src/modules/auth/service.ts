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

/**
 * Check whether a request may perform `permission`.
 *
 * Local-first policy:
 *  - No Authorization header → treated as the local operator, granted all
 *    core permissions. This keeps the unauthenticated local console working.
 *  - Bearer token present → the token must validate AND its `permissions`
 *    claim must include the requested permission. An invalid/expired token is
 *    rejected (returns false) rather than silently downgraded to local.
 *
 * Note: the gateway `authenticate()` middleware enforces token validity and
 * rejects bad tokens with 401 before routes run. This function performs the
 * additional permission-claim check for token-bearing requests.
 */
export async function hasPermission(permission: string, authHeader?: string): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return CORE_PERMISSIONS.includes(permission);
  }
  try {
    const { verifyToken } = await import('./jwt-service.js');
    const payload = await verifyToken(authHeader.slice(7));
    const granted = Array.isArray(payload.permissions) ? (payload.permissions as string[]) : [];
    return granted.includes(permission);
  } catch {
    return false;
  }
}
