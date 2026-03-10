import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  fetchBrokerBindings,
  fetchUserAccountProfile,
  saveBrokerBinding,
  updateUserAccountPreferences,
  updateUserAccountProfile,
} from '../../../app/api/controlPlane.ts';
import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';
import { SectionHeader } from '../components/ConsoleChrome.tsx';
import { copy, useLocale } from '../i18n.tsx';
import { modeTone, translateMode, translateProviderLabel, translateRuntimeText } from '../utils.ts';
import type { UserAccountProfileSnapshot, UserBrokerBinding } from '@shared-types/trading.ts';

export function SettingsPage() {
  const { locale } = useLocale();
  const { state, setMode, updateToggle } = useTradingSystem();
  const location = useLocation();
  const [account, setAccount] = useState<UserAccountProfileSnapshot | null>(null);
  const [bindings, setBindings] = useState<UserBrokerBinding[]>([]);
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
  const [bindingForm, setBindingForm] = useState({
    provider: 'alpaca',
    label: '',
    environment: 'paper',
    accountId: '',
    status: 'disconnected',
  });
  const [saveState, setSaveState] = useState({
    profile: '',
    preferences: '',
    binding: '',
  });
  const modes = [
    ['autopilot', 'AUTO PILOT'],
    ['hybrid', 'HYBRID'],
    ['manual', 'MANUAL'],
  ] as const;

  useEffect(() => {
    const targetId = location.hash.replace('#', '');
    if (!targetId) return;
    const element = document.getElementById(targetId);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  useEffect(() => {
    let active = true;

    Promise.all([fetchUserAccountProfile(), fetchBrokerBindings()])
      .then(([profileSnapshot, brokerSnapshot]) => {
        if (!active) return;
        setAccount(profileSnapshot);
        setBindings(brokerSnapshot.bindings);
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
        const defaultBinding = brokerSnapshot.bindings.find((item) => item.isDefault) || brokerSnapshot.bindings[0];
        setBindingForm((current) => ({
          ...current,
          provider: defaultBinding?.provider || current.provider,
          label: defaultBinding?.label || current.label,
          environment: defaultBinding?.environment || current.environment,
          accountId: defaultBinding?.accountId || current.accountId,
          status: defaultBinding?.status || current.status,
        }));
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

  async function handleBindingSave() {
    setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '保存中...' : 'Saving...' }));
    try {
      await saveBrokerBinding({
        ...bindingForm,
        permissions: bindingForm.environment === 'live' ? ['read', 'trade'] : ['read'],
        isDefault: true,
      });
      const brokerSnapshot = await fetchBrokerBindings();
      setBindings(brokerSnapshot.bindings);
      setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '券商绑定已保存' : 'Broker binding saved' }));
    } catch {
      setSaveState((current) => ({ ...current, binding: locale === 'zh' ? '券商绑定保存失败' : 'Broker binding save failed' }));
    }
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
              <button key={key} type="button" className={`mode-pill${state.mode === key ? ' active' : ''}`} onClick={() => setMode(key)}>
                {translateMode(locale, label)}
              </button>
            ))}
          </div>
        </article>
        <article className="panel" id="switches">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].labels.switches}</div><div className="panel-copy">{copy[locale].terms.switchesCopy}</div></div><div className="panel-badge badge-muted">CONTROL</div></div>
          <label className="switch-row"><span>{copy[locale].labels.autoTrade}</span><input type="checkbox" checked={state.toggles.autoTrade} onChange={(event) => updateToggle('autoTrade', event.target.checked)} /></label>
          <label className="switch-row"><span>{copy[locale].labels.allowLive}</span><input type="checkbox" checked={state.toggles.liveTrade} onChange={(event) => updateToggle('liveTrade', event.target.checked)} /></label>
          <label className="switch-row"><span>{copy[locale].labels.riskGuard}</span><input type="checkbox" checked={state.toggles.riskGuard} onChange={(event) => updateToggle('riskGuard', event.target.checked)} /></label>
          <label className="switch-row"><span>{copy[locale].labels.manualApproval}</span><input type="checkbox" checked={state.toggles.manualApproval} onChange={(event) => updateToggle('manualApproval', event.target.checked)} /></label>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel" id="account-profile">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '账户档案' : 'Account Profile'}</div><div className="panel-copy">{locale === 'zh' ? '当前操作员、偏好设置和默认工作模式。' : 'Current operator profile, preferences, and default workspace mode.'}</div></div><div className="panel-badge badge-info">ACCOUNT</div></div>
          <div className="policy-card policy-card-inline">
            <div className="policy-row"><span>{locale === 'zh' ? '姓名' : 'Name'}</span><strong>{account?.profile.name || 'QuantPilot Operator'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '邮箱' : 'Email'}</span><strong>{account?.profile.email || 'operator@quantpilot.local'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '角色' : 'Role'}</span><strong>{account?.profile.role || 'admin'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '时区' : 'Timezone'}</span><strong>{account?.preferences.timezone || 'Asia/Shanghai'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '默认模式' : 'Default Mode'}</span><strong>{account?.preferences.defaultMode || 'hybrid'}</strong></div>
            <div className="policy-row"><span>{locale === 'zh' ? '通知通道' : 'Notifications'}</span><strong>{account?.preferences.notificationChannels.join(', ') || 'inbox'}</strong></div>
          </div>
          <div className="settings-form-grid">
            <label className="settings-field">
              <span>{locale === 'zh' ? '姓名' : 'Name'}</span>
              <input value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '邮箱' : 'Email'}</span>
              <input value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '组织' : 'Organization'}</span>
              <input value={profileForm.organization} onChange={(event) => setProfileForm((current) => ({ ...current, organization: event.target.value }))} />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '时区' : 'Timezone'}</span>
              <select value={profileForm.timezone} onChange={(event) => setProfileForm((current) => ({ ...current, timezone: event.target.value }))}>
                <option value="Asia/Shanghai">Asia/Shanghai</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </label>
          </div>
          <div className="settings-actions">
            <button type="button" className="settings-button" onClick={handleProfileSave}>{locale === 'zh' ? '保存账户档案' : 'Save Profile'}</button>
            <div className="status-copy">{saveState.profile}</div>
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
              <select value={preferencesForm.locale} onChange={(event) => setPreferencesForm((current) => ({ ...current, locale: event.target.value }))}>
                <option value="zh-CN">zh-CN</option>
                <option value="en-US">en-US</option>
              </select>
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '默认模式' : 'Default Mode'}</span>
              <select value={preferencesForm.defaultMode} onChange={(event) => setPreferencesForm((current) => ({ ...current, defaultMode: event.target.value }))}>
                <option value="autopilot">autopilot</option>
                <option value="hybrid">hybrid</option>
                <option value="manual">manual</option>
              </select>
            </label>
            <label className="settings-field settings-field-wide">
              <span>{locale === 'zh' ? '通知通道' : 'Notification Channels'}</span>
              <input value={preferencesForm.notificationChannels} onChange={(event) => setPreferencesForm((current) => ({ ...current, notificationChannels: event.target.value }))} placeholder="inbox, email" />
            </label>
          </div>
          <div className="settings-actions">
            <button type="button" className="settings-button" onClick={handlePreferencesSave}>{locale === 'zh' ? '保存偏好设置' : 'Save Preferences'}</button>
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
              <div key={binding.id} className="policy-row">
                <span>{binding.label}{binding.isDefault ? ` (${locale === 'zh' ? '默认' : 'default'})` : ''}</span>
                <strong>{`${binding.provider} / ${binding.environment} / ${binding.status}`}</strong>
              </div>
            ))}
            {!bindings.length ? (
              <div className="status-copy">{locale === 'zh' ? '尚未加载到远程绑定，当前显示默认券商档案。' : 'No remote bindings loaded yet. Showing the default broker record.'}</div>
            ) : null}
          </div>
          <div className="settings-form-grid">
            <label className="settings-field">
              <span>{locale === 'zh' ? '提供商' : 'Provider'}</span>
              <select value={bindingForm.provider} onChange={(event) => setBindingForm((current) => ({ ...current, provider: event.target.value }))}>
                <option value="alpaca">alpaca</option>
                <option value="custom-http">custom-http</option>
              </select>
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '标签' : 'Label'}</span>
              <input value={bindingForm.label} onChange={(event) => setBindingForm((current) => ({ ...current, label: event.target.value }))} />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '环境' : 'Environment'}</span>
              <select value={bindingForm.environment} onChange={(event) => setBindingForm((current) => ({ ...current, environment: event.target.value }))}>
                <option value="paper">paper</option>
                <option value="live">live</option>
              </select>
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '状态' : 'Status'}</span>
              <select value={bindingForm.status} onChange={(event) => setBindingForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="connected">connected</option>
                <option value="disconnected">disconnected</option>
                <option value="degraded">degraded</option>
              </select>
            </label>
            <label className="settings-field settings-field-wide">
              <span>{locale === 'zh' ? '账户 ID' : 'Account ID'}</span>
              <input value={bindingForm.accountId} onChange={(event) => setBindingForm((current) => ({ ...current, accountId: event.target.value }))} />
            </label>
          </div>
          <div className="settings-actions">
            <button type="button" className="settings-button" onClick={handleBindingSave}>{locale === 'zh' ? '保存券商绑定' : 'Save Broker Binding'}</button>
            <div className="status-copy">{saveState.binding}</div>
          </div>
        </article>
      </section>
    </>
  );
}
