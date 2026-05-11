import type { ComputeJobSummary } from './useComputeJobs';

type ComputeArtifactPanelProps = {
  job: ComputeJobSummary | null;
  locale?: 'en' | 'zh';
};

export function ComputeArtifactPanel({ job, locale = 'en' }: ComputeArtifactPanelProps) {
  const title = locale === 'zh' ? '任务产物' : 'Job Artifacts';
  const emptyMessage =
    locale === 'zh' ? '选择一个任务以查看产物' : 'Select a job to view artifacts';
  const noArtifacts = locale === 'zh' ? '该任务暂无产物' : 'No artifacts for this job';

  if (!job) {
    return (
      <section data-testid="compute-artifact-panel">
        <h3>{title}</h3>
        <p className="empty-state">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section data-testid="compute-artifact-panel">
      <h3>{title}</h3>
      <div className="job-meta">
        <span data-field="job-id">{job.id}</span>
        <span data-field="job-type">{job.type}</span>
        <span data-field="job-status">{job.status}</span>
      </div>
      {job.artifacts.length === 0 ? (
        <p className="empty-state">{noArtifacts}</p>
      ) : (
        <ul className="artifact-list">
          {job.artifacts.map((artifact) => (
            <li key={artifact.id} data-artifact-id={artifact.id}>
              <span className="artifact-name">{artifact.name}</span>
              <span className="artifact-mime">{artifact.mimeType}</span>
              <span className="artifact-path">{artifact.path}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
