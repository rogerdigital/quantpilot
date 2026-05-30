import type { UserAccountSnapshot } from '@shared-types/trading.ts';
import { useState } from 'react';
import { formatPermissionReadOnly } from '../../../modules/permissions/permissionCopy.ts';

type AccountProfilePanelProps = {
  locale: 'zh' | 'en';
  account: UserAccountSnapshot | null;
  sessionPermissions: string[];
  accessSummary: UserAccountSnapshot['accessSummary'] | null | undefined;
  canWriteAccount: boolean;
  onSave: (form: {
    name: string;
    email: string;
    organization: string;
    timezone: string;
  }) => Promise<void>;
};

export function AccountProfilePanel({
  locale,
  account,
  sessionPermissions,
  accessSummary,
  canWriteAccount,
  onSave,
}: AccountProfilePanelProps) {
  const [form, setForm] = useState({
    name: account?.profile.name || '',
    email: account?.profile.email || '',
    organization: account?.profile.organization || '',
    timezone: account?.preferences.timezone || 'Asia/Shanghai',
  });
  const [saveMessage, setSaveMessage] = useState('');

  async function handleSave() {
    if (!canWriteAccount) return;
    setSaveMessage(locale === 'zh' ? '保存中...' : 'Saving...');
    try {
      await onSave(form);
      setSaveMessage(locale === 'zh' ? '账户档案已保存。' : 'Profile saved.');
    } catch {
      setSaveMessage(locale === 'zh' ? '保存失败' : 'Save failed');
    }
  }

  return (
    <article className="panel" id="account-profile">
      <div className="panel-head">
        <div>
          <div className="panel-title">{locale === 'zh' ? '账户档案' : 'Account Profile'}</div>
          <div className="panel-copy">
            {locale === 'zh'
              ? '现在由统一账户快照驱动，并会在保存后刷新当前会话。'
              : 'The profile is now driven by a unified account snapshot and refreshes the active session after saves.'}
          </div>
        </div>
        <div className="panel-badge badge-info">ACCOUNT</div>
      </div>
      <div className="policy-card policy-card-inline">
        <div className="policy-row">
          <span>{locale === 'zh' ? '姓名' : 'Name'}</span>
          <strong>{account?.profile.name || 'QuantPilot Operator'}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '邮箱' : 'Email'}</span>
          <strong>{account?.profile.email || 'operator@quantpilot.local'}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '角色' : 'Role'}</span>
          <strong>{account?.profile.role || 'admin'}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '访问状态' : 'Access Status'}</span>
          <strong>{account?.access.status || 'active'}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '当前会话权限' : 'Session Permissions'}</span>
          <strong>{sessionPermissions.join(', ') || 'dashboard:read'}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '权限对齐' : 'Session Alignment'}</span>
          <strong>
            {accessSummary?.isSessionAligned
              ? locale === 'zh'
                ? '已对齐'
                : 'aligned'
              : locale === 'zh'
                ? '待刷新'
                : 'refresh required'}
          </strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '时区' : 'Timezone'}</span>
          <strong>{account?.preferences.timezone || 'Asia/Shanghai'}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '默认模式' : 'Default Mode'}</span>
          <strong>{account?.preferences.defaultMode || 'hybrid'}</strong>
        </div>
      </div>
      {!canWriteAccount ? (
        <div className="status-copy">
          {formatPermissionReadOnly(locale, 'account:write', '账户设置', 'account settings')}
        </div>
      ) : null}
      <div className="settings-form-grid">
        <label className="settings-field">
          <span>{locale === 'zh' ? '姓名' : 'Name'}</span>
          <input
            disabled={!canWriteAccount}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </label>
        <label className="settings-field">
          <span>{locale === 'zh' ? '邮箱' : 'Email'}</span>
          <input
            disabled={!canWriteAccount}
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>
        <label className="settings-field">
          <span>{locale === 'zh' ? '组织' : 'Organization'}</span>
          <input
            disabled={!canWriteAccount}
            value={form.organization}
            onChange={(event) =>
              setForm((current) => ({ ...current, organization: event.target.value }))
            }
          />
        </label>
        <label className="settings-field">
          <span>{locale === 'zh' ? '时区' : 'Timezone'}</span>
          <select
            disabled={!canWriteAccount}
            value={form.timezone}
            onChange={(event) =>
              setForm((current) => ({ ...current, timezone: event.target.value }))
            }
          >
            <option value="Asia/Shanghai">Asia/Shanghai</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        </label>
      </div>
      <div className="settings-actions">
        <button
          type="button"
          className="settings-button"
          disabled={!canWriteAccount}
          onClick={handleSave}
        >
          {locale === 'zh' ? '保存账户档案' : 'Save Profile'}
        </button>
        <div className="status-copy">{saveMessage}</div>
      </div>
    </article>
  );
}
