import type { AppLocale, TradingState } from '@shared-types/trading.ts';
import { ActivityLog } from '../../../components/business/ConsoleTables.tsx';
import {
  onShortcutKeyDown,
  useSettingsNavigation,
} from '../../../modules/console/console.hooks.ts';
import { copy } from '../../../modules/console/console.i18n.tsx';
import {
  modeTone,
  translateMode,
  translateRiskLevel,
  translateRuntimeText,
} from '../../../modules/console/console.utils.ts';

export type ExecutionSummaryPanelProps = {
  locale: AppLocale;
  state: TradingState;
};

export function ExecutionSummaryPanel({ locale, state }: ExecutionSummaryPanelProps) {
  const goToSettings = useSettingsNavigation();

  return (
    <section className="panel-grid panel-grid-wide">
      <article className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">{copy[locale].terms.executionLog}</div>
            <div className="panel-copy">
              {locale === 'zh'
                ? '按时间逆序查看最新系统执行记录。'
                : 'Review the latest execution records in reverse chronological order.'}
            </div>
          </div>
          <div className="panel-badge badge-info">EXECUTION</div>
        </div>
        <ActivityLog />
      </article>
      <article
        className="panel shortcut-surface"
        role="button"
        tabIndex={0}
        onClick={() => goToSettings('integrations')}
        onKeyDown={(event) => onShortcutKeyDown(event, () => goToSettings('integrations'))}
      >
        <div className="panel-head">
          <div>
            <div className="panel-title">{copy[locale].terms.executionSummary}</div>
            <div className="panel-copy">
              {locale === 'zh'
                ? '汇总最近一个刷新周期的动作和通道路由。'
                : 'Summarize the latest cycle actions and routing posture.'}
            </div>
          </div>
          <div className={`panel-badge badge-${modeTone(state.mode)}`}>
            {translateMode(locale, state.mode)}
          </div>
        </div>
        <div className="status-stack">
          <div className="status-row">
            <span>{copy[locale].labels.latestSignal}</span>
            <strong>
              {state.stockStates.filter((stock) => stock.signal === 'BUY').length} /{' '}
              {state.stockStates.filter((stock) => stock.signal === 'SELL').length}
            </strong>
          </div>
          <div className="status-row">
            <span>{copy[locale].terms.riskLevel}</span>
            <strong>{translateRiskLevel(locale, state.riskLevel)}</strong>
          </div>
          <div className="status-row">
            <span>{copy[locale].terms.tradeDecision}</span>
            <strong>{translateRuntimeText(locale, state.decisionSummary)}</strong>
          </div>
          <div className="status-row">
            <span>{copy[locale].labels.brokerState}</span>
            <strong>
              {state.integrationStatus.broker.connected
                ? copy[locale].labels.connected
                : copy[locale].labels.fallback}
            </strong>
          </div>
          <div className="status-copy">{translateRuntimeText(locale, state.decisionCopy)}</div>
          <div className="status-copy">
            {translateRuntimeText(locale, state.integrationStatus.broker.message)}
          </div>
        </div>
      </article>
    </section>
  );
}
