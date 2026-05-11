// @ts-nocheck
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createModelRegistry } from '../src/model-registry.ts';
import { createMemoryStore } from './helpers/memory-store.ts';

describe('model registry', () => {
  function makeModel(id = 'model-001') {
    return {
      id,
      name: 'Momentum Factor Model',
      description: 'XGBoost model for momentum prediction',
      modelType: 'xgboost',
      owner: 'researcher-01',
      activeVersionId: null,
      versions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
    };
  }

  function makeVersion(id = 'mv-001') {
    return {
      id,
      modelArtifactId: 'model-001',
      version: 1,
      trainingDatasetVersionId: 'dsv-001',
      featureVersionId: 'fv-001',
      codeVersion: 'abc123',
      experimentRunId: 'run-001',
      metrics: [
        {
          name: 'sharpe',
          direction: 'higher_is_better',
          value: { kind: 'scalar', value: 1.3 },
          metadata: {},
        },
      ],
      status: 'draft',
      evaluations: [],
      approvalState: 'pending',
      createdAt: new Date().toISOString(),
      metadata: {},
    };
  }

  it('registers model and creates version linked to experiment run', () => {
    const store = createMemoryStore();
    const registry = createModelRegistry(store);

    registry.registerModel(makeModel());
    const version = registry.createVersion('model-001', makeVersion());

    assert.equal(version.experimentRunId, 'run-001');
    assert.equal(version.trainingDatasetVersionId, 'dsv-001');
    assert.equal(version.featureVersionId, 'fv-001');

    const model = registry.getModel('model-001');
    assert.equal(model.versions.length, 1);
  });

  it('links version to experiment run', () => {
    const store = createMemoryStore();
    const registry = createModelRegistry(store);

    registry.registerModel(makeModel());
    registry.createVersion('model-001', makeVersion());

    const updated = registry.linkToExperimentRun('model-001', 'mv-001', 'run-002');
    assert.equal(updated.experimentRunId, 'run-002');
  });

  it('model approval is separate from strategy promotion', () => {
    const store = createMemoryStore();
    const registry = createModelRegistry(store);

    registry.registerModel(makeModel());
    registry.createVersion('model-001', makeVersion());

    registry.updateStatus('model-001', 'mv-001', 'validated');
    const model = registry.getModel('model-001');
    const version = model.versions[0];
    assert.equal(version.status, 'validated');
    assert.equal(version.approvalState, 'pending');
  });

  it('attaches evaluation reports', () => {
    const store = createMemoryStore();
    const registry = createModelRegistry(store);

    registry.registerModel(makeModel());
    registry.createVersion('model-001', makeVersion());

    registry.attachEvaluation('model-001', 'mv-001', {
      id: 'eval-001',
      modelVersionId: 'mv-001',
      evaluator: 'risk-officer-01',
      verdict: 'pass',
      metrics: [
        {
          name: 'out_of_sample_sharpe',
          direction: 'higher_is_better',
          value: { kind: 'scalar', value: 0.9 },
          metadata: {},
        },
      ],
      notes: 'Model performs acceptably in OOS validation',
      createdAt: new Date().toISOString(),
      metadata: {},
    });

    const model = registry.getModel('model-001');
    assert.equal(model.versions[0].evaluations.length, 1);
    assert.equal(model.versions[0].evaluations[0].verdict, 'pass');
  });

  it('only validated versions can be set as active', () => {
    const store = createMemoryStore();
    const registry = createModelRegistry(store);

    registry.registerModel(makeModel());
    registry.createVersion('model-001', makeVersion());

    assert.throws(() => registry.setActiveVersion('model-001', 'mv-001'), {
      message: 'Only validated versions can be set as active',
    });

    registry.updateStatus('model-001', 'mv-001', 'validated');
    const model = registry.setActiveVersion('model-001', 'mv-001');
    assert.equal(model.activeVersionId, 'mv-001');
  });

  it('rejects setting rejected version as active', () => {
    const store = createMemoryStore();
    const registry = createModelRegistry(store);

    registry.registerModel(makeModel());
    registry.createVersion('model-001', makeVersion());
    registry.updateStatus('model-001', 'mv-001', 'rejected');

    assert.throws(() => registry.setActiveVersion('model-001', 'mv-001'));
  });
});
