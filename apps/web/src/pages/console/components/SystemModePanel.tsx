import type { AppLocale } from '@shared-types/trading.ts';
import { copy } from '../../../modules/console/console.i18n.tsx';
import { modeTone, translateMode } from '../../../modules/console/console.utils.ts';
import {
  formatActionGuardNotice,
  formatPermissionDisabled,
} from '../../../modules/permissions/permissionCopy.ts';

type SystemModePanelProps = {
  locale: AppLocale;
  mode: string;
  toggles: Record<string, boolean>;
  canWriteStrategy: boolean;
  canReviewRisk: boolean;
  canApproveExecution: boolean;
  actionGuardNotice: { permission: string; action: string } | null | undefined;
  setMode: (mode: 'autopilot' | 'hybrid' | 'manual') => void;
  updateToggle: (
    key: 'autoTrade' | 'liveTrade' | 'riskGuard' | 'manualApproval',
    value: boolean
  ) => void;
};

const modes = [
  ['autopilot', 'AUTO PILOT'],
  ['hybrid', 'HYBRID'],
  ['manual', 'MANUAL'],
] as const;

export function SystemModePanel({
  locale,
  mode,
  toggles,
  canWriteStrategy,
  canReviewRisk,
  canApproveExecution,
  actionGuardNotice,
  setMode,
  updateToggle,
}: SystemModePanelProps) {
  const modeDisabledReason = formatPermissionDisabled(
    locale,
    'strategy:write',
    '切换系统模式',
    'change the system mode'
  );
  const autoTradeDisabledReason = formatPermissionDisabled(
    locale,
    'strategy:write',
    '修改自动交易开关',
    'change the auto-trade toggle'
  );
  const riskGuardDisabledReason = formatPermissionDisabled(
    locale,
    'risk:review',
    '修改风险闸门',
    'change the risk-guard toggle'
  );
  const executionDisabledReason = formatPermissionDisabled(
    locale,
    'execution:approve',
    '修改实盘相关开关',
    'change live execution toggles'
  );

  return (
    <section className="panel-grid panel-grid-wide">
      <article className="panel" id="system-mode">
        <div className="panel-head">
          <div>
            <div className="panel-title">{copy[locale].labels.systemMode}</div>
            <div className="panel-copy">{copy[locale].terms.systemModeCopy}</div>
          </div>
          <div className={`panel-badge badge-${modeTone(mode)}`}>{translateMode(locale, mode)}</div>
        </div>
        <div className="mode-stack">
          {modes.map(([key, label]) => (
            <button
              key={key}
              type="button"
              title={!canWriteStrategy ? modeDisabledReason : undefined}
              disabled={!canWriteStrategy}
              className={`mode-pill${mode === key ? ' active' : ''}`}
              onClick={() => setMode(key)}
            >
              {translateMode(locale, label)}
            </button>
          ))}
        </div>
        {!canWriteStrategy ? (
          <div className="status-copy">
            {formatPermissionDisabled(
              locale,
              'strategy:write',
              '切换系统模式',
              'change the system mode'
            )}
          </div>
        ) : null}
        {actionGuardNotice?.action === 'set-mode' ? (
          <div className="status-copy">{formatActionGuardNotice(locale, actionGuardNotice)}</div>
        ) : null}
      </article>
      <article className="panel" id="switches">
        <div className="panel-head">
          <div>
            <div className="panel-title">{copy[locale].labels.switches}</div>
            <div className="panel-copy">{copy[locale].terms.switchesCopy}</div>
          </div>
          <div className="panel-badge badge-muted">CONTROL</div>
        </div>
        <label className="switch-row">
          <span>{copy[locale].labels.autoTrade}</span>
          <input
            title={!canWriteStrategy ? autoTradeDisabledReason : undefined}
            type="checkbox"
            disabled={!canWriteStrategy}
            checked={toggles.autoTrade}
            onChange={(event) => updateToggle('autoTrade', event.target.checked)}
          />
        </label>
        <label className="switch-row">
          <span>{copy[locale].labels.allowLive}</span>
          <input
            title={!canApproveExecution ? executionDisabledReason : undefined}
            type="checkbox"
            disabled={!canApproveExecution}
            checked={toggles.liveTrade}
            onChange={(event) => updateToggle('liveTrade', event.target.checked)}
          />
        </label>
        <label className="switch-row">
          <span>{copy[locale].labels.riskGuard}</span>
          <input
            title={!canReviewRisk ? riskGuardDisabledReason : undefined}
            type="checkbox"
            disabled={!canReviewRisk}
            checked={toggles.riskGuard}
            onChange={(event) => updateToggle('riskGuard', event.target.checked)}
          />
        </label>
        <label className="switch-row">
          <span>{copy[locale].labels.manualApproval}</span>
          <input
            title={!canApproveExecution ? executionDisabledReason : undefined}
            type="checkbox"
            disabled={!canApproveExecution}
            checked={toggles.manualApproval}
            onChange={(event) => updateToggle('manualApproval', event.target.checked)}
          />
        </label>
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
  );
}
