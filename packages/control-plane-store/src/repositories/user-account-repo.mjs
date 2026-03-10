import {
  createBrokerBindingEntry,
  createUserAccountProfile,
  createUserPreferences,
} from '../shared.mjs';

const FILENAME = 'user-account.json';

function createDefaultAccountSnapshot() {
  const profile = createUserAccountProfile();
  return {
    profile,
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
    preferences,
    subscription: {
      ...defaults.subscription,
      ...(snapshot.subscription || {}),
    },
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
      return writeSnapshot({
        ...snapshot,
        profile,
      }).profile;
    },
    getUserPreferences() {
      return readSnapshot().preferences;
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
  };
}
