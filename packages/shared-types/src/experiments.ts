export type ExperimentParameter = {
  name: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'json';
};

export type MetricDirection = 'higher_is_better' | 'lower_is_better';

export type ExperimentMetricValue =
  | { kind: 'scalar'; value: number }
  | { kind: 'distribution'; values: number[]; mean: number; std: number }
  | { kind: 'confusion_matrix'; matrix: number[][]; labels: string[] }
  | { kind: 'time_series'; points: Array<{ time: string; value: number }> }
  | { kind: 'custom'; data: Record<string, unknown> };

export type ExperimentMetric = {
  name: string;
  direction: MetricDirection;
  value: ExperimentMetricValue;
  metadata: Record<string, unknown>;
};

export type ExperimentRunSnapshot = {
  datasetVersionId: string;
  featureVersionId: string;
  codeVersion: string;
  parameters: ExperimentParameter[];
  seed: number;
  runtimeEnvironment: string;
};

export type ExperimentRun = {
  id: string;
  experimentId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  snapshot: ExperimentRunSnapshot;
  metrics: ExperimentMetric[];
  artifactIds: string[];
  isCandidate: boolean;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type Experiment = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  owner: string;
  status: 'draft' | 'running' | 'completed' | 'archived';
  runs: ExperimentRun[];
  candidateRunId: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type ModelEvaluation = {
  id: string;
  modelVersionId: string;
  evaluator: string;
  verdict: 'pass' | 'conditional' | 'fail';
  metrics: ExperimentMetric[];
  notes: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type ModelVersion = {
  id: string;
  modelArtifactId: string;
  version: number;
  trainingDatasetVersionId: string;
  featureVersionId: string;
  codeVersion: string;
  experimentRunId: string;
  metrics: ExperimentMetric[];
  status: 'draft' | 'validated' | 'rejected' | 'deprecated';
  evaluations: ModelEvaluation[];
  approvalState: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type ModelArtifact = {
  id: string;
  name: string;
  description: string;
  modelType: string;
  owner: string;
  activeVersionId: string | null;
  versions: ModelVersion[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};
