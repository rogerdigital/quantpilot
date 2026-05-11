// @ts-nocheck
import type { ComputeJob } from '../../../../packages/shared-types/src/compute.ts';

export type JobHandlerResult = {
  ok: boolean;
  result?: Record<string, unknown>;
  error?: string;
  artifacts?: Array<{ name: string; mimeType: string; sizeBytes: number; path: string }>;
};

export type JobHandler = {
  type: string;
  concurrencySafe?: boolean;
  run: (job: ComputeJob, context: JobHandlerContext) => Promise<JobHandlerResult>;
};

export type JobHandlerContext = {
  appendLog: (level: string, message: string, metadata?: Record<string, unknown>) => void;
  attachArtifact: (artifact: {
    name: string;
    mimeType: string;
    sizeBytes: number;
    path: string;
  }) => void;
  reportProgress: (progress: number, message: string) => void;
};
