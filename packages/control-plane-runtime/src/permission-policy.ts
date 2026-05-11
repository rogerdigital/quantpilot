// @ts-nocheck

import type { UserRole } from '../../shared-types/src/organization.ts';

export type PermissionAction =
  | 'research:read'
  | 'research:modify'
  | 'backtest:run'
  | 'promotion:approve_paper'
  | 'promotion:approve_live'
  | 'risk:edit_policy'
  | 'risk:kill_switch'
  | 'broker:manage_credentials'
  | 'audit:export_report';

export type PermissionGrant = {
  action: PermissionAction;
  granted: boolean;
  reason: string;
};

export type PermissionPolicy = {
  role: UserRole;
  grants: PermissionGrant[];
};

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  owner: [
    'research:read',
    'research:modify',
    'backtest:run',
    'promotion:approve_paper',
    'promotion:approve_live',
    'risk:edit_policy',
    'risk:kill_switch',
    'broker:manage_credentials',
    'audit:export_report',
  ],
  admin: [
    'research:read',
    'research:modify',
    'backtest:run',
    'promotion:approve_paper',
    'promotion:approve_live',
    'risk:edit_policy',
    'risk:kill_switch',
    'broker:manage_credentials',
    'audit:export_report',
  ],
  portfolio_manager: [
    'research:read',
    'research:modify',
    'backtest:run',
    'promotion:approve_paper',
    'promotion:approve_live',
    'risk:edit_policy',
    'audit:export_report',
  ],
  researcher: ['research:read', 'research:modify', 'backtest:run'],
  risk_officer: [
    'research:read',
    'backtest:run',
    'promotion:approve_paper',
    'risk:edit_policy',
    'risk:kill_switch',
    'audit:export_report',
  ],
  operator: ['research:read', 'backtest:run', 'broker:manage_credentials', 'audit:export_report'],
  viewer: ['research:read'],
};

const ALL_ACTIONS: PermissionAction[] = [
  'research:read',
  'research:modify',
  'backtest:run',
  'promotion:approve_paper',
  'promotion:approve_live',
  'risk:edit_policy',
  'risk:kill_switch',
  'broker:manage_credentials',
  'audit:export_report',
];

export function getPermissionPolicy(role: UserRole): PermissionPolicy {
  const allowedActions = ROLE_PERMISSIONS[role] || [];
  const grants: PermissionGrant[] = ALL_ACTIONS.map((action) => ({
    action,
    granted: allowedActions.includes(action),
    reason: allowedActions.includes(action)
      ? `Granted by ${role} role`
      : `Not available for ${role} role`,
  }));
  return { role, grants };
}

export function isActionAllowed(role: UserRole, action: PermissionAction): boolean {
  const allowedActions = ROLE_PERMISSIONS[role] || [];
  return allowedActions.includes(action);
}

export function evaluatePermissions(
  role: UserRole,
  requestedActions: PermissionAction[]
): { allowed: PermissionGrant[]; denied: PermissionGrant[] } {
  const policy = getPermissionPolicy(role);
  const allowed = policy.grants.filter((g) => g.granted && requestedActions.includes(g.action));
  const denied = policy.grants.filter((g) => !g.granted && requestedActions.includes(g.action));
  return { allowed, denied };
}

export function listAllActions(): PermissionAction[] {
  return [...ALL_ACTIONS];
}

export function getRolePermissions(role: UserRole): PermissionAction[] {
  return [...(ROLE_PERMISSIONS[role] || [])];
}

export function canApprovePromotion(role: UserRole, stage: 'paper' | 'live'): boolean {
  if (stage === 'paper') return isActionAllowed(role, 'promotion:approve_paper');
  return isActionAllowed(role, 'promotion:approve_live');
}

export function canManageRisk(role: UserRole): boolean {
  return isActionAllowed(role, 'risk:edit_policy') || isActionAllowed(role, 'risk:kill_switch');
}
