import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';
import { SectionHeader } from '../components/ConsoleChrome.tsx';
import { copy, useLocale } from '../i18n.tsx';
import { modeTone, translateMode, translateProviderLabel, translateRuntimeText } from '../utils.ts';

export function SettingsPage() {
  const { locale } = useLocale();
  const { state, setMode, updateToggle } = useTradingSystem();
  const location = useLocation();
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
        <article className="panel" id="policy">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].labels.policy}</div><div className="panel-copy">{copy[locale].terms.policyCopy}</div></div><div className="panel-badge badge-warn">POLICY</div></div>
          <div className="policy-card policy-card-inline">
            <div className="policy-row"><span>{copy[locale].terms.buyThreshold}</span><strong>{state.config.buyThreshold}</strong></div>
            <div className="policy-row"><span>{copy[locale].terms.sellThreshold}</span><strong>{state.config.sellThreshold}</strong></div>
            <div className="policy-row"><span>{copy[locale].terms.maxPosition}</span><strong>{(state.config.maxPositionWeight * 100).toFixed(0)}%</strong></div>
            <div className="policy-row"><span>{copy[locale].terms.cashBuffer}</span><strong>{(state.config.targetCashBuffer * 100).toFixed(0)}%</strong></div>
            <div className="policy-row"><span>{copy[locale].terms.riskProtection}</span><strong>{state.toggles.riskGuard ? 'ON' : 'OFF'}</strong></div>
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
      </section>
    </>
  );
}
