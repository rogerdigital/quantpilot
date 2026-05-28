import { getUserAccount } from '../../../../../packages/control-plane-runtime/src/index.js';
import { verifyToken } from './jwt-service.js';

/**
 * Resolve the session from the default control-plane account.
 * This is synchronous and does NOT validate any Bearer token.
 */
export function getSession() {
  const account = getUserAccount();
  const defaultBrokerBinding =
    account.brokerBindings.find((binding: any) => binding.isDefault) ||
    account.brokerBindings[0] ||
    null;
  const currentWorkspace =
    account.currentWorkspace ||
    account.workspaces?.find((workspace: any) => workspace.isCurrent) ||
    null;
  const accountPermissions =
    account.access?.status === 'active'
      ? account.access.effectivePermissions || account.access.permissions || []
      : [];
  const workspacePermissions = Array.isArray(currentWorkspace?.effectivePermissions)
    ? currentWorkspace.effectivePermissions
    : [];
  const permissions = workspacePermissions.length
    ? accountPermissions.filter((item: any) => workspacePermissions.includes(item))
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

/** Validate a Bearer token and return JWT-based session fields if valid. */
export async function getSessionFromToken(authHeader: string) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    return {
      ok: true,
      user: {
        id: payload.userId as string,
        name: (payload.userId as string) || '',
        email: '',
        role: 'operator',
        organization: '',
        tenantId: '',
        workspaceId: '',
        permissions: Array.isArray(payload.permissions) ? (payload.permissions as string[]) : [],
        accessStatus: 'active',
      },
      issuedAt: new Date().toISOString(),
      source: 'jwt' as const,
    };
  } catch {
    return null;
  }
}

/**
 * Check whether the current caller holds a specific permission.
 *
 * If a valid Bearer token is present in authHeader, permissions are resolved
 * from the JWT payload. Otherwise falls back to the default control-plane
 * account permissions (getSession()).
 *
 * This function is async because JWT verification is async.
 */
export async function hasPermission(permission: string, authHeader?: string): Promise<boolean> {
  if (authHeader) {
    const jwtSession = await getSessionFromToken(authHeader);
    if (jwtSession) {
      return jwtSession.user.permissions.includes(permission);
    }
  }
  return getSession().user.permissions.includes(permission);
}
