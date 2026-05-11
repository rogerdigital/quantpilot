import type { ComputeJobSummary, ComputeQueueSummary } from './useComputeJobs';

type ComputeQueuePanelProps = {
  jobs: ComputeJobSummary[];
  queue: ComputeQueueSummary;
  locale?: 'en' | 'zh';
};

const STATUS_LABELS: Record<string, { en: string; zh: string }> = {
  queued: { en: 'Queued', zh: '排队中' },
  leased: { en: 'Leased', zh: '已分配' },
  running: { en: 'Running', zh: '运行中' },
  succeeded: { en: 'Succeeded', zh: '成功' },
  failed: { en: 'Failed', zh: '失败' },
  timeout: { en: 'Timeout', zh: '超时' },
  cancelled: { en: 'Cancelled', zh: '已取消' },
};

function statusLabel(status: string, locale: 'en' | 'zh'): string {
  return STATUS_LABELS[status]?.[locale] || status;
}

export function ComputeQueuePanel({ jobs, queue, locale = 'en' }: ComputeQueuePanelProps) {
  const title = locale === 'zh' ? '算力任务队列' : 'Compute Job Queue';
  const emptyMessage = locale === 'zh' ? '暂无计算任务' : 'No compute jobs in queue';

  return (
    <section data-testid="compute-queue-panel">
      <h3>{title}</h3>
      <div className="queue-summary">
        <span data-field="active">{queue.activeJobs} active</span>
        <span data-field="queued">{queue.queuedJobs} queued</span>
        <span data-field="completed">{queue.totalCompleted} completed</span>
        <span data-field="failed">{queue.totalFailed} failed</span>
      </div>
      {jobs.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>{locale === 'zh' ? '类型' : 'Type'}</th>
              <th>{locale === 'zh' ? '状态' : 'Status'}</th>
              <th>{locale === 'zh' ? '所有者' : 'Owner'}</th>
              <th>{locale === 'zh' ? '资源' : 'Resource'}</th>
              <th>{locale === 'zh' ? '关联实体' : 'Linked Entity'}</th>
              <th>{locale === 'zh' ? '最新日志' : 'Latest Log'}</th>
              <th>{locale === 'zh' ? '操作' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} data-status={job.status}>
                <td>{job.id}</td>
                <td>{job.type}</td>
                <td>
                  <span className={`status-badge status-${job.status}`}>
                    {statusLabel(job.status, locale)}
                  </span>
                  {job.heartbeat && (
                    <span className="progress">{Math.round(job.heartbeat.progress * 100)}%</span>
                  )}
                </td>
                <td>{job.owner}</td>
                <td>
                  {job.resource.cpu}C / {job.resource.memoryMb}MB
                  {job.resource.gpuCount > 0 && ` / ${job.resource.gpuCount}GPU`} (
                  {job.resource.priority})
                </td>
                <td>
                  {job.linkedEntityType ? `${job.linkedEntityType}:${job.linkedEntityId}` : '—'}
                </td>
                <td>{job.logs.length > 0 ? job.logs[job.logs.length - 1].message : '—'}</td>
                <td>
                  {job.retrySafe && (job.status === 'failed' || job.status === 'timeout') && (
                    <button data-action="retry" data-job-id={job.id}>
                      {locale === 'zh' ? '重试' : 'Retry'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
