import { describe, expect, it } from 'vitest';
import { getExecutionCollectionConfigs } from './executionCollectionConfigs.ts';

describe('execution collection configs', () => {
  it('builds english collection panel configs with badges and empty states', () => {
    const configs = getExecutionCollectionConfigs('en', {
      audit: 3,
      actions: 2,
      versions: 4,
    });

    expect(configs.audit.badge).toBe(3);
    expect(configs.audit.emptyItemsMessage).toBe(
      'No audit records exist for the selected execution plan yet.'
    );
    expect(configs.actions.title).toBe('Selected Approval Actions');
    expect(configs.versions.copy).toContain('Replay order count');
  });

  it('builds chinese collection panel configs', () => {
    const configs = getExecutionCollectionConfigs('zh', {
      audit: 0,
      actions: 0,
      versions: 0,
    });

    expect(configs.audit.loadingMessage).toBe('正在加载执行审计...');
    expect(configs.actions.emptySelectionMessage).toBe('先从执行计划账本选择一条记录。');
    expect(configs.versions.emptyItemsMessage).toBe('当前执行计划还没有可回放的版本快照。');
  });
});
