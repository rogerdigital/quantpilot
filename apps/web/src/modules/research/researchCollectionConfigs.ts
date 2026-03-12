export function getStrategyCollectionConfigs(locale: 'zh' | 'en', hasSelection: boolean, workspaceLoading: boolean, counts: {
  runs: number;
  execution: number;
  audit: number;
  versions: number;
}) {
  const selectionEmptyMessage = locale === 'zh' ? '先从策略注册表选择一条记录。' : 'Select a strategy from the registry first.';

  return {
    runs: {
      title: locale === 'zh' ? '选中策略研究记录' : 'Selected Strategy Research Runs',
      copy: locale === 'zh' ? '查看当前策略关联的最近回测运行记录。' : 'Review the most recent backtest runs associated with the selected strategy.',
      badge: counts.runs,
      badgeClassName: 'badge-warn',
      terminal: true,
      hasSelection,
      selectionEmptyMessage,
      isEmpty: counts.runs === 0,
      emptyMessage: locale === 'zh' ? '当前策略还没有研究运行记录。' : 'No research runs exist for the selected strategy yet.',
    },
    execution: {
      title: locale === 'zh' ? '选中策略执行计划' : 'Selected Strategy Execution Plans',
      copy: locale === 'zh' ? '直接查看当前策略在执行侧的承接情况，包括计划状态、workflow 和最新 runtime。' : 'Inspect how the selected strategy is handed off downstream through execution plan status, workflow, and latest runtime.',
      badge: counts.execution,
      badgeClassName: 'badge-info',
      terminal: true,
      hasSelection,
      selectionEmptyMessage,
      loading: hasSelection && workspaceLoading,
      loadingMessage: locale === 'zh' ? '正在加载关联执行计划...' : 'Loading linked execution plans...',
      isEmpty: !workspaceLoading && counts.execution === 0,
      emptyMessage: locale === 'zh' ? '当前策略还没有进入执行侧。' : 'The selected strategy has not produced downstream execution plans yet.',
    },
    audit: {
      title: locale === 'zh' ? '选中策略审计轨迹' : 'Selected Strategy Audit Trail',
      copy: locale === 'zh' ? '只展示当前策略的注册、晋级、归档与恢复留痕。' : 'Show only the selected strategy’s registry, promotion, archive, and restore audit trail.',
      badge: counts.audit,
      terminal: true,
      hasSelection,
      selectionEmptyMessage,
      isEmpty: counts.audit === 0,
      emptyMessage: locale === 'zh' ? '当前策略还没有审计轨迹。' : 'No audit trail exists for the selected strategy yet.',
    },
    versions: {
      title: locale === 'zh' ? '选中策略版本轨迹' : 'Selected Strategy Version History',
      copy: locale === 'zh' ? '从 audit metadata 读取最近版本的评分和风险参数，观察策略快照如何变化。' : 'Read the latest score and risk parameter snapshots from audit metadata to track how the strategy evolved.',
      badge: counts.versions,
      badgeClassName: 'badge-warn',
      terminal: true,
      hasSelection,
      selectionEmptyMessage,
      isEmpty: counts.versions === 0,
      emptyMessage: locale === 'zh' ? '当前策略还没有可回放的版本快照。' : 'No version snapshots are available for the selected strategy yet.',
    },
  };
}

export function getBacktestCollectionConfigs(locale: 'zh' | 'en', hasSelection: boolean, counts: {
  audit: number;
  execution: number;
  versions: number;
}) {
  const selectionEmptyMessage = locale === 'zh' ? '先从回测队列选择一条记录。' : 'Select a run from the queue first.';

  return {
    audit: {
      title: locale === 'zh' ? '选中回测审计轨迹' : 'Selected Audit Trail',
      copy: locale === 'zh' ? '只展示当前选中 run 的队列、完成和复核记录。' : 'Show only the queue, completion, and review records for the selected run.',
      badge: counts.audit,
      badgeClassName: 'badge-warn',
      terminal: true,
      hasSelection,
      selectionEmptyMessage,
      isEmpty: counts.audit === 0,
      emptyMessage: locale === 'zh' ? '当前 run 暂无审计轨迹。' : 'No audit trail exists for the selected run yet.',
    },
    execution: {
      title: locale === 'zh' ? '下游执行承接' : 'Downstream Execution Handoff',
      copy: locale === 'zh' ? '查看当前回测所属策略在执行侧的承接情况，确认研究结果是否已经进入 execution plan。' : 'Inspect how the selected run’s strategy is handed off downstream and whether it already produced execution plans.',
      badge: counts.execution,
      badgeClassName: 'badge-info',
      terminal: true,
      hasSelection,
      selectionEmptyMessage,
      isEmpty: counts.execution === 0,
      emptyMessage: locale === 'zh' ? '当前回测对应策略还没有下游执行计划。' : 'No downstream execution plans exist for this run’s strategy yet.',
    },
    versions: {
      title: locale === 'zh' ? '选中回测版本轨迹' : 'Selected Backtest Version History',
      copy: locale === 'zh' ? '从 audit metadata 回放当前 run 在完成和人工复核时落下的关键绩效快照。' : 'Replay the selected run’s key performance snapshots from audit metadata when it completed or was reviewed.',
      badge: counts.versions,
      badgeClassName: 'badge-warn',
      terminal: true,
      hasSelection,
      selectionEmptyMessage,
      isEmpty: counts.versions === 0,
      emptyMessage: locale === 'zh' ? '当前 run 还没有可回放的版本快照。' : 'No version snapshots are available for the selected run yet.',
    },
  };
}
