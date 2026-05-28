import type { AppLocale, TradingState } from '@shared-types/trading.ts';
import { copy } from '../../../modules/console/console.i18n.tsx';
import {
  connectionLabel,
  fmtDateTime,
  translateProviderLabel,
  translateRuntimeText,
} from '../../../modules/console/console.utils.ts';

type IntegrationSettingsPanelProps = {
  locale: AppLocale;
  state: TradingState;
  marketStatus: {
    provider?: string;
    connected?: boolean;
    fallback?: boolean;
    message?: string;
    asOf?: string;
  } | null;
};

export function IntegrationSettingsPanel({
  locale,
  state,
  marketStatus,
}: IntegrationSettingsPanelProps) {
  const marketProviderLabel = translateProviderLabel(
    locale,
    marketStatus?.provider === 'alpaca'
      ? 'Alpaca Market Data via Gateway'
      : marketStatus?.provider === 'custom-http'
        ? 'HTTP 行情网关'
        : state.integrationStatus.marketData.label || state.integrationStatus.marketData.provider
  );
  const marketConnected = marketStatus?.connected ?? state.integrationStatus.marketData.connected;
  const marketFallback = marketStatus?.fallback ?? !marketConnected;
  const marketMessage = marketStatus?.message || state.integrationStatus.marketData.message;

  return (
    <article className="panel" id="integrations">
      <div className="panel-head">
        <div>
          <div className="panel-title">{copy[locale].labels.integrations}</div>
          <div className="panel-copy">{copy[locale].terms.marketConnectivity}</div>
        </div>
        <div className="panel-badge badge-info">INTEGRATION</div>
      </div>
      <div className="policy-card policy-card-inline">
        <div className="policy-row">
          <span>{copy[locale].labels.marketData}</span>
          <strong>{marketProviderLabel}</strong>
        </div>
        <div className="policy-row">
          <span>{copy[locale].labels.marketState}</span>
          <strong>{connectionLabel(locale, marketConnected, marketFallback)}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? 'Fallback' : 'Fallback'}</span>
          <strong>{marketFallback ? 'ON' : 'OFF'}</strong>
        </div>
        <div className="policy-row">
          <span>{locale === 'zh' ? '最近同步' : 'Last Sync'}</span>
          <strong>{fmtDateTime(marketStatus?.asOf, locale)}</strong>
        </div>
        <div className="policy-row">
          <span>{copy[locale].labels.broker}</span>
          <strong>
            {translateProviderLabel(
              locale,
              state.integrationStatus.broker.label || state.integrationStatus.broker.provider
            )}
          </strong>
        </div>
        <div className="policy-row">
          <span>{copy[locale].labels.brokerState}</span>
          <strong>
            {state.integrationStatus.broker.connected
              ? copy[locale].labels.connected
              : copy[locale].labels.localOnly}
          </strong>
        </div>
        <div className="status-copy">{translateRuntimeText(locale, marketMessage)}</div>
        <div className="status-copy">
          {translateRuntimeText(locale, state.integrationStatus.broker.message)}
        </div>
      </div>
    </article>
  );
}
