// @ts-nocheck
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createExperimentRegistry } from '../src/experiment-registry.ts';
import { createMemoryStore } from './helpers/memory-store.ts';

describe('experiment registry', () => {
  function makeExperiment(id = 'exp-001') {
    return {
      id,
      workspaceId: 'ws-001',
      name: 'Momentum Factor Test',
      description: 'Testing 12M momentum',
      owner: 'researcher-01',
      status: 'draft',
      runs: [],
      candidateRunId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
    };
  }

  function makeRun(id = 'run-001') {
    return {
      id,
      experimentId: 'exp-001',
      status: 'completed',
      snapshot: {
        datasetVersionId: 'dsv-001',
        featureVersionId: 'fv-001',
        codeVersion: 'abc123',
        parameters: [{ name: 'lookback', value: 252, type: 'number' }],
        seed: 42,
        runtimeEnvironment: 'node-22',
      },
      metrics: [],
      artifactIds: [],
      isCandidate: false,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      metadata: {},
    };
  }

  it('registers experiment and creates immutable run snapshot', () => {
    const store = createMemoryStore();
    const registry = createExperimentRegistry(store);

    registry.registerExperiment(makeExperiment());
    const run = registry.createRun('exp-001', makeRun());

    assert.equal(run.snapshot.datasetVersionId, 'dsv-001');
    assert.equal(run.snapshot.featureVersionId, 'fv-001');
    assert.equal(run.snapshot.codeVersion, 'abc123');
    assert.equal(run.snapshot.seed, 42);

    const exp = registry.getExperiment('exp-001');
    assert.equal(exp.runs.length, 1);
    assert.deepEqual(exp.runs[0].snapshot, run.snapshot);
  });

  it('attaches metrics and artifacts to a run', () => {
    const store = createMemoryStore();
    const registry = createExperimentRegistry(store);

    registry.registerExperiment(makeExperiment());
    registry.createRun('exp-001', makeRun());

    registry.attachMetrics('exp-001', 'run-001', [
      {
        name: 'sharpe',
        direction: 'higher_is_better',
        value: { kind: 'scalar', value: 1.2 },
        metadata: {},
      },
      {
        name: 'max_drawdown',
        direction: 'lower_is_better',
        value: { kind: 'scalar', value: 0.15 },
        metadata: {},
      },
    ]);

    registry.attachArtifacts('exp-001', 'run-001', ['artifact-001', 'artifact-002']);

    const exp = registry.getExperiment('exp-001');
    assert.equal(exp.runs[0].metrics.length, 2);
    assert.equal(exp.runs[0].artifactIds.length, 2);
  });

  it('marks candidate run only when it has artifacts', () => {
    const store = createMemoryStore();
    const registry = createExperimentRegistry(store);

    registry.registerExperiment(makeExperiment());
    registry.createRun('exp-001', makeRun());

    assert.throws(() => registry.markCandidate('exp-001', 'run-001'), {
      message: 'Candidate run must reference exact artifacts',
    });

    registry.attachArtifacts('exp-001', 'run-001', ['model-checkpoint-001']);
    const exp = registry.markCandidate('exp-001', 'run-001');

    assert.equal(exp.candidateRunId, 'run-001');
    assert.equal(exp.runs[0].isCandidate, true);
  });

  it('compares runs normalizing metric direction', () => {
    const store = createMemoryStore();
    const registry = createExperimentRegistry(store);

    registry.registerExperiment(makeExperiment());
    registry.createRun('exp-001', makeRun('run-001'));
    registry.createRun('exp-001', makeRun('run-002'));

    registry.attachMetrics('exp-001', 'run-001', [
      {
        name: 'sharpe',
        direction: 'higher_is_better',
        value: { kind: 'scalar', value: 1.5 },
        metadata: {},
      },
      {
        name: 'max_drawdown',
        direction: 'lower_is_better',
        value: { kind: 'scalar', value: 0.12 },
        metadata: {},
      },
    ]);

    registry.attachMetrics('exp-001', 'run-002', [
      {
        name: 'sharpe',
        direction: 'higher_is_better',
        value: { kind: 'scalar', value: 1.2 },
        metadata: {},
      },
      {
        name: 'max_drawdown',
        direction: 'lower_is_better',
        value: { kind: 'scalar', value: 0.08 },
        metadata: {},
      },
    ]);

    const comparison = registry.compareRuns('exp-001', 'run-001', 'run-002');

    const sharpe = comparison.find((c) => c.metric === 'sharpe');
    assert.equal(sharpe.better, 'A');
    assert.equal(sharpe.valueA, 1.5);

    const dd = comparison.find((c) => c.metric === 'max_drawdown');
    assert.equal(dd.better, 'B');
    assert.equal(dd.valueB, 0.08);
  });

  it('run snapshot captures full reproducibility context', () => {
    const store = createMemoryStore();
    const registry = createExperimentRegistry(store);

    registry.registerExperiment(makeExperiment());
    const run = registry.createRun('exp-001', makeRun());

    const snapshot = run.snapshot;
    assert.ok(snapshot.datasetVersionId);
    assert.ok(snapshot.featureVersionId);
    assert.ok(snapshot.codeVersion);
    assert.ok(snapshot.parameters.length > 0);
    assert.equal(typeof snapshot.seed, 'number');
    assert.ok(snapshot.runtimeEnvironment);
  });
});
