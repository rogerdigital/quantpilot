// @ts-nocheck
const PERMISSION_CATALOG = {
  'dashboard:read': {
    id: 'dashboard:read',
    label: 'Dashboard Read',
    summary: 'Allows the operator to view platform dashboards and monitoring summaries.',
    scope: 'dashboard',
  },
  'strategy:write': {
    id: 'strategy:write',
    label: 'Strategy Write',
    summary: 'Allows the operator to create, edit, promote, archive, and queue strategy research actions.',
    scope: 'strategy',
  },
  'risk:review': {
    id: 'risk:review',
    label: 'Risk Review',
    summary: 'Allows the operator to review backtests and manage risk-gate decisions.',
    scope: 'risk',
  },
  'execution:approve': {
    id: 'execution:approve',
    label: 'Execution Approval',
    summary: 'Allows the operator to approve, reject, cancel, resume, and otherwise control live execution actions.',
    scope: 'execution',
  },
  'account:write': {
    id: 'account:write',
    label: 'Account Write',
    summary: 'Allows the operator to update account profile, preferences, access policy, and broker bindings.',
    scope: 'account',
  },
  'operations:maintain': {
    id: 'operations:maintain',
    label: 'Operations Maintenance',
    summary: 'Allows the operator to inspect control-plane maintenance posture and run backup, restore, and repair actions.',
    scope: 'operations',
  },
};

export function listPermissionDescriptors() {
  return Object.values(PERMISSION_CATALOG);
}

export function getPermissionDescriptor(permission = '') {
  return PERMISSION_CATALOG[permission] || {
    id: permission,
    label: permission,
    summary: 'Allows the operator to perform a guarded platform action.',
    scope: 'platform',
  };
}

export function createForbiddenPayload(permission = '', action = '') {
  const descriptor = getPermissionDescriptor(permission);
  return {
    ok: false,
    error: 'forbidden',
    missingPermission: permission,
    permission: descriptor,
    help: action
      ? `Grant ${permission} to ${action}.`
      : `Grant ${permission} to continue.`,
    message: `missing required permission: ${permission}`,
  };
}

export function writeForbiddenJson(writeJson, res, permission = '', action = '') {
  writeJson(res, 403, createForbiddenPayload(permission, action));
}
