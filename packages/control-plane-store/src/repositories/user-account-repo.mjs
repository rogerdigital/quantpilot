import {
  createBrokerBindingEntry,
  createTenantEntry,
  createUserAccessPolicy,
  createUserAccountProfile,
  createUserPreferences,
  createUserRoleTemplateEntry,
  createWorkspaceEntry,
  getDefaultPermissionsForRole,
  listUserRoleTemplates,
} from '../shared.mjs';

const FILENAME = 'user-account.json';

function listUnique(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function diffPermissions(base = [], compare = []) {
  return {
    added: compare.filter((item) => !base.includes(item)),
    removed: base.filter((item) => !compare.includes(item)),
  };
}

function intersectPermissions(base = [], scope = []) {
  const baseList = listUnique(base);
  const scopeList = listUnique(scope);
  if (!scopeList.length) return baseList;
  return baseList.filter((item) => scopeList.includes(item));
}

function mergeWorkspaces(rawWorkspaces = [], tenant = createTenantEntry()) {
  const defaultWorkspaces = [
    createWorkspaceEntry({
      id: 'workspace-operations',
      key: 'operations',
      label: 'Operations',
      description: 'Default platform operations workspace.',
      role: 'admin',
      isDefault: true,
      isCurrent: true,
    }, tenant),
    createWorkspaceEntry({
      id: 'workspace-research',
      key: 'research',
      label: 'Research Lab',
      description: 'Research and strategy iteration workspace.',
      role: 'operator',
      isDefault: false,
      isCurrent: false,
    }, tenant),
  ];
  const map = new Map(defaultWorkspaces.map((workspace) => [workspace.id, workspace]));

  if (Array.isArray(rawWorkspaces)) {
    rawWorkspaces.forEach((workspace) => {
      const existing = map.get(workspace.id) || null;
      const entry = createWorkspaceEntry({
        ...existing,
        ...workspace,
      }, tenant);
      map.set(entry.id, entry);
    });
  }

  const items = [...map.values()];
  const currentWorkspaceId = items.find((workspace) => workspace.isCurrent)?.id
    || items.find((workspace) => workspace.isDefault)?.id
    || items[0]?.id
    || '';

  return items.map((workspace, index) => ({
    ...workspace,
    tenantId: workspace.tenantId || tenant.id,
    isDefault: items.some((item) => item.isDefault) ? workspace.isDefault : index === 0,
    isCurrent: workspace.id === currentWorkspaceId,
  }));
}

function toAccessPolicyInput(access = {}, patch = {}) {
  const next = {
    role: patch.role || access.role || 'admin',
    status: patch.status || access.status || 'active',
    grants: Object.prototype.hasOwnProperty.call(patch, 'grants')
      ? patch.grants
      : (access.grants || []),
    revokes: Object.prototype.hasOwnProperty.call(patch, 'revokes')
      ? patch.revokes
      : (access.revokes || []),
    roleTemplateId: patch.roleTemplateId || access.roleTemplateId || patch.role || access.role || 'admin',
  };

  if (Object.prototype.hasOwnProperty.call(patch, 'permissions')) {
    next.permissions = patch.permissions;
  }

  return next;
}

function mergeRoleTemplates(rawTemplates = []) {
  const defaults = listUserRoleTemplates();
  const map = new Map(defaults.map((template) => [template.id, template]));

  if (Array.isArray(rawTemplates)) {
    rawTemplates.forEach((template) => {
      const entry = createUserRoleTemplateEntry(template, defaults);
      map.set(entry.id, {
        ...(map.get(entry.id) || {}),
        ...entry,
      });
    });
  }

  return [...map.values()];
}

function createDefaultAccountSnapshot() {
  const profile = createUserAccountProfile();
  const tenant = createTenantEntry({
    label: profile.organization,
  });
  const workspaces = mergeWorkspaces([], tenant);
  const roleTemplates = listUserRoleTemplates();
  return {
    profile,
    tenant,
    currentWorkspaceId: workspaces.find((workspace) => workspace.isCurrent)?.id || workspaces[0]?.id || '',
    access: createUserAccessPolicy({
      role: profile.role,
    }, roleTemplates),
    preferences: createUserPreferences({
      locale: profile.locale,
      timezone: profile.timezone,
    }),
    subscription: {
      plan: 'internal',
      status: 'active',
    },
    workspaces,
    roleTemplates,
    brokerBindings: [
      createBrokerBindingEntry({
        id: 'broker-binding-primary',
        provider: 'alpaca',
        label: 'Primary Alpaca Paper',
        environment: 'paper',
        accountId: 'paper-main',
        status: 'disconnected',
        permissions: ['read', 'trade'],
        isDefault: true,
      }),
    ],
    updatedAt: new Date().toISOString(),
  };
}

function normalizeSnapshot(snapshot = {}) {
  const defaults = createDefaultAccountSnapshot();
  const tenant = createTenantEntry({
    ...defaults.tenant,
    ...(snapshot.tenant || {}),
    label: snapshot.tenant?.label || snapshot.profile?.organization || defaults.tenant.label,
  });
  const workspaces = mergeWorkspaces(snapshot.workspaces, tenant);
  const currentWorkspaceId = workspaces.find((workspace) => workspace.isCurrent)?.id
    || snapshot.currentWorkspaceId
    || defaults.currentWorkspaceId;
  const roleTemplates = mergeRoleTemplates(snapshot.roleTemplates);
  const profile = createUserAccountProfile({
    ...defaults.profile,
    ...(snapshot.profile || {}),
  });
  const access = createUserAccessPolicy({
    role: profile.role,
    ...(snapshot.access || {}),
  }, roleTemplates);
  const preferences = createUserPreferences({
    ...defaults.preferences,
    ...(snapshot.preferences || {}),
    locale: snapshot.preferences?.locale || profile.locale,
    timezone: snapshot.preferences?.timezone || profile.timezone,
  });
  const brokerBindings = Array.isArray(snapshot.brokerBindings) && snapshot.brokerBindings.length
    ? snapshot.brokerBindings.map((binding, index) => createBrokerBindingEntry({
      ...binding,
      isDefault: index === 0 ? binding.isDefault !== false : Boolean(binding.isDefault),
    }))
    : defaults.brokerBindings;
  const hasDefault = brokerBindings.some((binding) => binding.isDefault);
  const normalizedBindings = brokerBindings.map((binding, index) => ({
    ...binding,
    isDefault: hasDefault ? binding.isDefault : index === 0,
  }));

  return {
    profile,
    tenant,
    currentWorkspaceId,
    currentWorkspace: workspaces.find((workspace) => workspace.id === currentWorkspaceId) || workspaces[0] || null,
    workspaces,
    access,
    preferences,
    subscription: {
      ...defaults.subscription,
      ...(snapshot.subscription || {}),
    },
    roleTemplates,
    brokerBindings: normalizedBindings,
    updatedAt: snapshot.updatedAt || defaults.updatedAt,
  };
}

export function createUserAccountRepository(store) {
  function readSnapshot() {
    return normalizeSnapshot(store.readObject(FILENAME, createDefaultAccountSnapshot()));
  }

  function writeSnapshot(snapshot) {
    const next = {
      ...snapshot,
      updatedAt: new Date().toISOString(),
    };
    store.writeObject(FILENAME, next);
    return next;
  }

  function getAccessSummary(snapshot = readSnapshot(), sessionPermissions = null) {
    const currentWorkspace = snapshot.currentWorkspace || snapshot.workspaces.find((item) => item.id === snapshot.currentWorkspaceId) || null;
    const roleTemplate = snapshot.roleTemplates.find((item) => item.id === snapshot.access.role) || null;
    const defaultPermissions = getDefaultPermissionsForRole(snapshot.access.role, snapshot.roleTemplates);
    const effectivePermissions = snapshot.access.status === 'active'
      ? listUnique(snapshot.access.effectivePermissions || snapshot.access.permissions)
      : [];
    const workspacePermissions = listUnique(currentWorkspace?.effectivePermissions || []);
    const workspaceDefaultPermissions = listUnique(currentWorkspace?.defaultPermissions || []);
    const scopedPermissions = currentWorkspace ? intersectPermissions(effectivePermissions, workspacePermissions) : effectivePermissions;
    const accessDelta = diffPermissions(defaultPermissions, effectivePermissions);
    const sessionList = Array.isArray(sessionPermissions) ? listUnique(sessionPermissions) : scopedPermissions;
    const sessionDelta = diffPermissions(scopedPermissions, sessionList);

    return {
      role: snapshot.access.role,
      roleLabel: roleTemplate?.label || snapshot.access.role,
      status: snapshot.access.status,
      defaultPermissions,
      effectivePermissions,
      workspaceRole: currentWorkspace?.role || '',
      workspaceLabel: currentWorkspace?.label || '',
      workspaceDefaultPermissions,
      workspaceEffectivePermissions: workspacePermissions,
      scopedPermissions,
      grants: listUnique(snapshot.access.grants || []),
      revokes: listUnique(snapshot.access.revokes || []),
      workspaceGrants: listUnique(currentWorkspace?.grants || []),
      workspaceRevokes: listUnique(currentWorkspace?.revokes || []),
      addedPermissions: accessDelta.added,
      removedPermissions: accessDelta.removed,
      sessionPermissions: sessionList,
      sessionAddedPermissions: sessionDelta.added,
      sessionRemovedPermissions: sessionDelta.removed,
      isSessionAligned: sessionDelta.added.length === 0 && sessionDelta.removed.length === 0,
    };
  }

  function getBrokerSummary(snapshot = readSnapshot()) {
    const bindings = snapshot.brokerBindings;
    const defaultBinding = bindings.find((binding) => binding.isDefault) || bindings[0] || null;
    return {
      total: bindings.length,
      connected: bindings.filter((binding) => binding.health?.connected).length,
      requiresAttention: bindings.filter((binding) => binding.health?.requiresAttention).length,
      liveBindings: bindings.filter((binding) => binding.environment === 'live').length,
      paperBindings: bindings.filter((binding) => binding.environment !== 'live').length,
      defaultBindingId: defaultBinding?.id || '',
      defaultProvider: defaultBinding?.provider || '',
      defaultStatus: defaultBinding?.status || 'disconnected',
      defaultHealthStatus: defaultBinding?.health?.status || 'idle',
      lastSyncAt: bindings.map((binding) => binding.lastSyncAt).filter(Boolean).sort().at(0) ? bindings
        .map((binding) => binding.lastSyncAt)
        .filter(Boolean)
        .sort()
        .at(-1) : '',
    };
  }

  return {
    getUserAccount() {
      const snapshot = readSnapshot();
      writeSnapshot(snapshot);
      return snapshot;
    },
    getUserProfile() {
      return readSnapshot().profile;
    },
    getTenant() {
      return readSnapshot().tenant;
    },
    listWorkspaces() {
      return readSnapshot().workspaces;
    },
    getCurrentWorkspace() {
      return readSnapshot().currentWorkspace;
    },
    updateUserProfile(patch = {}) {
      const snapshot = readSnapshot();
      const profile = createUserAccountProfile({
        ...snapshot.profile,
        ...patch,
      });
      const tenant = createTenantEntry({
        ...snapshot.tenant,
        label: patch.organization || profile.organization,
      });
      const workspaces = mergeWorkspaces(snapshot.workspaces, tenant);
      const access = createUserAccessPolicy(
        toAccessPolicyInput(snapshot.access, {
          role: profile.role,
        }),
        snapshot.roleTemplates,
      );
      return writeSnapshot({
        ...snapshot,
        profile,
        tenant,
        workspaces,
        currentWorkspaceId: snapshot.currentWorkspaceId,
        currentWorkspace: workspaces.find((workspace) => workspace.id === snapshot.currentWorkspaceId) || workspaces[0] || null,
        access,
      }).profile;
    },
    getUserPreferences() {
      return readSnapshot().preferences;
    },
    getUserAccess() {
      return readSnapshot().access;
    },
    getAccessSummary(sessionPermissions = null) {
      return getAccessSummary(readSnapshot(), sessionPermissions);
    },
    listRoleTemplates() {
      return readSnapshot().roleTemplates;
    },
    getRoleTemplate(roleId) {
      return readSnapshot().roleTemplates.find((item) => item.id === roleId) || null;
    },
    getBrokerSummary() {
      return getBrokerSummary(readSnapshot());
    },
    upsertWorkspace(payload = {}) {
      const snapshot = readSnapshot();
      const workspaces = mergeWorkspaces([
        ...snapshot.workspaces.filter((item) => item.id !== payload.id),
        payload,
      ], snapshot.tenant);
      const currentWorkspaceId = payload.isCurrent
        ? (workspaces.find((workspace) => workspace.id === payload.id)?.id || snapshot.currentWorkspaceId)
        : (workspaces.find((workspace) => workspace.isCurrent)?.id || snapshot.currentWorkspaceId);
      const nextWorkspaces = workspaces.map((workspace) => ({
        ...workspace,
        isCurrent: workspace.id === currentWorkspaceId,
      }));

      writeSnapshot({
        ...snapshot,
        workspaces: nextWorkspaces,
        currentWorkspaceId,
        currentWorkspace: nextWorkspaces.find((workspace) => workspace.id === currentWorkspaceId) || nextWorkspaces[0] || null,
      });

      return nextWorkspaces.find((workspace) => workspace.id === payload.id) || null;
    },
    setCurrentWorkspace(workspaceId) {
      if (!workspaceId) return null;
      const snapshot = readSnapshot();
      if (!snapshot.workspaces.some((workspace) => workspace.id === workspaceId)) {
        return null;
      }
      const workspaces = snapshot.workspaces.map((workspace) => ({
        ...workspace,
        isCurrent: workspace.id === workspaceId,
      }));

      const next = writeSnapshot({
        ...snapshot,
        workspaces,
        currentWorkspaceId: workspaceId,
        currentWorkspace: workspaces.find((workspace) => workspace.id === workspaceId) || null,
      });

      return next.currentWorkspace;
    },
    updateUserPreferences(patch = {}) {
      const snapshot = readSnapshot();
      const preferences = createUserPreferences({
        ...snapshot.preferences,
        ...patch,
      });
      return writeSnapshot({
        ...snapshot,
        preferences,
      }).preferences;
    },
    updateUserAccess(patch = {}) {
      const snapshot = readSnapshot();
      const access = createUserAccessPolicy(
        toAccessPolicyInput(snapshot.access, {
          ...patch,
          role: patch.role || snapshot.profile.role,
        }),
        snapshot.roleTemplates,
      );
      const profile = createUserAccountProfile({
        ...snapshot.profile,
        role: access.role,
      });
      return writeSnapshot({
        ...snapshot,
        profile,
        access,
        currentWorkspace: snapshot.currentWorkspace,
      }).access;
    },
    upsertRoleTemplate(payload = {}) {
      const snapshot = readSnapshot();
      const roleTemplates = mergeRoleTemplates([
        ...snapshot.roleTemplates.filter((item) => item.id !== payload.id),
        payload,
      ]);
      const access = createUserAccessPolicy(toAccessPolicyInput(snapshot.access), roleTemplates);
      const profile = createUserAccountProfile({
        ...snapshot.profile,
        role: access.role,
      });

      writeSnapshot({
        ...snapshot,
        profile,
        access,
        roleTemplates,
      });

      return roleTemplates.find((item) => item.id === payload.id) || null;
    },
    deleteRoleTemplate(roleId) {
      const snapshot = readSnapshot();
      const existing = snapshot.roleTemplates.find((item) => item.id === roleId);
      if (!existing) {
        return {
          ok: false,
          error: 'role template was not found',
        };
      }
      if (existing.system) {
        return {
          ok: false,
          error: 'system role template cannot be deleted',
        };
      }
      if (snapshot.access.role === roleId || snapshot.profile.role === roleId) {
        return {
          ok: false,
          error: 'active account role template cannot be deleted',
        };
      }

      const roleTemplates = snapshot.roleTemplates.filter((item) => item.id !== roleId);
      writeSnapshot({
        ...snapshot,
        roleTemplates,
      });

      return {
        ok: true,
        roleTemplate: existing,
        roleTemplates,
      };
    },
    listBrokerBindings() {
      return readSnapshot().brokerBindings;
    },
    upsertBrokerBinding(payload = {}) {
      const snapshot = readSnapshot();
      const bindings = [...snapshot.brokerBindings];
      const entry = createBrokerBindingEntry(payload);
      const index = bindings.findIndex((binding) => binding.id === entry.id || (entry.accountId && binding.accountId === entry.accountId));
      const nextBinding = index === -1 ? entry : {
        ...bindings[index],
        ...entry,
        metadata: {
          ...(bindings[index]?.metadata || {}),
          ...(entry.metadata || {}),
        },
      };

      if (index === -1) {
        bindings.unshift(nextBinding);
      } else {
        bindings[index] = nextBinding;
      }

      const normalizedBindings = bindings.map((binding) => ({
        ...binding,
        isDefault: nextBinding.isDefault ? binding.id === nextBinding.id : binding.isDefault,
      }));
      if (!normalizedBindings.some((binding) => binding.isDefault) && normalizedBindings[0]) {
        normalizedBindings[0].isDefault = true;
      }

      writeSnapshot({
        ...snapshot,
        brokerBindings: normalizedBindings,
      });

      return normalizedBindings.find((binding) => binding.id === nextBinding.id) || nextBinding;
    },
    setDefaultBrokerBinding(bindingId) {
      if (!bindingId) return null;
      const snapshot = readSnapshot();
      if (!snapshot.brokerBindings.some((binding) => binding.id === bindingId)) {
        return null;
      }

      const brokerBindings = snapshot.brokerBindings.map((binding) => ({
        ...binding,
        isDefault: binding.id === bindingId,
      }));

      writeSnapshot({
        ...snapshot,
        brokerBindings,
      });

      return brokerBindings.find((binding) => binding.id === bindingId) || null;
    },
    deleteBrokerBinding(bindingId) {
      if (!bindingId) {
        return {
          ok: false,
          error: 'binding id is required',
        };
      }

      const snapshot = readSnapshot();
      const binding = snapshot.brokerBindings.find((item) => item.id === bindingId);
      if (!binding) {
        return {
          ok: false,
          error: 'broker binding was not found',
        };
      }

      if (binding.isDefault) {
        return {
          ok: false,
          error: 'default broker binding cannot be deleted',
        };
      }

      const brokerBindings = snapshot.brokerBindings.filter((item) => item.id !== bindingId);
      writeSnapshot({
        ...snapshot,
        brokerBindings,
      });

      return {
        ok: true,
        binding,
        bindings: brokerBindings,
      };
    },
  };
}
