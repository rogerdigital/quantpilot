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

  if (eventType === 'evaluation') {
    return locale === 'zh'
      ? '继续查看回测详情与评估摘要，确认 verdict、readiness 和 recommended action 是否还能支撑当前晋级路径。'
      : 'Continue with backtest detail and evaluation context to verify whether the verdict, readiness, and recommended action still support the current promotion path.';
  }

  if (eventType === 'report') {
    return locale === 'zh'
      ? '继续查看研究报告与工作流节点，确认报告资产、执行准备建议和风控说明是否一致。'
      : 'Continue with the report asset and workflow nodes to confirm that the report, execution-prep guidance, and risk notes remain aligned.';
  }

  if (eventType === 'task' || eventType === 'workflow') {
    return locale === 'zh'
      ? '继续查看任务骨架和 workflow 详情，确认研究链路是否卡在重试、排队或人工复核节点。'
      : 'Continue with the task backbone and workflow detail to verify whether the research chain is blocked on retries, queueing, or manual review.';
  }

  if (eventType === 'governance') {
    return locale === 'zh'
      ? '继续查看上方治理动作台和最近动作历史，确认这次治理动作有没有把策略推进到正确的下一步。'
      : 'Continue with the governance action console and recent action history above to confirm whether this governance move advanced the strategy into the right next step.';
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

  if (
    eventType === 'evaluation' ||
    eventType === 'report' ||
    eventType === 'task' ||
    eventType === 'workflow'
  ) {
    return locale === 'zh' ? '打开研究详情' : 'Open Research Detail';
  }

  return null;
}
