import { describe, expect, it } from 'vitest';
import { ApiPermissionError } from '../../app/api/http.ts';
import {
  formatActionGuardNotice,
  formatMissingPermission,
  formatPermissionDisabled,
  formatPermissionError,
  formatPermissionReadOnly,
} from './permissionCopy.ts';

describe('permission copy helpers', () => {
  it('formats localized missing permission copy', () => {
    expect(formatMissingPermission('zh', 'strategy:write')).toContain('strategy:write');
    expect(formatMissingPermission('en', 'execution:approve')).toContain('execution approvals');
  });

  it('formats read-only and disabled copy consistently', () => {
    expect(formatPermissionDisabled('zh', 'risk:review', '处理待复核回测', 'process review backtests')).toContain('不能处理待复核回测');
    expect(formatPermissionReadOnly('en', 'strategy:write', '策略工作台', 'the strategy workspace')).toContain('read-only');
  });

  it('formats API permission errors using the shared language', () => {
    const error = new ApiPermissionError('missing required permission: account:write', 403, 'account:write');
    expect(formatPermissionError('zh', error, '账户设置失败', 'Account update failed', '账户设置更新', 'Account update')).toContain('account:write');
    expect(formatPermissionError('en', error, 'Account update failed', 'Account update failed', 'Account update', 'Account update')).toContain('blocked');
  });

  it('formats action-guard notices from action ids', () => {
    expect(formatActionGuardNotice('zh', { permission: 'execution:approve', action: 'cancel-live-order' })).toContain('撤单');
    expect(formatActionGuardNotice('en', { permission: 'strategy:write', action: 'set-mode' })).toContain('mode');
  });
});
