import {
  createBrokerBindingEntry,
  createUserAccessPolicy,
  createUserAccountProfile,
  createUserPreferences,
  getDefaultPermissionsForRole,
  listUserRoleTemplates,
} from '../shared.mjs';

const FILENAME = 'user-account.json';

function createDefaultAccountSnapshot() {
  const profile = createUserAccountProfile();
  return {
    profile,
    access: createUserAccessPolicy({
      role: profile.role,
    }),
    preferences: createUserPreferences({
      locale: profile.locale,
      timezone: profile.timezone,
    }),
    subscription: {
      plan: 'internal',
      status: 'active',
    },
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
  const profile = createUserAccountProfile({
    ...defaults.profile,
    ...(snapshot.profile || {}),
  });
  const access = createUserAccessPolicy({
    role: profile.role,
    ...(snapshot.access || {}),
  });
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
    access,
    preferences,
    subscription: {
      ...defaults.subscription,
      ...(snapshot.subscription || {}),
    },
    brokerBindings: normalizedBindings,
    updatedAt: snapshot.updatedAt || defaults.updatedAt,
  };
}

function listUnique(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function diffPermissions(base = [], compare = []) {
  return {
    added: compare.filter((item) => !base.includes(item)),
    removed: base.filter((item) => !compare.includes(item)),
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
    const defaultPermissions = getDefaultPermissionsForRole(snapshot.access.role);
    const effectivePermissions = snapshot.access.status === 'active'
      ? listUnique(snapshot.access.permissions)
      : [];
    const accessDelta = diffPermissions(defaultPermissions, effectivePermissions);
    const sessionList = Array.isArray(sessionPermissions) ? listUnique(sessionPermissions) : effectivePermissions;
    const sessionDelta = diffPermissions(effectivePermissions, sessionList);

    return {
      role: snapshot.access.role,
      status: snapshot.access.status,
      defaultPermissions,
      effectivePermissions,
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
    updateUserProfile(patch = {}) {
      const snapshot = readSnapshot();
      const profile = createUserAccountProfile({
        ...snapshot.profile,
        ...patch,
      });
      const access = createUserAccessPolicy({
        ...snapshot.access,
        role: profile.role,
      });
      return writeSnapshot({
        ...snapshot,
        profile,
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
      return listUserRoleTemplates();
    },
    getBrokerSummary() {
      return getBrokerSummary(readSnapshot());
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
      const access = createUserAccessPolicy({
        ...snapshot.access,
        ...patch,
        role: patch.role || snapshot.profile.role,
      });
      const profile = createUserAccountProfile({
        ...snapshot.profile,
        role: access.role,
      });
      return writeSnapshot({
        ...snapshot,
        profile,
        access,
      }).access;
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
