import type { UserAccountSnapshot } from '@shared-types/trading.ts';
import { useState } from 'react';

function toPermissionList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const permissionOptions = [
  'dashboard:read',
  'strategy:write',
  'risk:review',
  'execution:approve',
  'account:write',
  'operations:maintain',
];

type AccessPolicyPanelProps = {
  locale: 'zh' | 'en';
  account: UserAccountSnapshot | null;
  accessSummary: UserAccountSnapshot['accessSummary'] | null | undefined;
  canWriteAccount: boolean;
  onSave: (data: { role: string; status: string; permissions: string[] }) => Promise<void>;
};

export function AccessPolicyPanel({
  locale,
  account,
  accessSummary,
  canWriteAccount,
  onSave,
}: AccessPolicyPanelProps) {
  const [form, setForm] = useState({
    role: account?.access.role || 'admin',
    status: account?.access.status || 'active',
    permissions: account?.access.permissions.join(', ') || '',
  });
  const [saveMessage, setSaveMessage] = useState('');

  function applyRoleTemplate(role: string) {
    const template = account?.roleTemplates.find((item) => item.id === role);
    setForm((current) => ({
      ...current,
      role,
      permissions: template ? template.defaultPermissions.join(', ') : current.permissions,
    }));
  }

  function togglePermission(permission: string) {
    setForm((current) => {
      const permissions = new Set(toPermissionList(current.permissions));
      if (permissions.has(permission)) {
        permissions.delete(permission);
      } else {
        permissions.add(permission);
      }
      return { ...current, permissions: Array.from(permissions).join(', ') };
    });
  }

  async function handleSave() {
    if (!canWriteAccount) return;
    setSaveMessage(locale === 'zh' ? '保存中...' : 'Saving...');
    try {
      await onSave({
        role: form.role,
        status: form.status,
        permissions: toPermissionList(form.permissions),
      });
      setSaveMessage(locale === 'zh' ? '访问策略已保存。' : 'Access policy saved.');
    } catch {
      setSaveMessage(locale === 'zh' ? '保存失败' : 'Save failed');
    }
  }

  const selectedRoleTemplate = account?.roleTemplates.find((item) => item.id === form.role) || null;
  const selectedPermissions = toPermissionList(form.permissions);

  return (
    <article className="panel" id="access-policy">
      <div className="panel-head">
        <div>
          <div className="panel-title">{locale === 'zh' ? '访问策略' : 'Access Policy'}</div>
          <div className="panel-copy">
            {locale === 'zh'
              ? '角色模板、有效权限和当前会话权限现在会一起对比展示。'
              : 'Role templates, effective permissions, and session permissions are now compared together.'}
          </div>
        </div>
        <div className="panel-badge badge-warn">{account?.access.role || 'admin'}</div>
      </div>
      <div className="policy-card policy-card-inline">
        <div className="policy-row">
          <span>{locale === 'zh' ? '当前角色' : 'Current Role'}</span>
          <strong>{account?.access.role || 'admin'}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '当前状态' : 'Current Status'}</span>
          <strong>{account?.access.status || 'active'}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '模板权限' : 'Template Permissions'}</span>
          <strong>{accessSummary?.defaultPermissions.join(', ') || 'dashboard:read'}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '有效权限' : 'Effective Permissions'}</span>
          <strong>{accessSummary?.effectivePermissions.join(', ') || 'dashboard:read'}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '扩展权限' : 'Added Permissions'}</span>
          <strong>
            {accessSummary?.addedPermissions.join(', ') || (locale === 'zh' ? '无' : 'none')}
          </strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '被移除模板权限' : 'Removed Template Permissions'}</span>
          <strong>
            {accessSummary?.removedPermissions.join(', ') || (locale === 'zh' ? '无' : 'none')}
          </strong>
        </div>
      </div>
      <div className="settings-chip-row">
        {(account?.roleTemplates || []).map((template) => (
          <button
            key={template.id}
            type="button"
            disabled={!canWriteAccount}
            className={`settings-chip${form.role === template.id ? ' active' : ''}`}
            onClick={() => applyRoleTemplate(template.id)}
            title={template.summary}
          >
            {template.id}
          </button>
        ))}
      </div>
      {selectedRoleTemplate ? (
        <div className="status-copy">
          {locale === 'zh'
            ? `${selectedRoleTemplate.label}: ${selectedRoleTemplate.summary}`
            : `${selectedRoleTemplate.label}: ${selectedRoleTemplate.summary}`}
        </div>
      ) : null}
      {!accessSummary?.isSessionAligned ? (
        <div className="status-copy">
          {locale === 'zh'
            ? `当前会话仍保留 ${accessSummary?.sessionPermissions.join(', ') || 'dashboard:read'}，保存后会自动刷新。`
            : `The active session still carries ${accessSummary?.sessionPermissions.join(', ') || 'dashboard:read'} and will be refreshed after saving.`}
        </div>
      ) : null}
      <div className="settings-form-grid">
        <label className="settings-field">
          <span>{locale === 'zh' ? '角色' : 'Role'}</span>
          <select
            disabled={!canWriteAccount}
            value={form.role}
            onChange={(event) => applyRoleTemplate(event.target.value)}
          >
            <option value="admin">admin</option>
            <option value="operator">operator</option>
            <option value="viewer">viewer</option>
          </select>
        </label>
        <label className="settings-field">
          <span>{locale === 'zh' ? '状态' : 'Status'}</span>
          <select
            disabled={!canWriteAccount}
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="active">active</option>
            <option value="disabled">disabled</option>
          </select>
        </label>
        <label className="settings-field settings-field-wide">
          <span>{locale === 'zh' ? '权限清单' : 'Permissions'}</span>
          <input
            disabled={!canWriteAccount}
            value={form.permissions}
            onChange={(event) =>
              setForm((current) => ({ ...current, permissions: event.target.value }))
            }
            placeholder="dashboard:read, risk:review"
          />
        </label>
      </div>
      <div className="settings-chip-row">
        {permissionOptions.map((permission) => {
          const selected = selectedPermissions.includes(permission);
          return (
            <button
              key={permission}
              type="button"
              disabled={!canWriteAccount}
              className={`settings-chip${selected ? ' active' : ''}`}
              onClick={() => togglePermission(permission)}
            >
              {permission}
            </button>
          );
        })}
      </div>
      <div className="settings-actions">
        <button
          type="button"
          className="settings-button"
          disabled={!canWriteAccount}
          onClick={handleSave}
        >
          {locale === 'zh' ? '保存访问策略' : 'Save Access Policy'}
        </button>
        <div className="status-copy">{saveMessage}</div>
      </div>
    </article>
  );
}
