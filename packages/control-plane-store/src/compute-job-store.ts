import type {
  ComputeArtifact,
  ComputeJob,
  ComputeJobLogEvent,
  ComputeJobStatus,
  ComputeWorkerHeartbeat,
} from '../../shared-types/src/compute.ts';

export class ComputeJobStore {
  private jobs: Map<string, ComputeJob> = new Map();

  enqueue(job: ComputeJob): ComputeJob {
    const entry = structuredClone(job);
    entry.status = 'queued';
    entry.createdAt = entry.createdAt || new Date().toISOString();
    this.jobs.set(entry.id, entry);
    return structuredClone(entry);
  }

  get(id: string): ComputeJob | null {
    const job = this.jobs.get(id);
    return job ? structuredClone(job) : null;
  }

  list(): ComputeJob[] {
    return [...this.jobs.values()].map((j) => structuredClone(j));
  }

  listByStatus(status: ComputeJobStatus): ComputeJob[] {
    return [...this.jobs.values()]
      .filter((j) => j.status === status)
      .map((j) => structuredClone(j));
  }

  lease(jobId: string, workerId: string, durationMs: number): ComputeJob | null {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'queued') return null;
    const now = new Date().toISOString();
    job.status = 'leased';
    job.leasedAt = now;
    job.leasedBy = workerId;
    job.leaseExpiresAt = new Date(Date.now() + durationMs).toISOString();
    return structuredClone(job);
  }

  start(jobId: string): ComputeJob | null {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'leased') return null;
    job.status = 'running';
    job.startedAt = new Date().toISOString();
    return structuredClone(job);
  }

  heartbeat(jobId: string, heartbeat: ComputeWorkerHeartbeat): ComputeJob | null {
    const job = this.jobs.get(jobId);
    if (!job || (job.status !== 'running' && job.status !== 'leased')) return null;
    job.heartbeat = structuredClone(heartbeat);
    return structuredClone(job);
  }

  appendLog(jobId: string, event: ComputeJobLogEvent): ComputeJob | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    job.logs.push(structuredClone(event));
    return structuredClone(job);
  }

  attachArtifact(jobId: string, artifact: ComputeArtifact): ComputeJob | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    job.artifacts.push(structuredClone(artifact));
    return structuredClone(job);
  }

  complete(jobId: string, result: Record<string, unknown>): ComputeJob | null {
    const job = this.jobs.get(jobId);
    if (!job || (job.status !== 'running' && job.status !== 'leased')) return null;
    job.status = 'succeeded';
    job.result = structuredClone(result);
    job.completedAt = new Date().toISOString();
    return structuredClone(job);
  }

  fail(jobId: string, error: string): ComputeJob | null {
    const job = this.jobs.get(jobId);
    if (!job || (job.status !== 'running' && job.status !== 'leased')) return null;
    job.status = 'failed';
    job.error = error;
    job.completedAt = new Date().toISOString();
    return structuredClone(job);
  }

  timeout(jobId: string): ComputeJob | null {
    const job = this.jobs.get(jobId);
    if (!job || (job.status !== 'running' && job.status !== 'leased')) return null;
    job.status = 'timeout';
    job.error = 'Job exceeded timeout';
    job.completedAt = new Date().toISOString();
    return structuredClone(job);
  }

  cancel(jobId: string): ComputeJob | null {
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'succeeded' || job.status === 'failed') return null;
    job.status = 'cancelled';
    job.completedAt = new Date().toISOString();
    return structuredClone(job);
  }

  recoverExpiredLeases(): ComputeJob[] {
    const now = Date.now();
    const recovered: ComputeJob[] = [];
    for (const job of this.jobs.values()) {
      if (job.status === 'leased' && job.leaseExpiresAt) {
        if (new Date(job.leaseExpiresAt).getTime() <= now) {
          job.status = 'queued';
          job.leasedAt = null;
          job.leasedBy = null;
          job.leaseExpiresAt = null;
          recovered.push(structuredClone(job));
        }
      }
    }
    return recovered;
  }
}
