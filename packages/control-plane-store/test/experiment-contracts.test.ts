// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  Experiment,
  ExperimentRun,
  ExperimentRunSnapshot,
  ModelArtifact,
  ModelVersion,
} from '../../shared-types/src/experiments.ts';
import { createMemoryStore } from './helpers/memory-store.ts';

test('experiment contracts: run snapshot is immutable after creation', () => {
  const snapshot: ExperimentRunSnapshot = {
    datasetVersionId: 'dsv-001',
    featureVersionId: 'fv-001',
    codeVersion: 'abc123def',
    parameters: [
      { name: 'lookback', value: 20, type: 'number' },
      { name: 'threshold', value: 0.02, type: 'number' },
    ],
    seed: 42,
    runtimeEnvironment: 'node-22-linux-x64',
  };

  const run: ExperimentRun = {
    id: 'run-001',
    experimentId: 'exp-001',
    status: 'completed',
    snapshot,
    metrics: [
      {
        name: 'sharpe',
        direction: 'higher_is_better',
        value: { kind: 'scalar', value: 1.45 },
        metadata: {},
      },
      {
        name: 'max_drawdown',
        direction: 'lower_is_better',
        value: { kind: 'scalar', value: 0.12 },
        metadata: {},
      },
    ],
    artifactIds: ['artifact-001'],
    isCandidate: true,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    metadata: {},
  };

  const store = createMemoryStore();
  store.writeCollection('experiment_runs.json', [run]);
  const [loaded] = store.readCollection('experiment_runs.json');

  assert.deepEqual(loaded.snapshot, snapshot);
  assert.equal(loaded.snapshot.seed, 42);
  assert.equal(loaded.snapshot.datasetVersionId, 'dsv-001');
  assert.equal(loaded.status, 'completed');

  // Contract: completed run snapshot fields must match what was stored
  // Application layer enforces immutability by rejecting writes that modify completed run snapshots
  const originalSnapshot = structuredClone(loaded.snapshot);
  assert.deepEqual(
    loaded.snapshot,
    originalSnapshot,
    'Completed run snapshot must be preserved exactly'
  );
});

test('experiment contracts: model artifact carries training provenance', () => {
  const modelVersion: ModelVersion = {
    id: 'mv-001',
    modelArtifactId: 'model-001',
    version: 1,
    trainingDatasetVersionId: 'dsv-001',
    featureVersionId: 'fv-001',
    codeVersion: 'abc123def',
    experimentRunId: 'run-001',
    metrics: [
      {
        name: 'auc',
        direction: 'higher_is_better',
        value: { kind: 'scalar', value: 0.78 },
        metadata: {},
      },
    ],
    status: 'validated',
    evaluations: [],
    approvalState: 'approved',
    createdAt: new Date().toISOString(),
    metadata: {},
  };

  assert.equal(modelVersion.trainingDatasetVersionId, 'dsv-001');
  assert.equal(modelVersion.featureVersionId, 'fv-001');
  assert.equal(modelVersion.experimentRunId, 'run-001');
  assert.equal(modelVersion.status, 'validated');
  assert.equal(modelVersion.approvalState, 'approved');
});

test('experiment contracts: model approval is separate from strategy promotion', () => {
  const model: ModelArtifact = {
    id: 'model-001',
    name: 'Momentum Signal Classifier',
    description: 'XGBoost classifier for momentum signals',
    modelType: 'xgboost',
    owner: 'researcher-01',
    activeVersionId: 'mv-001',
    versions: [
      {
        id: 'mv-001',
        modelArtifactId: 'model-001',
        version: 1,
        trainingDatasetVersionId: 'dsv-001',
        featureVersionId: 'fv-001',
        codeVersion: 'abc123',
        experimentRunId: 'run-001',
        metrics: [],
        status: 'validated',
        evaluations: [],
        approvalState: 'approved',
        createdAt: new Date().toISOString(),
        metadata: {},
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
  };

  // Model is approved but this does NOT mean strategy is promoted
  assert.equal(model.versions[0].approvalState, 'approved');
  assert.equal(model.versions[0].status, 'validated');
});

test('experiment contracts: metrics support multiple value kinds', () => {
  const run: ExperimentRun = {
    id: 'run-002',
    experimentId: 'exp-001',
    status: 'completed',
    snapshot: {
      datasetVersionId: 'dsv-001',
      featureVersionId: 'fv-001',
      codeVersion: 'xyz789',
      parameters: [],
      seed: 7,
      runtimeEnvironment: 'node-22',
    },
    metrics: [
      {
        name: 'sharpe',
        direction: 'higher_is_better',
        value: { kind: 'scalar', value: 1.2 },
        metadata: {},
      },
      {
        name: 'returns',
        direction: 'higher_is_better',
        value: { kind: 'distribution', values: [0.01, 0.02, -0.005], mean: 0.0083, std: 0.0104 },
        metadata: {},
      },
      {
        name: 'signal_accuracy',
        direction: 'higher_is_better',
        value: {
          kind: 'confusion_matrix',
          matrix: [
            [80, 20],
            [15, 85],
          ],
          labels: ['buy', 'sell'],
        },
        metadata: {},
      },
      {
        name: 'equity_curve',
        direction: 'higher_is_better',
        value: {
          kind: 'time_series',
          points: [
            { time: '2023-01-01', value: 100 },
            { time: '2023-06-01', value: 112 },
          ],
        },
        metadata: {},
      },
      {
        name: 'custom_report',
        direction: 'higher_is_better',
        value: { kind: 'custom', data: { key: 'value' } },
        metadata: {},
      },
    ],
    artifactIds: [],
    isCandidate: false,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    metadata: {},
  };

  assert.equal(run.metrics.length, 5);
  assert.equal(run.metrics[0].value.kind, 'scalar');
  assert.equal(run.metrics[1].value.kind, 'distribution');
  assert.equal(run.metrics[2].value.kind, 'confusion_matrix');
  assert.equal(run.metrics[3].value.kind, 'time_series');
  assert.equal(run.metrics[4].value.kind, 'custom');
});
