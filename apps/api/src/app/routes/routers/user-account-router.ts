// @ts-nocheck

import { encryptBrokerKey, maskBrokerKey } from '../../../modules/auth/broker-key-service.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';
import {
  getBrokerBindingRuntimeSnapshot,
  getBrokerBindingsSnapshot,
  getUserAccountSnapshot,
  getUserProfileSnapshot,
  getUserRoleTemplatesSnapshot,
  getUserWorkspaceSnapshot,
  patchUserAccess,
  patchUserPreferences,
  patchUserProfile,
  removeBrokerBinding,
  removeUserRoleTemplate,
  saveBrokerBinding,
  saveUserRoleTemplate,
  saveWorkspace,
  selectCurrentWorkspace,
  setPrimaryBrokerBinding,
  syncBrokerBindingRuntime,
} from '../../../modules/user-account/service.js';

export async function handleUserAccountRoutes({
  req,
  reqUrl,
  res,
  readJsonBody,
  writeJson,
  gatewayDependencies,
}) {
  const writeForbidden = (permission, action = '') =>
    writeForbiddenJson(writeJson, res, permission, action);
  const canWrite = () => hasPermission('account:write');

  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account') {
    writeJson(res, 200, getUserAccountSnapshot());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/profile') {
    writeJson(res, 200, getUserProfileSnapshot());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/profile') {
    if (!canWrite()) {
      writeForbidden('account:write', 'update the account profile');
      return true;
    }
    const body = await readJsonBody(req);
    writeJson(res, 200, patchUserProfile(body));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/roles') {
    writeJson(res, 200, getUserRoleTemplatesSnapshot());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/roles') {
    if (!canWrite()) {
      writeForbidden('account:write', 'save role templates');
      return true;
    }
    const body = await readJsonBody(req);
    const result = saveUserRoleTemplate(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'DELETE' && reqUrl.pathname.startsWith('/api/user-account/roles/')) {
    if (!canWrite()) {
      writeForbidden('account:write', 'delete role templates');
      return true;
    }
    const roleId = reqUrl.pathname.split('/').at(-1);
    const result = removeUserRoleTemplate(roleId);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/workspaces') {
    writeJson(res, 200, getUserWorkspaceSnapshot());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/workspaces') {
    if (!canWrite()) {
      writeForbidden('account:write', 'save workspaces');
      return true;
    }
    const body = await readJsonBody(req);
    const result = saveWorkspace(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/workspaces/current') {
    if (!hasPermission('dashboard:read')) {
      writeForbidden('dashboard:read', 'switch workspaces');
      return true;
    }
    const body = await readJsonBody(req);
    const result = selectCurrentWorkspace(body.workspaceId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/preferences') {
    if (!canWrite()) {
      writeForbidden('account:write', 'update account preferences');
      return true;
    }
    const body = await readJsonBody(req);
    writeJson(res, 200, patchUserPreferences(body));
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/access') {
    if (!canWrite()) {
      writeForbidden('account:write', 'update the access policy');
      return true;
    }
    const body = await readJsonBody(req);
    writeJson(res, 200, patchUserAccess(body));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/broker-bindings') {
    const snapshot = getBrokerBindingsSnapshot();
    // Mask any stored API keys before sending to client
    if (snapshot.ok && Array.isArray(snapshot.bindings)) {
      snapshot.bindings = snapshot.bindings.map((b) => ({
        ...b,
        apiKey: b.apiKey ? maskBrokerKey(b.apiKey) : undefined,
        secretKey: b.secretKey ? '****' : undefined,
      }));
    }
    writeJson(res, 200, snapshot);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/broker-bindings/runtime') {
    const result = await getBrokerBindingRuntimeSnapshot(gatewayDependencies.getBrokerHealth);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/broker-bindings') {
    if (!canWrite()) {
      writeForbidden('account:write', 'save broker bindings');
      return true;
    }
    const body = await readJsonBody(req);
    // Encrypt API key before persisting
    if (body && typeof body.apiKey === 'string' && body.apiKey) {
      body.apiKey = encryptBrokerKey(body.apiKey);
    }
    if (body && typeof body.secretKey === 'string' && body.secretKey) {
      body.secretKey = encryptBrokerKey(body.secretKey);
    }
    const result = saveBrokerBinding(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (
    req.method === 'POST' &&
    reqUrl.pathname.endsWith('/default') &&
    reqUrl.pathname.startsWith('/api/user-account/broker-bindings/')
  ) {
    if (!canWrite()) {
      writeForbidden('account:write', 'change the default broker binding');
      return true;
    }
    const bindingId = reqUrl.pathname.split('/').at(-2);
    const result = setPrimaryBrokerBinding(bindingId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'DELETE' && reqUrl.pathname.startsWith('/api/user-account/broker-bindings/')) {
    if (!canWrite()) {
      writeForbidden('account:write', 'delete broker bindings');
      return true;
    }
    const bindingId = reqUrl.pathname.split('/').at(-1);
    const result = removeBrokerBinding(bindingId);
    writeJson(
      res,
      result.ok ? 200 : result.error === 'default broker binding cannot be deleted' ? 409 : 404,
      result
    );
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/broker-bindings/sync') {
    if (!canWrite()) {
      writeForbidden('account:write', 'sync broker runtime state');
      return true;
    }
    const result = await syncBrokerBindingRuntime(gatewayDependencies.getBrokerHealth);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  return false;
}
