import type { ReactNode } from 'react';
import { formatPermissionReadOnly } from '../permissions/permissionCopy.ts';

export function getStrategyTerminalConfigs(options: {
  locale: 'zh' | 'en';
  dataSourceBadge: string;
  loading: boolean;
  auditLoading: boolean;
  registryFilter: 'active' | 'archived' | 'all';
  activeCount: number;
  archivedCount: number;
  visibleCount: number;
  activityCount: number;
  onFilterChange: (value: 'active' | 'archived' | 'all') => void;
}) {
  const {
    locale,
    dataSourceBadge,
    loading,
    auditLoading,
    registryFilter,
    activeCount,
    archivedCount,
    visibleCount,
    activityCount,
    onFilterChange,
  } = options;

  return {
    registry: {
      title: locale === 'zh' ? '后端策略注册表' : 'Backend Strategy Registry',
      copy: locale === 'zh' ? '直接消费研究服务返回的策略目录，避免页面本地状态冒充注册表事实来源。' : 'Consume the backend strategy catalog directly instead of treating page-local runtime state as the registry source of truth.',
      badge: dataSourceBadge,
      badgeClassName: 'panel-badge badge-info',
      loading,
      isEmpty: visibleCount === 0,
      emptyMessage: locale === 'zh' ? '当前筛选条件下没有策略。' : 'No strategies match the current filter.',
      prelude: (
        <div className="status-stack">
          <div className="status-row"><span>{locale === 'zh' ? '活跃策略' : 'Active strategies'}</span><strong>{activeCount}</strong></div>
          <div className="status-row"><span>{locale === 'zh' ? '已归档策略' : 'Archived strategies'}</span><strong>{archivedCount}</strong></div>
          <div className="settings-actions">
            <button
              type="button"
              className="inline-action"
              disabled={registryFilter === 'active'}
              onClick={() => onFilterChange('active')}
            >
              {locale === 'zh' ? '仅看活跃' : 'Active only'}
            </button>
            <button
              type="button"
              className="inline-action"
              disabled={registryFilter === 'all'}
              onClick={() => onFilterChange('all')}
            >
              {locale === 'zh' ? '全部策略' : 'All strategies'}
            </button>
            <button
              type="button"
              className="inline-action"
              disabled={registryFilter === 'archived'}
              onClick={() => onFilterChange('archived')}
            >
              {locale === 'zh' ? '仅看归档' : 'Archived only'}
            </button>
          </div>
        </div>
      ),
    },
    activity: {
      title: locale === 'zh' ? '最近策略操作' : 'Recent Strategy Activity',
      copy: locale === 'zh' ? '直接消费后端 audit records，查看策略注册、晋级、归档和恢复的最新留痕。' : 'Consume backend audit records directly to review recent registry saves, promotions, archives, and restores.',
      badge: 'AUDIT',
      badgeClassName: 'panel-badge badge-warn',
      loading: auditLoading,
      loadingMessage: locale === 'zh' ? '正在加载策略操作历史...' : 'Loading strategy activity...',
      isEmpty: activityCount === 0,
      emptyMessage: locale === 'zh' ? '当前筛选条件下没有策略操作历史。' : 'No strategy activity for the current filter.',
    },
  };
}

export function getBacktestTerminalConfigs(options: {
  locale: 'zh' | 'en';
  loading: boolean;
  auditLoading: boolean;
  workspaceLoading: boolean;
  strategyCount: number;
  filteredRunCount: number;
  taskCount: number;
  activeTaskCount: number;
  auditCount: number;
  workflowCount: number;
  windowLabel: string;
  canReviewBacktest: boolean;
}) {
  const {
    locale,
    loading,
    auditLoading,
    workspaceLoading,
    strategyCount,
    filteredRunCount,
    taskCount,
    activeTaskCount,
    auditCount,
    workflowCount,
    windowLabel,
    canReviewBacktest,
  } = options;

  return {
    catalog: {
      title: locale === 'zh' ? '候选策略注册表' : 'Candidate Strategy Registry',
      copy: locale === 'zh' ? '后端返回策略目录，作为后续策略管理、参数优化和晋级流程的统一入口。' : 'The backend now returns a strategy catalog that can become the source of truth for strategy management and promotion.',
      badge: strategyCount,
      badgeClassName: 'panel-badge badge-info',
      loading,
      isEmpty: strategyCount === 0,
      emptyMessage: locale === 'zh' ? '暂无策略目录' : 'No strategy catalog entries yet.',
      footer: (
        <div className="status-copy">
          {locale === 'zh'
            ? `当前发起回测会复用窗口 ${windowLabel}。`
            : `New backtests currently reuse the window ${windowLabel}.`}
        </div>
      ),
    },
    queue: {
      title: locale === 'zh' ? '回测运行队列' : 'Backtest Run Queue',
      copy: locale === 'zh' ? '把 queued / running / completed / needs_review 明确拆开，为后续 worker 和审批闸门接管做准备。' : 'Separate queued, running, completed, and needs_review runs now so worker ownership and review gates can plug in later.',
      badge: filteredRunCount,
      badgeClassName: 'panel-badge badge-warn',
      loading,
      isEmpty: filteredRunCount === 0,
      emptyMessage: locale === 'zh' ? '当前筛选条件下没有回测记录' : 'No backtest runs match the current filter.',
      footer: !canReviewBacktest ? (
        <div className="status-copy">
          {formatPermissionReadOnly(locale, 'risk:review', '待复核回测队列', 'the review-queue backtests')}
        </div>
      ) : null,
    },
    tasks: {
      title: locale === 'zh' ? '研究任务骨架' : 'Research Task Backbone',
      copy: locale === 'zh'
        ? '把 run、workflow 和任务状态压成统一研究对象，作为阶段 2 研究闭环的基础事实源。'
        : 'Compress runs, workflows, and task state into one unified research object that can anchor the stage-2 research loop.',
      badge: taskCount,
      badgeClassName: 'panel-badge badge-info',
      loading,
      isEmpty: taskCount === 0,
      emptyMessage: locale === 'zh' ? '当前还没有研究任务。' : 'No research tasks are available yet.',
      footer: (
        <div className="status-copy">
          {locale === 'zh'
            ? `当前活跃研究任务 ${activeTaskCount} 个。`
            : `${activeTaskCount} active research tasks are currently in flight.`}
        </div>
      ),
    },
    activity: {
      title: locale === 'zh' ? '研究操作历史' : 'Research Activity Feed',
      copy: locale === 'zh' ? '把回测入队、worker 完成和人工复核的审计记录汇总到同一面板，并跟随当前筛选条件联动。' : 'Aggregate queue, worker completion, and manual review audit records into one panel that follows the current run filter.',
      badge: 'AUDIT',
      badgeClassName: 'panel-badge badge-info',
      loading: auditLoading,
      loadingMessage: locale === 'zh' ? '正在加载研究操作历史...' : 'Loading research activity...',
      isEmpty: auditCount === 0,
      emptyMessage: locale === 'zh' ? '当前筛选条件下没有研究操作历史。' : 'No research activity for the current filter.',
    },
    workflows: {
      title: locale === 'zh' ? '研究工作流状态' : 'Research Workflow State',
      copy: locale === 'zh' ? '直接读取 task orchestrator 的 workflow runs，把回测记录和编排层状态、尝试次数、步骤进度放在同一视图。' : 'Read task-orchestrator workflow runs directly so each backtest can be viewed alongside orchestration status, attempt count, and step progress.',
      badge: workflowCount,
      badgeClassName: 'panel-badge badge-warn',
      loading: workspaceLoading,
      loadingMessage: locale === 'zh' ? '正在加载研究工作流...' : 'Loading research workflows...',
      isEmpty: workflowCount === 0,
      emptyMessage: locale === 'zh' ? '当前筛选条件下没有研究工作流。' : 'No research workflows for the current filter.',
    },
  };
}

export type ResearchTerminalConfig = {
  title: string;
  copy: string;
  badge: ReactNode;
  badgeClassName?: string;
  prelude?: ReactNode;
  loading?: boolean;
  loadingMessage?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string | null;
  footer?: ReactNode;
};
