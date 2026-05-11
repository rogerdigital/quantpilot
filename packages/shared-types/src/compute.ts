export type ComputeJobStatus =
  | 'queued'
  | 'leased'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'timeout'
  | 'cancelled';

export type ComputeJobType =
  | 'backtest'
  | 'data_quality'
  | 'report'
  | 'model_training'
  | 'research'
  | 'custom';

export type ComputeResourceRequest = {
  cpu: number;
  memoryMb: number;
  gpuCount: number;
  estimatedDurationMs: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
};

export type ComputeArtifact = {
  id: string;
  jobId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  path: string;
  createdAt: string;
};

export type ComputeJobLogEvent = {
  id: string;
  jobId: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type ComputeWorkerHeartbeat = {
  workerId: string;
  jobId: string;
  progress: number;
  message: string;
  timestamp: string;
};

export type ComputeJob = {
  id: string;
  type: ComputeJobType;
  status: ComputeJobStatus;
  owner: string;
  workspaceId?: string;
  linkedEntityId?: string;
  linkedEntityType?: 'backtest' | 'research' | 'model' | 'promotion' | 'strategy';
  resource: ComputeResourceRequest;
  params: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  artifacts: ComputeArtifact[];
  logs: ComputeJobLogEvent[];
  heartbeat: ComputeWorkerHeartbeat | null;
  retrySafe: boolean;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  leasedAt: string | null;
  leasedBy: string | null;
  leaseExpiresAt: string | null;
  timeoutMs: number;
};

export type ComputeQueue = {
  id: string;
  name: string;
  maxConcurrency: number;
  activeJobs: number;
  queuedJobs: number;
  totalCompleted: number;
  totalFailed: number;
};
