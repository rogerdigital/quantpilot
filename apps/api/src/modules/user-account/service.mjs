import {
  getUserAccount,
  getUserPreferences,
  getUserProfile,
  listBrokerBindings,
  updateUserProfile,
  updateUserPreferences,
  upsertBrokerBinding,
} from '../../../../../packages/control-plane-runtime/src/index.mjs';

export function getUserAccountSnapshot() {
  const account = getUserAccount();
  return {
    ok: true,
    profile: account.profile,
    preferences: account.preferences,
    subscription: account.subscription,
    brokerBindings: account.brokerBindings,
    updatedAt: account.updatedAt,
  };
}

export function getUserProfileSnapshot() {
  return {
    ok: true,
    profile: getUserProfile(),
    preferences: getUserPreferences(),
  };
}

export function patchUserProfile(payload = {}) {
  const updated = updateUserProfile(payload);
  return {
    ok: true,
    profile: updated,
  };
}

export function patchUserPreferences(payload = {}) {
  const updated = updateUserPreferences(payload);
  return {
    ok: true,
    preferences: updated,
  };
}

export function getBrokerBindingsSnapshot() {
  return {
    ok: true,
    bindings: listBrokerBindings(),
  };
}

export function saveBrokerBinding(payload = {}) {
  if (!payload.provider || !payload.label) {
    return {
      ok: false,
      error: 'provider and label are required',
    };
  }

  const binding = upsertBrokerBinding(payload);
  return {
    ok: true,
    binding,
  };
}
