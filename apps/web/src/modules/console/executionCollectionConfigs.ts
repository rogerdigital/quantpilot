export function getExecutionCollectionConfigs(
  locale: 'zh' | 'en',
  counts: {
    audit: number;
    actions: number;
    versions: number;
    evidence: number;
    recovery: number;
  }
) {
  return {
    audit: {
      title: locale === 'zh' ? '选中执行审计轨迹' : 'Selected Execution Audit',
      copy:
        locale === 'zh'
          ? '按策略 ID 聚合当前选中 execution plan 对应的审计留痕。'
          : 'Aggregate audit trail for the selected execution plan by strategy id.',
      badge: counts.audit,
      badgeClassName: 'badge-warn',
      loadingMessage: locale === 'zh' ? '正在加载执行审计...' : 'Loading execution audit...',
      emptySelectionMessage:
        locale === 'zh'
          ? '先从执行计划账本选择一条记录。'
          : 'Select an execution plan from the ledger first.',
      emptyItemsMessage:
        locale === 'zh'
          ? '当前执行计划暂无审计留痕。'
          : 'No audit records exist for the selected execution plan yet.',
    },
    actions: {
      title: locale === 'zh' ? '选中审批动作历史' : 'Selected Approval Actions',
      copy:
        locale === 'zh'
          ? '按当前 execution plan 的订单标的聚合 approve / reject / cancel 动作历史。'
          : 'Aggregate approve, reject, and cancel actions by the selected execution plan’s order symbols.',
      badge: counts.actions,
      badgeClassName: 'badge-warn',
      loadingMessage: locale === 'zh' ? '正在加载审批动作历史...' : 'Loading approval actions...',
      emptySelectionMessage:
        locale === 'zh'
          ? '先从执行计划账本选择一条记录。'
          : 'Select an execution plan from the ledger first.',
      emptyItemsMessage:
        locale === 'zh'
          ? '当前执行计划还没有关联的审批动作。'
          : 'No approval actions are associated with the selected execution plan yet.',
    },
    versions: {
      title: locale === 'zh' ? '选中执行版本轨迹' : 'Selected Execution Version History',
      copy:
        locale === 'zh'
          ? '从 execution audit metadata 回放订单规模、风控状态和资金规模的历史快照。'
          : 'Replay order count, risk status, and capital snapshots from execution audit metadata.',
      badge: counts.versions,
      badgeClassName: 'badge-info',
      emptySelectionMessage:
        locale === 'zh'
          ? '先从执行计划账本选择一条记录。'
          : 'Select an execution plan from the ledger first.',
      emptyItemsMessage:
        locale === 'zh'
          ? '当前执行计划还没有可回放的版本快照。'
          : 'No version snapshots are available for the selected execution plan yet.',
    },
    evidence: {
      title: locale === 'zh' ? '执行证据链' : 'Execution Evidence Chain',
      copy:
        locale === 'zh'
          ? '展示当前执行计划的策略版本、升级申请、风控评估和券商账户关联。'
          : 'Display strategy version, promotion request, risk assessment, and broker account linkage for the current execution plan.',
      badge: counts.evidence,
      badgeClassName: 'badge-info',
      emptyMessage: locale === 'zh' ? '暂无证据链数据。' : 'No evidence chain data available.',
    },
    recovery: {
      title: locale === 'zh' ? '执行恢复控制台' : 'Execution Recovery Console',
      copy:
        locale === 'zh'
          ? '诊断并恢复提交失败、确认丢失、部分成交、取消拒绝和仓位不匹配等异常。'
          : 'Diagnose and recover from submit failures, lost acknowledgements, partial fills, cancel rejections, and position mismatches.',
      badge: counts.recovery,
      badgeClassName: counts.recovery > 0 ? 'badge-warn' : 'badge-muted',
      emptyMessage:
        locale === 'zh' ? '当前没有需要恢复的执行。' : 'No executions require recovery.',
    },
  };
}
