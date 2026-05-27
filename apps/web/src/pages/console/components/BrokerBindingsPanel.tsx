import type {
  UserAccountSnapshot,
  UserBrokerBinding,
  UserBrokerBindingRuntimeSnapshot,
} from '@shared-types/trading.ts';
import { useState } from 'react';
import { fmtDateTime } from '../../../modules/console/console.utils.ts';

type BrokerBindingsPanelProps = {
  locale: 'zh' | 'en';
  account: UserAccountSnapshot | null;
  bindings: UserBrokerBinding[];
  bindingRuntime: UserBrokerBindingRuntimeSnapshot | null;
  canWriteAccount: boolean;
  onSave: (form: typeof initialForm & { permissions: string[] }) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRuntimeSync: () => Promise<void>;
};

const initialForm: {
  id: string;
  provider: string;
  label: string;
  environment: string;
  accountId: string;
  status: string;
  isDefault: boolean;
} = {
  id: '',
  provider: 'alpaca',
  label: '',
  environment: 'paper',
  accountId: '',
  status: 'disconnected',
  isDefault: true,
};

function translateBindingHealth(locale: 'zh' | 'en', status = 'idle') {
  const zhMap: Record<string, string> = {
    healthy: '健康',
    degraded: '降级',
    attention: '待处理',
    idle: '空闲',
  };
  const enMap: Record<string, string> = {
    healthy: 'healthy',
    degraded: 'degraded',
    attention: 'attention',
    idle: 'idle',
  };
  return locale === 'zh' ? zhMap[status] || status : enMap[status] || status;
}

export function BrokerBindingsPanel({
  locale,
  account,
  bindings,
  bindingRuntime,
  canWriteAccount,
  onSave,
  onSetDefault,
  onDelete,
  onRuntimeSync,
}: BrokerBindingsPanelProps) {
  const [bindingForm, setBindingForm] = useState(initialForm);
  const [saveMessage, setSaveMessage] = useState('');

  function syncForm(binding?: UserBrokerBinding | null, bindingCount = bindings.length) {
    setBindingForm({
      id: binding?.id || '',
      provider: binding?.provider || 'alpaca',
      label: binding?.label || '',
      environment: binding?.environment || 'paper',
      accountId: binding?.accountId || '',
      status: binding?.status || 'disconnected',
      isDefault: binding?.isDefault ?? bindingCount === 0,
    });
  }

  async function handleSave() {
    if (!canWriteAccount) return;
    setSaveMessage(locale === 'zh' ? '保存中...' : 'Saving...');
    try {
      await onSave({
        ...bindingForm,
        permissions: bindingForm.environment === 'live' ? ['read', 'trade'] : ['read'],
      });
      setSaveMessage(locale === 'zh' ? '券商绑定已保存。' : 'Broker binding saved.');
    } catch {
      setSaveMessage(locale === 'zh' ? '保存失败' : 'Save failed');
    }
  }

  function handleEdit(binding: UserBrokerBinding) {
    syncForm(binding);
    setSaveMessage(locale === 'zh' ? `正在编辑 ${binding.label}` : `Editing ${binding.label}`);
  }

  function handleCreate() {
    syncForm(null, bindings.length);
    setSaveMessage(locale === 'zh' ? '已切换到新建绑定表单' : 'Ready to create a new binding');
  }

  async function handleRuntimeSync() {
    if (!canWriteAccount) return;
    setSaveMessage(locale === 'zh' ? '同步中...' : 'Syncing...');
    try {
      await onRuntimeSync();
      setSaveMessage(locale === 'zh' ? '运行状态已同步。' : 'Runtime synced.');
    } catch {
      setSaveMessage(locale === 'zh' ? '同步失败' : 'Sync failed');
    }
  }

  return (
    <article className="panel" id="broker-bindings">
      <div className="panel-head">
        <div>
          <div className="panel-title">{locale === 'zh' ? '券商绑定' : 'Broker Bindings'}</div>
          <div className="panel-copy">
            {locale === 'zh'
              ? '绑定列表、默认连接、健康状态和运行时检查现在统一回到账户域里。'
              : 'Bindings, default connections, health states, and runtime checks now roll up into the account domain.'}
          </div>
        </div>
        <div className="panel-badge badge-muted">
          {account?.brokerSummary.total || bindings.length || 1}
        </div>
      </div>
      <div className="policy-card policy-card-inline">
        <div className="policy-row">
          <span>{locale === 'zh' ? '默认绑定' : 'Default Binding'}</span>
          <strong>{account?.brokerSummary.defaultBindingId || 'broker-binding-primary'}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '连接数' : 'Connected Bindings'}</span>
          <strong>{account?.brokerSummary.connected || 0}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '待处理绑定' : 'Bindings Requiring Attention'}</span>
          <strong>{account?.brokerSummary.requiresAttention || 0}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '实盘绑定' : 'Live Bindings'}</span>
          <strong>{account?.brokerSummary.liveBindings || 0}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '最近同步' : 'Last Sync'}</span>
          <strong>{fmtDateTime(account?.brokerSummary.lastSyncAt, locale)}</strong>
        </div>
        {bindings.map((binding) => (
          <div key={binding.id} className="policy-row policy-row-split">
            <span>
              {binding.label}
              {binding.isDefault ? ` (${locale === 'zh' ? '默认' : 'default'})` : ''}
            </span>
            <div className="policy-row-actions">
              <strong>{`${binding.provider} / ${binding.environment} / ${binding.status} / ${translateBindingHealth(locale, binding.health.status)}`}</strong>
              <button
                type="button"
                className="settings-inline-button"
                disabled={!canWriteAccount}
                onClick={() => handleEdit(binding)}
              >
                {locale === 'zh' ? '编辑' : 'Edit'}
              </button>
              {!binding.isDefault ? (
                <button
                  type="button"
                  className="settings-inline-button"
                  disabled={!canWriteAccount}
                  onClick={() => onSetDefault(binding.id)}
                >
                  {locale === 'zh' ? '设为默认' : 'Make Default'}
                </button>
              ) : null}
              {!binding.isDefault ? (
                <button
                  type="button"
                  className="settings-inline-button settings-inline-button-danger"
                  disabled={!canWriteAccount}
                  onClick={() => onDelete(binding.id)}
                >
                  {locale === 'zh' ? '删除' : 'Delete'}
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {!bindings.length ? (
          <div className="status-copy">
            {locale === 'zh'
              ? '尚未加载到远程绑定，当前显示默认券商档案。'
              : 'No remote bindings loaded yet. Showing the default broker record.'}
          </div>
        ) : null}
        {bindings
          .filter((binding) => binding.health.requiresAttention)
          .map((binding) => (
            <div key={`${binding.id}-attention`} className="status-copy">
              {locale === 'zh'
                ? `${binding.label} 需要处理：${binding.health.lastError || (binding.health.mismatch ? '绑定提供商与当前网关适配器不一致。' : '连接状态与目标环境不匹配。')}`
                : `${binding.label} requires attention: ${binding.health.lastError || (binding.health.mismatch ? 'binding provider does not match the active gateway adapter.' : 'connection state does not match the target environment.')}`}
            </div>
          ))}
        {bindingRuntime?.ok ? (
          <>
            <div className="policy-row">
              <span>{locale === 'zh' ? '运行时适配器' : 'Runtime Adapter'}</span>
              <strong>{bindingRuntime.runtime.adapter}</strong>
            </div>
            <div className="policy-row">
              <span>{locale === 'zh' ? '运行时连接' : 'Runtime Connectivity'}</span>
              <strong>{bindingRuntime.runtime.connected ? 'connected' : 'disconnected'}</strong>
            </div>
            <div className="policy-row">
              <span>{locale === 'zh' ? '最近检查' : 'Last Checked'}</span>
              <strong>{fmtDateTime(bindingRuntime.runtime.lastCheckedAt, locale)}</strong>
            </div>
            {bindingRuntime.runtime.mismatch ? (
              <div className="status-copy">
                {locale === 'zh'
                  ? '默认绑定提供商与当前网关适配器不一致，请校准配置。'
                  : 'The default binding provider does not match the active gateway adapter.'}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
      <div className="settings-form-grid">
        <label className="settings-field">
          <span>{locale === 'zh' ? '提供商' : 'Provider'}</span>
          <select
            disabled={!canWriteAccount}
            value={bindingForm.provider}
            onChange={(event) =>
              setBindingForm((current) => ({ ...current, provider: event.target.value }))
            }
          >
            <option value="alpaca">alpaca</option>
            <option value="custom-http">custom-http</option>
          </select>
        </label>
        <label className="settings-field">
          <span>{locale === 'zh' ? '标签' : 'Label'}</span>
          <input
            disabled={!canWriteAccount}
            value={bindingForm.label}
            onChange={(event) =>
              setBindingForm((current) => ({ ...current, label: event.target.value }))
            }
          />
        </label>
        <label className="settings-field">
          <span>{locale === 'zh' ? '环境' : 'Environment'}</span>
          <select
            disabled={!canWriteAccount}
            value={bindingForm.environment}
            onChange={(event) =>
              setBindingForm((current) => ({ ...current, environment: event.target.value }))
            }
          >
            <option value="paper">paper</option>
            <option value="live">live</option>
          </select>
        </label>
        <label className="settings-field">
          <span>{locale === 'zh' ? '状态' : 'Status'}</span>
          <select
            disabled={!canWriteAccount}
            value={bindingForm.status}
            onChange={(event) =>
              setBindingForm((current) => ({ ...current, status: event.target.value }))
            }
          >
            <option value="connected">connected</option>
            <option value="disconnected">disconnected</option>
            <option value="degraded">degraded</option>
            <option value="error">error</option>
          </select>
        </label>
        <label className="settings-field settings-field-wide">
          <span>{locale === 'zh' ? '账户 ID' : 'Account ID'}</span>
          <input
            disabled={!canWriteAccount}
            value={bindingForm.accountId}
            onChange={(event) =>
              setBindingForm((current) => ({ ...current, accountId: event.target.value }))
            }
          />
        </label>
      </div>
      <div className="settings-actions">
        <button
          type="button"
          className="settings-button"
          disabled={!canWriteAccount}
          onClick={handleSave}
        >
          {bindingForm.id
            ? locale === 'zh'
              ? '更新券商绑定'
              : 'Update Broker Binding'
            : locale === 'zh'
              ? '保存券商绑定'
              : 'Save Broker Binding'}
        </button>
        <button
          type="button"
          className="settings-button settings-button-secondary"
          disabled={!canWriteAccount}
          onClick={handleCreate}
        >
          {locale === 'zh' ? '新建绑定' : 'New Binding'}
        </button>
        <button
          type="button"
          className="settings-button settings-button-secondary"
          disabled={!canWriteAccount}
          onClick={handleRuntimeSync}
        >
          {locale === 'zh' ? '同步运行状态' : 'Sync Runtime'}
        </button>
        <div className="status-copy">{saveMessage}</div>
      </div>
    </article>
  );
}
