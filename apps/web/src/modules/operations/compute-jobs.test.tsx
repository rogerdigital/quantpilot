import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ComputeArtifactPanel } from './ComputeArtifactPanel';
import { ComputeQueuePanel } from './ComputeQueuePanel';
import type { ComputeJobSummary, ComputeQueueSummary } from './useComputeJobs';

const mockQueue: ComputeQueueSummary = {
  maxConcurrency: 4,
  activeJobs: 2,
  queuedJobs: 3,
  totalCompleted: 10,
  totalFailed: 1,
};

const mockJob: ComputeJobSummary = {
  id: 'job-1',
  type: 'backtest',
  status: 'running',
  owner: 'researcher@desk',
  linkedEntityType: 'backtest',
  linkedEntityId: 'bt-run-1',
  resource: { cpu: 4, memoryMb: 8192, gpuCount: 1, priority: 'high' },
  heartbeat: { progress: 0.6, message: '60% complete' },
  logs: [{ level: 'info', message: 'Processing batch 3/5', timestamp: '2026-01-01T00:00:00Z' }],
  artifacts: [
    {
      id: 'art-1',
      name: 'report.json',
      mimeType: 'application/json',
      path: '/artifacts/report.json',
    },
  ],
  retrySafe: true,
  createdAt: '2026-01-01T00:00:00Z',
  startedAt: '2026-01-01T00:01:00Z',
  completedAt: null,
};

const failedJob: ComputeJobSummary = {
  ...mockJob,
  id: 'job-2',
  status: 'failed',
  heartbeat: null,
  logs: [{ level: 'error', message: 'OOM killed', timestamp: '2026-01-01T00:02:00Z' }],
  artifacts: [],
  completedAt: '2026-01-01T00:02:00Z',
};

describe('ComputeQueuePanel', () => {
  it('renders queue summary and job rows', () => {
    const html = renderToStaticMarkup(
      <ComputeQueuePanel jobs={[mockJob, failedJob]} queue={mockQueue} locale="en" />
    );
    expect(html).toContain('Compute Job Queue');
    expect(html).toContain('2 active');
    expect(html).toContain('3 queued');
    expect(html).toContain('10 completed');
    expect(html).toContain('backtest:bt-run-1');
    expect(html).toContain('Processing batch 3/5');
    expect(html).toContain('60%');
  });

  it('renders empty state when no jobs', () => {
    const html = renderToStaticMarkup(
      <ComputeQueuePanel jobs={[]} queue={mockQueue} locale="en" />
    );
    expect(html).toContain('No compute jobs in queue');
  });

  it('shows retry button only for failed retry-safe jobs', () => {
    const html = renderToStaticMarkup(
      <ComputeQueuePanel jobs={[mockJob, failedJob]} queue={mockQueue} locale="en" />
    );
    expect(html).toContain('data-action="retry"');
    expect(html).toContain('data-job-id="job-2"');
  });

  it('renders chinese locale', () => {
    const html = renderToStaticMarkup(
      <ComputeQueuePanel jobs={[]} queue={mockQueue} locale="zh" />
    );
    expect(html).toContain('算力任务队列');
    expect(html).toContain('暂无计算任务');
  });

  it('shows resource with GPU count when present', () => {
    const html = renderToStaticMarkup(
      <ComputeQueuePanel jobs={[mockJob]} queue={mockQueue} locale="en" />
    );
    expect(html).toContain('1GPU');
    expect(html).toContain('(high)');
  });
});

describe('ComputeArtifactPanel', () => {
  it('renders artifact list for selected job', () => {
    const html = renderToStaticMarkup(<ComputeArtifactPanel job={mockJob} locale="en" />);
    expect(html).toContain('Job Artifacts');
    expect(html).toContain('report.json');
    expect(html).toContain('application/json');
    expect(html).toContain('/artifacts/report.json');
  });

  it('renders empty selection state when no job', () => {
    const html = renderToStaticMarkup(<ComputeArtifactPanel job={null} locale="en" />);
    expect(html).toContain('Select a job to view artifacts');
  });

  it('renders no-artifacts state', () => {
    const html = renderToStaticMarkup(<ComputeArtifactPanel job={failedJob} locale="en" />);
    expect(html).toContain('No artifacts for this job');
  });

  it('renders chinese locale', () => {
    const html = renderToStaticMarkup(<ComputeArtifactPanel job={null} locale="zh" />);
    expect(html).toContain('任务产物');
    expect(html).toContain('选择一个任务以查看产物');
  });

  it('shows job metadata', () => {
    const html = renderToStaticMarkup(<ComputeArtifactPanel job={mockJob} locale="en" />);
    expect(html).toContain('job-1');
    expect(html).toContain('backtest');
    expect(html).toContain('running');
  });
});
