import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ApiPermissionError,
  deleteBrokerBinding,
  fetchBrokerBindingRuntime,
  fetchUserAccount,
  saveBrokerBinding,
  setDefaultBrokerBinding,
  syncBrokerBindingRuntime,
  updateUserAccountAccess,
  updateUserAccountPreferences,
  updateUserAccountProfile,
} from '../../../app/api/controlPlane.ts';
import { useMarketProviderStatus } from '../../../hooks/useMarketProviderStatus.ts';
import {
  formatActionGuardNotice,
  formatPermissionDisabled,
  formatPermissionError,
  formatPermissionReadOnly,
} from '../../../modules/permissions/permissionCopy.ts';
import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';
import { SectionHeader } from '../components/ConsoleChrome.tsx';
import { copy, useLocale } from '../i18n.tsx';
import { connectionLabel, fmtDateTime, modeTone, translateMode, translateProviderLabel, translateRuntimeText } from '../utils.ts';
import type { UserAccountSnapshot, UserBrokerBinding, UserBrokerBindingRuntimeSnapshot } from '@shared-types/trading.ts';

function toPermissionList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

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
  return locale === 'zh' ? (zhMap[status] || status) : (enMap[status] || status);
}

export function SettingsPage() {
  const { locale } = useLocale();
  const { state, session, refreshSession, hasPermission, actionGuardNotice, setMode, updateToggle } = useTradingSystem();
  const location = useLocation();
  const canWriteAccount = hasPermission('account:write');
  const canWriteStrategy = hasPermission('strategy:write');
  const canReviewRisk = hasPermission('risk:review');
  const canApproveExecution = hasPermission('execution:approve');
  const [account, setAccount] = useState<UserAccountSnapshot | null>(null);
  const [bindingRuntime, setBindingRuntime] = useState<UserBrokerBindingRuntimeSnapshot | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    organization: '',
    timezone: 'Asia/Shanghai',
  });
  const [preferencesForm, setPreferencesForm] = useState({
    locale: 'zh-CN',
    defaultMode: 'hybrid',
    notificationChannels: 'inbox',
  });
  const [accessForm, setAccessForm] = useState({
    role: 'admin',
    status: 'active',
    permissions: 'dashboard:read, strategy:write, risk:review, execution:approve, account:write, operations:maintain',
  });
  const [bindingForm, setBindingForm] = useState({
    id: '',
    provider: 'alpaca',
    label: '',
    environment: 'paper',
    accountId: '',
    status: 'disconnected',
    isDefault: true,
  });
  const [saveState, setSaveState] = useState({
    profile: '',
    preferences: '',
    access: '',
    binding: '',
  });
  const { status: marketStatus } = useMarketProviderStatus(state.controlPlane.lastSyncAt);
  const modes = [
    ['autopilot', 'AUTO PILOT'],
    ['hybrid', 'HYBRID'],
    ['manual', 'MANUAL'],
  ] as const;
  const permissionOptions = [
    'dashboard:read',
    'strategy:write',
    'risk:review',
    'execution:approve',
    'account:write',
    'operations:maintain',
  ];
  const bindings = account?.brokerBindings || [];
  const selectedRoleTemplate = account?.roleTemplates.find((item) => item.id === accessForm.role) || null;
  const selectedPermissions = toPermissionList(accessForm.permissions);
  const accessSummary = account?.accessSummary;

  function syncBindingForm(binding?: UserBrokerBinding | null, bindingCount = bindings.length) {
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

  function syncAccountState(snapshot: UserAccountSnapshot, runtimeSnapshot?: UserBrokerBindingRuntimeSnapshot | null) {
    setAccount(snapshot);
    setProfileForm({
      name: snapshot.profile.name,
      email: snapshot.profile.email,
      organization: snapshot.profile.organization,
      timezone: snapshot.profile.timezone,
    });
    setPreferencesForm({
      locale: snapshot.preferences.locale,
      defaultMode: snapshot.preferences.defaultMode,
      notificationChannels: snapshot.preferences.notificationChannels.join(', '),
    });
    setAccessForm({
      role: snapshot.access.role,
      status: snapshot.access.status,
      permissions: snapshot.access.permissions.join(', '),
    });
    const defaultBinding = snapshot.brokerBindings.find((item) => item.isDefault) || snapshot.brokerBindings[0] || null;
    syncBindingForm(defaultBinding, snapshot.brokerBindings.length);
    if (typeof runtimeSnapshot !== 'undefined') {
      setBindingRuntime(runtimeSnapshot);
    }
  }

  async function loadAccountWorkspace() {
    const [accountSnapshot, runtimeSnapshot] = await Promise.all([
      fetchUserAccount(),
      fetchBrokerBindingRuntime().catch(() => null),
    ]);
    syncAccountState(accountSnapshot, runtimeSnapshot);
    return {
      accountSnapshot,
      runtimeSnapshot,
    };
  }

  async function refreshAccountWorkspace() {
    const [result] = await Promise.all([
      loadAccountWorkspace(),
      refreshSession().catch(() => null),
    ]);
    return result;
  }

  function applyRoleTemplate(role: string) {
    const template = account?.roleTemplates.find((item) => item.id === role);
    setAccessForm((current) => ({
      ...current,
      role,
      permissions: template ? template.defaultPermissions.join(', ') : current.permissions,
    }));
  }

  function togglePermission(permission: string) {
    setAccessForm((current) => {
      const permissions = new Set(toPermissionList(current.permissions));
      if (permissions.has(permission)) {
        permissions.delete(permission);
      } else {
        permissions.add(permission);
      }
      return {
        ...current,
        permissions: Array.from(permissions).join(', '),
      };
    });
  }

  const modeDisabledReason = formatPermissionDisabled(locale, 'strategy:write', '切换系统模式', 'change the system mode');
  const autoTradeDisabledReason = formatPermissionDisabled(locale, 'strategy:write', '修改自动交易开关', 'change the auto-trade toggle');
  const riskGuardDisabledReason = formatPermissionDisabled(locale, 'risk:review', '修改风险闸门', 'change the risk-guard toggle');
  const executionDisabledReason = formatPermissionDisabled(locale, 'execution:approve', '修改实盘相关开关', 'change live execution toggles');
  const marketProviderLabel = translateProviderLabel(
    locale,
    marketStatus?.provider === 'alpaca'
      ? 'Alpaca Market Data via Gateway'
      : marketStatus?.provider === 'custom-http'
        ? 'HTTP 行情网关'
        : (state.integrationStatus.marketData.label || state.integrationStatus.marketData.provider),
  );
  const marketConnected = marketStatus?.connected ?? state.integrationStatus.marketData.connected;
  const marketFallback = marketStatus?.fallback ?? !marketConnected;
  const marketMessage = marketStatus?.message || state.integrationStatus.marketData.message;

  useEffect(() => {
    const targetId = location.hash.replace('#', '');
    if (!targetId) return;
    const element = document.getElementById(targetId);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  useEffect(() => {
    let active = true;

    loadAccountWorkspace()
      .catch(() => {
        if (!active) return;
        setAccount(null);
        setBindingRuntime(null);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleProfileSave() {
    if (!canWriteAccount) return;
    setSaveState((current) => ({ ...current, profile: locale === 'zh' ? '保存中...' : 'Saving...' }));
    try {
      await updateUserAccountProfile(profileForm);
      await refreshAccountWorkspace();
      setSaveState((current) => ({ ...current, profile: locale === 'zh' ? '账户档案已保存，并已刷新当前会话。' : 'Profile saved and session refreshed.' }));
    } catch (error) {
      setSaveState((current) => ({ ...current, profile: formatPermissionError(locale, error, '账户档案保存失败', 'Profile save failed', '账户档案保存', 'Profile save') }));
    }
  }

  async function handlePreferencesSave() {
    if (!canWriteAccount) return;
    setSaveState((current) => ({ ...current, preferences: locale === 'zh' ? '保存中...' : 'Saving...' }));
    try {
      await updateUserAccountPreferences({
        locale: preferencesForm.locale,
        defaultMode: preferencesForm.defaultMode,
        notificationChannels: toPermissionList(preferencesForm.notificationChannels),
      });
      await refreshAccountWorkspace();
      setSaveState((current) => ({ ...current, preferences: locale === 'zh' ? '偏好设置已保存，并已刷新当前会话。' : 'Preferences saved and session refreshed.' }));
    } catch (error) {
      setSaveState((current) => ({ ...current, preferences: formatPermissionError(locale, error, '偏好设置保存失败', 'Preferences save failed', '偏好设置保存', 'Preferences save') }));
    }
  }

  async function handleAccessSave() {
    if (!canWriteAccount) return;
    setSaveState((current) => ({ ...current, access: locale === 'zh' ? '保存中...' : 'Saving...' }));
    try {
      await updateUserAccountAccess({
        role: accessForm.role,
        status: accessForm.status,
        permissions: toPermissionList(accessForm.permissions),
      });
      await refreshAccountWorkspace();
      setSaveState((current) => ({ ...current, access: locale === 'zh' ? '访问策略已保存，权限上下文已重新对齐。' : 'Access policy saved and permission context realigned.' }));
    } catch (error) {
      setSaveState((current) => ({ ...current, access: formatPermissionError(locale, error, '访问策略保存失败', 'Access policy save failed', '访问策略保存', 'Access policy save') }));
    }
  }

  async function handleBindingSave() {
    if (!canWriteAccount) return;
    setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '保存中...' : 'Saving...' }));
    try {
      await saveBrokerBinding({
        ...bindingForm,
        permissions: bindingForm.environment === 'live' ? ['read', 'trade'] : ['read'],
      });
      await refreshAccountWorkspace();
      setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '券商绑定已保存，并已刷新默认会话上下文。' : 'Broker binding saved and session context refreshed.' }));
    } catch (error) {
      setSaveState((current) => ({ ...current, binding: formatPermissionError(locale, error, '券商绑定保存失败', 'Broker binding save failed', '券商绑定保存', 'Broker binding save') }));
    }
  }

  async function handleBindingRuntimeSync() {
    if (!canWriteAccount) return;
    setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '同步中...' : 'Syncing...' }));
    try {
      const runtimeSnapshot = await syncBrokerBindingRuntime();
      const refreshed = await refreshAccountWorkspace();
      setBindingRuntime(runtimeSnapshot || refreshed.runtimeSnapshot || null);
      setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '运行状态已同步，绑定健康状态已更新。' : 'Runtime synced and broker health updated.' }));
    } catch (error) {
      setSaveState((current) => ({ ...current, binding: formatPermissionError(locale, error, '运行状态同步失败', 'Runtime sync failed', '运行状态同步', 'Runtime sync') }));
    }
  }

  async function handleBindingSetDefault(bindingId: string) {
    if (!canWriteAccount) return;
    setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '切换默认中...' : 'Switching default...' }));
    try {
      await setDefaultBrokerBinding(bindingId);
      await refreshAccountWorkspace();
      setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '默认券商绑定已更新，并已刷新会话默认连接。' : 'Default broker binding updated and session default refreshed.' }));
    } catch (error) {
      setSaveState((current) => ({ ...current, binding: formatPermissionError(locale, error, '默认券商绑定更新失败', 'Default broker binding update failed', '默认券商绑定更新', 'Default broker binding update') }));
    }
  }

  async function handleBindingDelete(bindingId: string) {
    if (!canWriteAccount) return;
    setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '删除中...' : 'Deleting...' }));
    try {
      await deleteBrokerBinding(bindingId);
      await refreshAccountWorkspace();
      setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '券商绑定已删除。' : 'Broker binding deleted.' }));
    } catch (error) {
      setSaveState((current) => ({ ...current, binding: formatPermissionError(locale, error, '券商绑定删除失败', 'Broker binding delete failed', '券商绑定删除', 'Broker binding delete') }));
    }
  }

  function handleBindingEdit(binding: UserBrokerBinding) {
    syncBindingForm(binding);
    setSaveState((current) => ({ ...current, binding: locale === 'zh' ? `正在编辑 ${binding.label}` : `Editing ${binding.label}` }));
  }

  function handleBindingCreate() {
    syncBindingForm(null, bindings.length);
    setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '已切换到新建绑定表单' : 'Ready to create a new binding' }));
  }

  return (
    <>
      <SectionHeader routeKey="settings" />
      <section className="hero-grid two-up">
        <div className="hero-card hero-card-primary">
          <div className="card-eyebrow">{copy[locale].nav.settings}</div>
          <div className="mini-metric">{copy[locale].product}</div>
          <div className="mini-copy">{copy[locale].settingsIntro}</div>
        </div>
        <div className="hero-card">
          <div className="card-eyebrow">{copy[locale].labels.routing}</div>
          <div className="mini-metric">{translateRuntimeText(locale, state.routeCopy)}</div>
          <div className="mini-copy">{translateRuntimeText(locale, state.integrationStatus.broker.message)}</div>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel" id="system-mode">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].labels.systemMode}</div><div className="panel-copy">{copy[locale].terms.systemModeCopy}</div></div><div className={`panel-badge badge-${modeTone(state.mode)}`}>{translateMode(locale, state.mode)}</div></div>
          <div className="mode-stack">
            {modes.map(([key, label]) => (
              <button key={key} type="button" title={!canWriteStrategy ? modeDisabledReason : undefined} disabled={!canWriteStrategy} className={`mode-pill${state.mode === key ? ' active' : ''}`} onClick={() => setMode(key)}>
                {translateMode(locale, label)}
              </button>
            ))}
          </div>
          {!canWriteStrategy ? <div className="status-copy">{formatPermissionDisabled(locale, 'strategy:write', '切换系统模式', 'change the system mode')}</div> : null}
          {actionGuardNotice?.action === 'set-mode' ? <div className="status-copy">{formatActionGuardNotice(locale, actionGuardNotice)}</div> : null}
        </article>
        <article className="panel" id="switches">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].labels.switches}</div><div className="panel-copy">{copy[locale].terms.switchesCopy}</div></div><div className="panel-badge badge-muted">CONTROL</div></div>
          <label className="switch-row"><span>{copy[locale].labels.autoTrade}</span><input title={!canWriteStrategy ? autoTradeDisabledReason : undefined} type="checkbox" disabled={!canWriteStrategy} checked={state.toggles.autoTrade} onChange={(event) => updateToggle('autoTrade', event.target.checked)} /></label>
          <label className="switch-row"><span>{copy[locale].labels.allowLive}</span><input title={!canApproveExecution ? executionDisabledReason : undefined} type="checkbox" disabled={!canApproveExecution} checked={state.toggles.liveTrade} onChange={(event) => updateToggle('liveTrade', event.target.checked)} /></label>
          <label className="switch-row"><span>{copy[locale].labels.riskGuard}</span><input title={!canReviewRisk ? riskGuardDisabledReason : undefined} type="checkbox" disabled={!canReviewRisk} checked={state.toggles.riskGuard} onChange={(event) => updateToggle('riskGuard', event.target.checked)} /></label>
          <label className="switch-row"><span>{copy[locale].labels.manualApproval}</span><input title={!canApproveExecution ? executionDisabledReason : undefined} type="checkbox" disabled={!canApproveExecution} checked={state.toggles.manualApproval} onChange={(event) => updateToggle('manualApproval', event.target.checked)} /></label>
          <div className="status-copy">
            {locale === 'zh'
              ? 'autoTrade 需要 strategy:write，riskGuard 需要 risk:review，allowLive / manualApproval 需要 execution:approve。'
              : 'autoTrade requires strategy:write, riskGuard requires risk:review, and allowLive/manualApproval require execution:approve.'}
          </div>
          {actionGuardNotice?.action?.startsWith('toggle:') ? (
            <div className="status-copy">{formatActionGuardNotice(locale, actionGuardNotice)}</div>
          ) : null}
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel" id="account-profile">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '账户档案' : 'Account Profile'}</div><div className="panel-copy">{locale === 'zh' ? '现在由统一账户快照驱动，并会在保存后刷新当前会话。' : 'The profile is now driven by a unified account snapshot and refreshes the active session after saves.'}</div></div><div className="panel-badge badge-info">ACCOUNT</div></div>
          <div className="policy-card policy-card-inline">
            <div className="policy-row"><span>{locale === 'zh' ? '姓名' : 'Name'}</span><strong>{account?.profile.name || 'QuantPilot Operator'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '邮箱' : 'Email'}</span><strong>{account?.profile.email || 'operator@quantpilot.local'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '角色' : 'Role'}</span><strong>{account?.profile.role || 'admin'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '访问状态' : 'Access Status'}</span><strong>{account?.access.status || 'active'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '当前会话权限' : 'Session Permissions'}</span><strong>{session?.user.permissions.join(', ') || 'dashboard:read'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '权限对齐' : 'Session Alignment'}</span><strong>{accessSummary?.isSessionAligned ? (locale === 'zh' ? '已对齐' : 'aligned') : (locale === 'zh' ? '待刷新' : 'refresh required')}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '时区' : 'Timezone'}</span><strong>{account?.preferences.timezone || 'Asia/Shanghai'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '默认模式' : 'Default Mode'}</span><strong>{account?.preferences.defaultMode || 'hybrid'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '通知通道' : 'Notifications'}</span><strong>{account?.preferences.notificationChannels.join(', ') || 'inbox'}</strong></div>
          </div>
          {!canWriteAccount ? <div className="status-copy">{formatPermissionReadOnly(locale, 'account:write', '账户设置', 'account settings')}</div> : null}
          <div className="settings-form-grid">
            <label className="settings-field">
              <span>{locale === 'zh' ? '姓名' : 'Name'}</span>
              <input disabled={!canWriteAccount} value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '邮箱' : 'Email'}</span>
              <input disabled={!canWriteAccount} value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '组织' : 'Organization'}</span>
              <input disabled={!canWriteAccount} value={profileForm.organization} onChange={(event) => setProfileForm((current) => ({ ...current, organization: event.target.value }))} />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '时区' : 'Timezone'}</span>
              <select disabled={!canWriteAccount} value={profileForm.timezone} onChange={(event) => setProfileForm((current) => ({ ...current, timezone: event.target.value }))}>
                <option value="Asia/Shanghai">Asia/Shanghai</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </label>
          </div>
          <div className="settings-actions">
            <button type="button" className="settings-button" disabled={!canWriteAccount} onClick={handleProfileSave}>{locale === 'zh' ? '保存账户档案' : 'Save Profile'}</button>
            <div className="status-copy">{saveState.profile}</div>
          </div>
        </article>

        <article className="panel" id="access-policy">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '访问策略' : 'Access Policy'}</div><div className="panel-copy">{locale === 'zh' ? '角色模板、有效权限和当前会话权限现在会一起对比展示。' : 'Role templates, effective permissions, and session permissions are now compared together.'}</div></div><div className="panel-badge badge-warn">{account?.access.role || 'admin'}</div></div>
          <div className="policy-card policy-card-inline">
            <div className="policy-row"><span>{locale === 'zh' ? '当前角色' : 'Current Role'}</span><strong>{account?.access.role || 'admin'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '当前状态' : 'Current Status'}</span><strong>{account?.access.status || 'active'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '模板权限' : 'Template Permissions'}</span><strong>{accessSummary?.defaultPermissions.join(', ') || 'dashboard:read'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '有效权限' : 'Effective Permissions'}</span><strong>{accessSummary?.effectivePermissions.join(', ') || 'dashboard:read'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '扩展权限' : 'Added Permissions'}</span><strong>{accessSummary?.addedPermissions.join(', ') || (locale === 'zh' ? '无' : 'none')}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '被移除模板权限' : 'Removed Template Permissions'}</span><strong>{accessSummary?.removedPermissions.join(', ') || (locale === 'zh' ? '无' : 'none')}</strong></div>
          </div>
          <div className="settings-chip-row">
            {(account?.roleTemplates || []).map((template) => (
              <button
                key={template.id}
                type="button"
                disabled={!canWriteAccount}
                className={`settings-chip${accessForm.role === template.id ? ' active' : ''}`}
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
              <select disabled={!canWriteAccount} value={accessForm.role} onChange={(event) => applyRoleTemplate(event.target.value)}>
                <option value="admin">admin</option>
                <option value="operator">operator</option>
                <option value="viewer">viewer</option>
              </select>
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '状态' : 'Status'}</span>
              <select disabled={!canWriteAccount} value={accessForm.status} onChange={(event) => setAccessForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="active">active</option>
                <option value="disabled">disabled</option>
              </select>
            </label>
            <label className="settings-field settings-field-wide">
              <span>{locale === 'zh' ? '权限清单' : 'Permissions'}</span>
              <input disabled={!canWriteAccount} value={accessForm.permissions} onChange={(event) => setAccessForm((current) => ({ ...current, permissions: event.target.value }))} placeholder="dashboard:read, risk:review" />
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
            <button type="button" className="settings-button" disabled={!canWriteAccount} onClick={handleAccessSave}>{locale === 'zh' ? '保存访问策略' : 'Save Access Policy'}</button>
            <div className="status-copy">{saveState.access}</div>
          </div>
        </article>

        <article className="panel" id="policy">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].labels.policy}</div><div className="panel-copy">{copy[locale].terms.policyCopy}</div></div><div className="panel-badge badge-warn">POLICY</div></div>
          <div className="policy-card policy-card-inline">
            <div className="policy-row"><span>{copy[locale].terms.buyThreshold}</span><strong>{state.config.buyThreshold}</strong></div>
            <div className="policy-row"><span>{copy[locale].terms.sellThreshold}</span><strong>{state.config.sellThreshold}</strong></div>
            <div className="policy-row"><span>{copy[locale].terms.maxPosition}</span><strong>{(state.config.maxPositionWeight * 100).toFixed(0)}%</strong></div>
            <div className="policy-row"><span>{copy[locale].terms.cashBuffer}</span><strong>{(state.config.targetCashBuffer * 100).toFixed(0)}%</strong></div>
            <div className="policy-row"><span>{copy[locale].terms.riskProtection}</span><strong>{state.toggles.riskGuard ? 'ON' : 'OFF'}</strong></div>
          </div>
          <div className="settings-form-grid">
            <label className="settings-field">
              <span>{locale === 'zh' ? '界面语言' : 'Locale'}</span>
              <select disabled={!canWriteAccount} value={preferencesForm.locale} onChange={(event) => setPreferencesForm((current) => ({ ...current, locale: event.target.value }))}>
                <option value="zh-CN">zh-CN</option>
                <option value="en-US">en-US</option>
              </select>
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '默认模式' : 'Default Mode'}</span>
              <select disabled={!canWriteAccount} value={preferencesForm.defaultMode} onChange={(event) => setPreferencesForm((current) => ({ ...current, defaultMode: event.target.value }))}>
                <option value="autopilot">autopilot</option>
                <option value="hybrid">hybrid</option>
                <option value="manual">manual</option>
              </select>
            </label>
            <label className="settings-field settings-field-wide">
              <span>{locale === 'zh' ? '通知通道' : 'Notification Channels'}</span>
              <input disabled={!canWriteAccount} value={preferencesForm.notificationChannels} onChange={(event) => setPreferencesForm((current) => ({ ...current, notificationChannels: event.target.value }))} placeholder="inbox, email" />
            </label>
          </div>
          <div className="settings-actions">
            <button type="button" className="settings-button" disabled={!canWriteAccount} onClick={handlePreferencesSave}>{locale === 'zh' ? '保存偏好设置' : 'Save Preferences'}</button>
            <div className="status-copy">{saveState.preferences}</div>
          </div>
        </article>

        <article className="panel" id="integrations">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].labels.integrations}</div><div className="panel-copy">{copy[locale].terms.marketConnectivity}</div></div><div className="panel-badge badge-info">INTEGRATION</div></div>
          <div className="policy-card policy-card-inline">
            <div className="policy-row"><span>{copy[locale].labels.marketData}</span><strong>{marketProviderLabel}</strong></div>
            <div className="policy-row"><span>{copy[locale].labels.marketState}</span><strong>{connectionLabel(locale, marketConnected, marketFallback)}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? 'Fallback' : 'Fallback'}</span><strong>{marketFallback ? 'ON' : 'OFF'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '最近同步' : 'Last Sync'}</span><strong>{fmtDateTime(marketStatus?.asOf, locale)}</strong></div>
            <div className="policy-row"><span>{copy[locale].labels.broker}</span><strong>{translateProviderLabel(locale, state.integrationStatus.broker.label || state.integrationStatus.broker.provider)}</strong></div>
            <div className="policy-row"><span>{copy[locale].labels.brokerState}</span><strong>{state.integrationStatus.broker.connected ? copy[locale].labels.connected : copy[locale].labels.localOnly}</strong></div>
            <div className="status-copy">{translateRuntimeText(locale, marketMessage)}</div>
            <div className="status-copy">{translateRuntimeText(locale, state.integrationStatus.broker.message)}</div>
          </div>
        </article>

        <article className="panel" id="broker-bindings">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '券商绑定' : 'Broker Bindings'}</div><div className="panel-copy">{locale === 'zh' ? '绑定列表、默认连接、健康状态和运行时检查现在统一回到账户域里。' : 'Bindings, default connections, health states, and runtime checks now roll up into the account domain.'}</div></div><div className="panel-badge badge-muted">{account?.brokerSummary.total || bindings.length || 1}</div></div>
          <div className="policy-card policy-card-inline">
            <div className="policy-row"><span>{locale === 'zh' ? '默认绑定' : 'Default Binding'}</span><strong>{account?.brokerSummary.defaultBindingId || 'broker-binding-primary'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '连接数' : 'Connected Bindings'}</span><strong>{account?.brokerSummary.connected || 0}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '待处理绑定' : 'Bindings Requiring Attention'}</span><strong>{account?.brokerSummary.requiresAttention || 0}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '实盘绑定' : 'Live Bindings'}</span><strong>{account?.brokerSummary.liveBindings || 0}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '最近同步' : 'Last Sync'}</span><strong>{fmtDateTime(account?.brokerSummary.lastSyncAt, locale)}</strong></div>
            {bindings.map((binding) => (
              <div key={binding.id} className="policy-row policy-row-split">
                <span>{binding.label}{binding.isDefault ? ` (${locale === 'zh' ? '默认' : 'default'})` : ''}</span>
                <div className="policy-row-actions">
                  <strong>{`${binding.provider} / ${binding.environment} / ${binding.status} / ${translateBindingHealth(locale, binding.health.status)}`}</strong>
                  <button type="button" className="settings-inline-button" disabled={!canWriteAccount} onClick={() => handleBindingEdit(binding)}>
                    {locale === 'zh' ? '编辑' : 'Edit'}
                  </button>
                  {!binding.isDefault ? (
                    <button type="button" className="settings-inline-button" disabled={!canWriteAccount} onClick={() => handleBindingSetDefault(binding.id)}>
                      {locale === 'zh' ? '设为默认' : 'Make Default'}
                    </button>
                  ) : null}
                  {!binding.isDefault ? (
                    <button type="button" className="settings-inline-button settings-inline-button-danger" disabled={!canWriteAccount} onClick={() => handleBindingDelete(binding.id)}>
                      {locale === 'zh' ? '删除' : 'Delete'}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {!bindings.length ? (
              <div className="status-copy">{locale === 'zh' ? '尚未加载到远程绑定，当前显示默认券商档案。' : 'No remote bindings loaded yet. Showing the default broker record.'}</div>
            ) : null}
            {bindings.filter((binding) => binding.health.requiresAttention).map((binding) => (
              <div key={`${binding.id}-attention`} className="status-copy">
                {locale === 'zh'
                  ? `${binding.label} 需要处理：${binding.health.lastError || (binding.health.mismatch ? '绑定提供商与当前网关适配器不一致。' : '连接状态与目标环境不匹配。')}`
                  : `${binding.label} requires attention: ${binding.health.lastError || (binding.health.mismatch ? 'binding provider does not match the active gateway adapter.' : 'connection state does not match the target environment.')}`}
              </div>
            ))}
            {bindingRuntime?.ok ? (
              <>
                <div className="policy-row"><span>{locale === 'zh' ? '运行时适配器' : 'Runtime Adapter'}</span><strong>{bindingRuntime.runtime.adapter}</strong></div>
                <div className="policy-row"><span>{locale === 'zh' ? '运行时连接' : 'Runtime Connectivity'}</span><strong>{bindingRuntime.runtime.connected ? 'connected' : 'disconnected'}</strong></div>
                <div className="policy-row"><span>{locale === 'zh' ? '最近检查' : 'Last Checked'}</span><strong>{fmtDateTime(bindingRuntime.runtime.lastCheckedAt, locale)}</strong></div>
                {bindingRuntime.runtime.mismatch ? (
                  <div className="status-copy">{locale === 'zh' ? '默认绑定提供商与当前网关适配器不一致，请校准配置。' : 'The default binding provider does not match the active gateway adapter.'}</div>
                ) : null}
              </>
            ) : null}
          </div>
          <div className="settings-form-grid">
            <label className="settings-field">
              <span>{locale === 'zh' ? '提供商' : 'Provider'}</span>
              <select disabled={!canWriteAccount} value={bindingForm.provider} onChange={(event) => setBindingForm((current) => ({ ...current, provider: event.target.value }))}>
                <option value="alpaca">alpaca</option>
                <option value="custom-http">custom-http</option>
              </select>
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '标签' : 'Label'}</span>
              <input disabled={!canWriteAccount} value={bindingForm.label} onChange={(event) => setBindingForm((current) => ({ ...current, label: event.target.value }))} />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '环境' : 'Environment'}</span>
              <select disabled={!canWriteAccount} value={bindingForm.environment} onChange={(event) => setBindingForm((current) => ({ ...current, environment: event.target.value }))}>
                <option value="paper">paper</option>
                <option value="live">live</option>
              </select>
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '状态' : 'Status'}</span>
              <select disabled={!canWriteAccount} value={bindingForm.status} onChange={(event) => setBindingForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="connected">connected</option>
                <option value="disconnected">disconnected</option>
                <option value="degraded">degraded</option>
                <option value="error">error</option>
              </select>
            </label>
            <label className="settings-field settings-field-wide">
              <span>{locale === 'zh' ? '账户 ID' : 'Account ID'}</span>
              <input disabled={!canWriteAccount} value={bindingForm.accountId} onChange={(event) => setBindingForm((current) => ({ ...current, accountId: event.target.value }))} />
            </label>
          </div>
          <div className="settings-actions">
            <button type="button" className="settings-button" disabled={!canWriteAccount} onClick={handleBindingSave}>{bindingForm.id ? (locale === 'zh' ? '更新券商绑定' : 'Update Broker Binding') : (locale === 'zh' ? '保存券商绑定' : 'Save Broker Binding')}</button>
            <button type="button" className="settings-button settings-button-secondary" disabled={!canWriteAccount} onClick={handleBindingCreate}>{locale === 'zh' ? '新建绑定' : 'New Binding'}</button>
            <button type="button" className="settings-button settings-button-secondary" disabled={!canWriteAccount} onClick={handleBindingRuntimeSync}>{locale === 'zh' ? '同步运行状态' : 'Sync Runtime'}</button>
            <div className="status-copy">{saveState.binding}</div>
          </div>
        </article>
      </section>
    </>
  );
}
