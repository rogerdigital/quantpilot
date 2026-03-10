import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  deleteBrokerBinding,
  fetchBrokerBindings,
  fetchBrokerBindingRuntime,
  fetchUserAccountProfile,
  saveBrokerBinding,
  setDefaultBrokerBinding,
  syncBrokerBindingRuntime,
  updateUserAccountAccess,
  updateUserAccountPreferences,
  updateUserAccountProfile,
} from '../../../app/api/controlPlane.ts';
import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';
import { SectionHeader } from '../components/ConsoleChrome.tsx';
import { copy, useLocale } from '../i18n.tsx';
import { modeTone, translateMode, translateProviderLabel, translateRuntimeText } from '../utils.ts';
import type { UserAccountProfileSnapshot, UserBrokerBinding, UserBrokerBindingRuntimeSnapshot } from '@shared-types/trading.ts';

export function SettingsPage() {
  const { locale } = useLocale();
  const { state, session, hasPermission, setMode, updateToggle } = useTradingSystem();
  const location = useLocation();
  const canWriteAccount = hasPermission('account:write');
  const canWriteStrategy = hasPermission('strategy:write');
  const canReviewRisk = hasPermission('risk:review');
  const canApproveExecution = hasPermission('execution:approve');
  const [account, setAccount] = useState<UserAccountProfileSnapshot | null>(null);
  const [bindings, setBindings] = useState<UserBrokerBinding[]>([]);
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
    permissions: 'dashboard:read, strategy:write, risk:review, execution:approve, account:write',
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
  ];

  function syncBindingForm(binding?: UserBrokerBinding | null) {
    setBindingForm({
      id: binding?.id || '',
      provider: binding?.provider || 'alpaca',
      label: binding?.label || '',
      environment: binding?.environment || 'paper',
      accountId: binding?.accountId || '',
      status: binding?.status || 'disconnected',
      isDefault: binding?.isDefault ?? bindings.length === 0,
    });
  }

  async function refreshBrokerBindingState() {
    const [brokerSnapshot, runtimeSnapshot] = await Promise.all([
      fetchBrokerBindings(),
      fetchBrokerBindingRuntime().catch(() => null),
    ]);
    setBindings(brokerSnapshot.bindings);
    setBindingRuntime(runtimeSnapshot);
    return {
      bindings: brokerSnapshot.bindings,
      runtime: runtimeSnapshot,
    };
  }

  useEffect(() => {
    const targetId = location.hash.replace('#', '');
    if (!targetId) return;
    const element = document.getElementById(targetId);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  useEffect(() => {
    let active = true;

    Promise.all([fetchUserAccountProfile(), fetchBrokerBindings(), fetchBrokerBindingRuntime().catch(() => null)])
      .then(([profileSnapshot, brokerSnapshot, runtimeSnapshot]) => {
        if (!active) return;
        setAccount(profileSnapshot);
        setBindings(brokerSnapshot.bindings);
        setBindingRuntime(runtimeSnapshot);
        setProfileForm({
          name: profileSnapshot.profile.name,
          email: profileSnapshot.profile.email,
          organization: profileSnapshot.profile.organization,
          timezone: profileSnapshot.profile.timezone,
        });
        setPreferencesForm({
          locale: profileSnapshot.preferences.locale,
          defaultMode: profileSnapshot.preferences.defaultMode,
          notificationChannels: profileSnapshot.preferences.notificationChannels.join(', '),
        });
        setAccessForm({
          role: profileSnapshot.access.role,
          status: profileSnapshot.access.status,
          permissions: profileSnapshot.access.permissions.join(', '),
        });
        const defaultBinding = brokerSnapshot.bindings.find((item) => item.isDefault) || brokerSnapshot.bindings[0];
        syncBindingForm(defaultBinding);
      })
      .catch(() => {
        if (!active) return;
        setAccount(null);
        setBindings([]);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleProfileSave() {
    if (!canWriteAccount) return;
    setSaveState((current) => ({ ...current, profile: locale === 'zh' ? '保存中...' : 'Saving...' }));
    try {
      const result = await updateUserAccountProfile(profileForm);
      setAccount((current) => current ? { ...current, profile: result.profile } : current);
      setSaveState((current) => ({ ...current, profile: locale === 'zh' ? '账户档案已保存' : 'Profile saved' }));
    } catch {
      setSaveState((current) => ({ ...current, profile: locale === 'zh' ? '账户档案保存失败' : 'Profile save failed' }));
    }
  }

  async function handlePreferencesSave() {
    if (!canWriteAccount) return;
    setSaveState((current) => ({ ...current, preferences: locale === 'zh' ? '保存中...' : 'Saving...' }));
    try {
      const result = await updateUserAccountPreferences({
        locale: preferencesForm.locale,
        defaultMode: preferencesForm.defaultMode,
        notificationChannels: preferencesForm.notificationChannels.split(',').map((item) => item.trim()).filter(Boolean),
      });
      setAccount((current) => current ? { ...current, preferences: result.preferences } : current);
      setSaveState((current) => ({ ...current, preferences: locale === 'zh' ? '偏好设置已保存' : 'Preferences saved' }));
    } catch {
      setSaveState((current) => ({ ...current, preferences: locale === 'zh' ? '偏好设置保存失败' : 'Preferences save failed' }));
    }
  }

  async function handleAccessSave() {
    if (!canWriteAccount) return;
    setSaveState((current) => ({ ...current, access: locale === 'zh' ? '保存中...' : 'Saving...' }));
    try {
      const result = await updateUserAccountAccess({
        role: accessForm.role,
        status: accessForm.status,
        permissions: accessForm.permissions.split(',').map((item) => item.trim()).filter(Boolean),
      });
      setAccount((current) => current ? { ...current, access: result.access, profile: { ...current.profile, role: result.access.role } } : current);
      setAccessForm({
        role: result.access.role,
        status: result.access.status,
        permissions: result.access.permissions.join(', '),
      });
      setSaveState((current) => ({ ...current, access: locale === 'zh' ? '访问策略已保存' : 'Access policy saved' }));
    } catch {
      setSaveState((current) => ({ ...current, access: locale === 'zh' ? '访问策略保存失败' : 'Access policy save failed' }));
    }
  }

  function togglePermission(permission: string) {
    setAccessForm((current) => {
      const permissions = new Set(current.permissions.split(',').map((item) => item.trim()).filter(Boolean));
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

  async function handleBindingSave() {
    if (!canWriteAccount) return;
    setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '保存中...' : 'Saving...' }));
    try {
      const result = await saveBrokerBinding({
        ...bindingForm,
        permissions: bindingForm.environment === 'live' ? ['read', 'trade'] : ['read'],
      });
      const { bindings: nextBindings } = await refreshBrokerBindingState();
      const currentBinding = nextBindings.find((item) => item.id === result.binding.id) || result.binding;
      syncBindingForm(currentBinding);
      setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '券商绑定已保存' : 'Broker binding saved' }));
    } catch {
      setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '券商绑定保存失败' : 'Broker binding save failed' }));
    }
  }

  async function handleBindingRuntimeSync() {
    if (!canWriteAccount) return;
    setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '同步中...' : 'Syncing...' }));
    try {
      const runtimeSnapshot = await syncBrokerBindingRuntime();
      const brokerSnapshot = await fetchBrokerBindings();
      setBindingRuntime(runtimeSnapshot);
      setBindings(brokerSnapshot.bindings);
      setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '运行状态已同步' : 'Runtime synced' }));
    } catch {
      setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '运行状态同步失败' : 'Runtime sync failed' }));
    }
  }

  async function handleBindingSetDefault(bindingId: string) {
    if (!canWriteAccount) return;
    setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '切换默认中...' : 'Switching default...' }));
    try {
      const result = await setDefaultBrokerBinding(bindingId);
      setBindings(result.bindings || []);
      syncBindingForm(result.binding);
      const runtimeSnapshot = await fetchBrokerBindingRuntime().catch(() => null);
      setBindingRuntime(runtimeSnapshot);
      setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '默认券商绑定已更新' : 'Default broker binding updated' }));
    } catch {
      setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '默认券商绑定更新失败' : 'Default broker binding update failed' }));
    }
  }

  async function handleBindingDelete(bindingId: string) {
    if (!canWriteAccount) return;
    setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '删除中...' : 'Deleting...' }));
    try {
      const result = await deleteBrokerBinding(bindingId);
      const nextBindings = result.bindings || [];
      setBindings(nextBindings);
      const defaultBinding = nextBindings.find((item) => item.isDefault) || nextBindings[0] || null;
      syncBindingForm(defaultBinding);
      const runtimeSnapshot = await fetchBrokerBindingRuntime().catch(() => null);
      setBindingRuntime(runtimeSnapshot);
      setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '券商绑定已删除' : 'Broker binding deleted' }));
    } catch {
      setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '券商绑定删除失败' : 'Broker binding delete failed' }));
    }
  }

  function handleBindingEdit(binding: UserBrokerBinding) {
    syncBindingForm(binding);
    setSaveState((current) => ({ ...current, binding: locale === 'zh' ? `正在编辑 ${binding.label}` : `Editing ${binding.label}` }));
  }

  function handleBindingCreate() {
    syncBindingForm(null);
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
              <button key={key} type="button" disabled={!canWriteStrategy} className={`mode-pill${state.mode === key ? ' active' : ''}`} onClick={() => setMode(key)}>
                {translateMode(locale, label)}
              </button>
            ))}
          </div>
          {!canWriteStrategy ? <div className="status-copy">{locale === 'zh' ? '当前会话没有 strategy:write 权限，系统模式切换已禁用。' : 'This session does not have strategy:write permission. Mode switching is disabled.'}</div> : null}
        </article>
        <article className="panel" id="switches">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].labels.switches}</div><div className="panel-copy">{copy[locale].terms.switchesCopy}</div></div><div className="panel-badge badge-muted">CONTROL</div></div>
          <label className="switch-row"><span>{copy[locale].labels.autoTrade}</span><input type="checkbox" disabled={!canWriteStrategy} checked={state.toggles.autoTrade} onChange={(event) => updateToggle('autoTrade', event.target.checked)} /></label>
          <label className="switch-row"><span>{copy[locale].labels.allowLive}</span><input type="checkbox" disabled={!canApproveExecution} checked={state.toggles.liveTrade} onChange={(event) => updateToggle('liveTrade', event.target.checked)} /></label>
          <label className="switch-row"><span>{copy[locale].labels.riskGuard}</span><input type="checkbox" disabled={!canReviewRisk} checked={state.toggles.riskGuard} onChange={(event) => updateToggle('riskGuard', event.target.checked)} /></label>
          <label className="switch-row"><span>{copy[locale].labels.manualApproval}</span><input type="checkbox" disabled={!canApproveExecution} checked={state.toggles.manualApproval} onChange={(event) => updateToggle('manualApproval', event.target.checked)} /></label>
          <div className="status-copy">
            {locale === 'zh'
              ? `autoTrade 需要 strategy:write，riskGuard 需要 risk:review，allowLive / manualApproval 需要 execution:approve。`
              : 'autoTrade requires strategy:write, riskGuard requires risk:review, and allowLive/manualApproval require execution:approve.'}
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel" id="account-profile">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '账户档案' : 'Account Profile'}</div><div className="panel-copy">{locale === 'zh' ? '当前操作员、偏好设置和默认工作模式。' : 'Current operator profile, preferences, and default workspace mode.'}</div></div><div className="panel-badge badge-info">ACCOUNT</div></div>
          <div className="policy-card policy-card-inline">
            <div className="policy-row"><span>{locale === 'zh' ? '姓名' : 'Name'}</span><strong>{account?.profile.name || 'QuantPilot Operator'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '邮箱' : 'Email'}</span><strong>{account?.profile.email || 'operator@quantpilot.local'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '角色' : 'Role'}</span><strong>{account?.profile.role || 'admin'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '访问状态' : 'Access Status'}</span><strong>{account?.access.status || 'active'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '当前会话权限' : 'Session Permissions'}</span><strong>{session?.user.permissions.join(', ') || 'dashboard:read'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '时区' : 'Timezone'}</span><strong>{account?.preferences.timezone || 'Asia/Shanghai'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '默认模式' : 'Default Mode'}</span><strong>{account?.preferences.defaultMode || 'hybrid'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '通知通道' : 'Notifications'}</span><strong>{account?.preferences.notificationChannels.join(', ') || 'inbox'}</strong></div>
          </div>
          {!canWriteAccount ? <div className="status-copy">{locale === 'zh' ? '当前会话没有 account:write 权限，账户设置已切换为只读。' : 'This session does not have account:write permission. Account settings are read-only.'}</div> : null}
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
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '访问策略' : 'Access Policy'}</div><div className="panel-copy">{locale === 'zh' ? '账户角色、状态与权限现在由持久化账户配置驱动。' : 'Role, status, and permissions are now driven by persisted account configuration.'}</div></div><div className="panel-badge badge-warn">{account?.access.role || 'admin'}</div></div>
          <div className="policy-card policy-card-inline">
            <div className="policy-row"><span>{locale === 'zh' ? '当前角色' : 'Current Role'}</span><strong>{account?.access.role || 'admin'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '当前状态' : 'Current Status'}</span><strong>{account?.access.status || 'active'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '有效权限' : 'Effective Permissions'}</span><strong>{account?.access.permissions.join(', ') || 'dashboard:read'}</strong></div>
          </div>
          <div className="settings-form-grid">
            <label className="settings-field">
              <span>{locale === 'zh' ? '角色' : 'Role'}</span>
              <select disabled={!canWriteAccount} value={accessForm.role} onChange={(event) => setAccessForm((current) => ({ ...current, role: event.target.value }))}>
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
              const selected = accessForm.permissions.split(',').map((item) => item.trim()).filter(Boolean).includes(permission);
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
            <div className="policy-row"><span>{copy[locale].labels.marketData}</span><strong>{translateProviderLabel(locale, state.integrationStatus.marketData.label || state.integrationStatus.marketData.provider)}</strong></div>
            <div className="policy-row"><span>{copy[locale].labels.marketState}</span><strong>{state.integrationStatus.marketData.connected ? copy[locale].labels.connected : copy[locale].labels.fallback}</strong></div>
            <div className="policy-row"><span>{copy[locale].labels.broker}</span><strong>{translateProviderLabel(locale, state.integrationStatus.broker.label || state.integrationStatus.broker.provider)}</strong></div>
            <div className="policy-row"><span>{copy[locale].labels.brokerState}</span><strong>{state.integrationStatus.broker.connected ? copy[locale].labels.connected : copy[locale].labels.localOnly}</strong></div>
            <div className="status-copy">{translateRuntimeText(locale, state.integrationStatus.marketData.message)}</div>
            <div className="status-copy">{translateRuntimeText(locale, state.integrationStatus.broker.message)}</div>
          </div>
        </article>
        <article className="panel" id="broker-bindings">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '券商绑定' : 'Broker Bindings'}</div><div className="panel-copy">{locale === 'zh' ? '平台底座阶段开始由服务端维护券商账户绑定档案。' : 'Broker account bindings are now tracked by the backend account layer.'}</div></div><div className="panel-badge badge-muted">{bindings.length || 1}</div></div>
          <div className="policy-card policy-card-inline">
            {bindings.map((binding) => (
              <div key={binding.id} className="policy-row policy-row-split">
                <span>{binding.label}{binding.isDefault ? ` (${locale === 'zh' ? '默认' : 'default'})` : ''}</span>
                <div className="policy-row-actions">
                  <strong>{`${binding.provider} / ${binding.environment} / ${binding.status}`}</strong>
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
            {bindingRuntime?.ok ? (
              <>
                <div className="policy-row"><span>{locale === 'zh' ? '运行时适配器' : 'Runtime Adapter'}</span><strong>{bindingRuntime.runtime.adapter}</strong></div>
                <div className="policy-row"><span>{locale === 'zh' ? '运行时连接' : 'Runtime Connectivity'}</span><strong>{bindingRuntime.runtime.connected ? 'connected' : 'disconnected'}</strong></div>
                <div className="policy-row"><span>{locale === 'zh' ? '最近检查' : 'Last Checked'}</span><strong>{bindingRuntime.runtime.lastCheckedAt}</strong></div>
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
