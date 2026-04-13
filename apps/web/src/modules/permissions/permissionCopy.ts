import { ApiPermissionError } from '../../app/api/http.ts';

const PERMISSION_LABELS: Record<string, { zh: string; en: string }> = {
  'dashboard:read': { zh: '控制台查看', en: 'dashboard access' },
  'strategy:write': { zh: '策略修改', en: 'strategy changes' },
  'risk:review': { zh: '风控复核', en: 'risk reviews' },
  'execution:approve': { zh: '执行审批', en: 'execution approvals' },
  'account:write': { zh: '账户设置', en: 'account updates' },
  'operations:maintain': { zh: '运维维护', en: 'operations maintenance' },
};

const ACTION_LABELS: Record<string, { zh: string; en: string }> = {
  'set-mode': { zh: '切换系统模式', en: 'change the system mode' },
  'toggle:autoTrade': { zh: '修改自动交易开关', en: 'change the auto-trade toggle' },
  'toggle:liveTrade': { zh: '修改实盘开关', en: 'change the live-trade toggle' },
  'toggle:riskGuard': { zh: '修改风险闸门', en: 'change the risk-guard toggle' },
  'toggle:manualApproval': { zh: '修改人工审批开关', en: 'change the manual-approval toggle' },
  'cancel-live-order': { zh: '发起实盘撤单', en: 'cancel live orders' },
  'approve-live-intent': { zh: '审批实盘动作', en: 'approve live intents' },
  'reject-live-intent': { zh: '驳回实盘动作', en: 'reject live intents' },
};

function getPermissionLabel(locale: 'zh' | 'en', permission = '') {
  return locale === 'zh'
    ? PERMISSION_LABELS[permission]?.zh || permission
    : PERMISSION_LABELS[permission]?.en || permission;
}

export function formatMissingPermission(locale: 'zh' | 'en', permission = '') {
  const label = getPermissionLabel(locale, permission);
  return locale === 'zh'
    ? `缺少 ${permission} 权限（${label}）`
    : `Missing ${permission} permission (${label})`;
}

export function formatPermissionDisabled(
  locale: 'zh' | 'en',
  permission: string,
  actionZh: string,
  actionEn: string
) {
  return locale === 'zh'
    ? `${formatMissingPermission(locale, permission)}，不能${actionZh}。`
    : `${formatMissingPermission(locale, permission)}. Cannot ${actionEn}.`;
}

export function formatPermissionReadOnly(
  locale: 'zh' | 'en',
  permission: string,
  subjectZh: string,
  subjectEn: string
) {
  return locale === 'zh'
    ? `当前会话${formatMissingPermission(locale, permission)}，${subjectZh}已切换为只读。`
    : `This session ${formatMissingPermission(locale, permission).toLowerCase()}, so ${subjectEn} stay read-only.`;
}

export function formatPermissionBlocked(
  locale: 'zh' | 'en',
  permission: string,
  actionZh: string,
  actionEn: string
) {
  return locale === 'zh'
    ? `${actionZh}已被拦截：当前会话${formatMissingPermission(locale, permission)}。`
    : `${actionEn} was blocked: this session ${formatMissingPermission(locale, permission).toLowerCase()}.`;
}

export function formatActionGuardNotice(
  locale: 'zh' | 'en',
  notice: { permission: string; action: string } | null
) {
  if (!notice) return '';
  const actionCopy = ACTION_LABELS[notice.action];
  if (actionCopy) {
    return formatPermissionBlocked(locale, notice.permission, actionCopy.zh, actionCopy.en);
  }
  return formatPermissionBlocked(
    locale,
    notice.permission,
    '执行受控动作',
    'perform the guarded action'
  );
}

export function formatPermissionError(
  locale: 'zh' | 'en',
  error: unknown,
  fallbackZh: string,
  fallbackEn: string,
  blockedZh = '操作',
  blockedEn = 'Action'
) {
  if (error instanceof ApiPermissionError && error.missingPermission) {
    return locale === 'zh'
      ? `${blockedZh}被拦截：当前会话${formatMissingPermission(locale, error.missingPermission)}。`
      : `${blockedEn} blocked: this session ${formatMissingPermission(locale, error.missingPermission).toLowerCase()}.`;
  }
  return locale === 'zh' ? fallbackZh : fallbackEn;
}
