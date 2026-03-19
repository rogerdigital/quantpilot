export function getStrategyTimelineGuidance(locale: 'zh' | 'en', eventType?: string | null) {
  if (!eventType) {
    return null;
  }

  if (eventType === 'execution') {
    return locale === 'zh'
      ? '继续查看下方执行计划面板，确认 plan、risk、workflow 和 runtime 是否一致。'
      : 'Continue with the execution plan panel below to verify plan, risk, workflow, and runtime consistency.';
  }

  if (eventType === 'run') {
    return locale === 'zh'
      ? '继续查看下方研究记录面板，确认回测结果、窗口参数和版本快照是否匹配。'
      : 'Continue with the research runs panel below to verify backtest results, window parameters, and version snapshots.';
  }

  if (eventType === 'result') {
    return locale === 'zh'
      ? '继续查看下方策略详情和结果摘要，确认最近结果版本是否已经满足晋级或执行准备条件。'
      : 'Continue with the strategy detail and result summary panels below to confirm whether the latest result version is ready for promotion or execution prep.';
  }

  return locale === 'zh'
    ? '继续查看下方审计轨迹和版本轨迹，确认这次策略写入带来的状态变化。'
    : 'Continue with the audit trail and version history panels below to confirm the state change from this registry update.';
}

export function getStrategyTimelineActionLabel(locale: 'zh' | 'en', eventType?: string | null) {
  if (eventType === 'run') {
    return locale === 'zh' ? '打开回测详情' : 'Open Backtest Detail';
  }

  if (eventType === 'execution') {
    return locale === 'zh' ? '打开执行详情' : 'Open Execution Detail';
  }

  if (eventType === 'result') {
    return locale === 'zh' ? '打开回测详情' : 'Open Backtest Detail';
  }

  return null;
}
