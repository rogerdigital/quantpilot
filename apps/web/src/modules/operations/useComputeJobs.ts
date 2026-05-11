import { useEffect, useState } from 'react';

export type ComputeJobSummary = {
  id: string;
  type: string;
  status: string;
  owner: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  resource: { cpu: number; memoryMb: number; gpuCount: number; priority: string };
  heartbeat: { progress: number; message: string } | null;
  logs: Array<{ level: string; message: string; timestamp: string }>;
  artifacts: Array<{ id: string; name: string; mimeType: string; path: string }>;
  retrySafe: boolean;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type ComputeQueueSummary = {
  maxConcurrency: number;
  activeJobs: number;
  queuedJobs: number;
  totalCompleted: number;
  totalFailed: number;
};

export type ComputeJobsState = {
  jobs: ComputeJobSummary[];
  queue: ComputeQueueSummary;
  loading: boolean;
};

const EMPTY_QUEUE: ComputeQueueSummary = {
  maxConcurrency: 4,
  activeJobs: 0,
  queuedJobs: 0,
  totalCompleted: 0,
  totalFailed: 0,
};

export function useComputeJobs(): ComputeJobsState {
  const [state, setState] = useState<ComputeJobsState>({
    jobs: [],
    queue: EMPTY_QUEUE,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchJobs() {
      try {
        const [jobsRes, queueRes] = await Promise.all([
          fetch('/api/compute/jobs'),
          fetch('/api/compute/queue'),
        ]);
        if (cancelled) return;
        const jobsData = await jobsRes.json();
        const queueData = await queueRes.json();
        setState({
          jobs: jobsData.jobs || [],
          queue: queueData.queue || EMPTY_QUEUE,
          loading: false,
        });
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    fetchJobs();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
