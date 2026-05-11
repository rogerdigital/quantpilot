// @ts-nocheck
import type {
  ModelArtifact,
  ModelEvaluation,
  ModelVersion,
} from '../../shared-types/src/experiments.ts';

type ModelRegistryStore = {
  readCollection: (filename: string) => any[];
  writeCollection: (filename: string, entries: any[]) => void;
};

export function createModelRegistry(store: ModelRegistryStore) {
  const MODELS_FILE = 'model_artifacts.json';

  function listModels(): ModelArtifact[] {
    return store.readCollection(MODELS_FILE);
  }

  function getModel(id: string): ModelArtifact | undefined {
    return listModels().find((m) => m.id === id);
  }

  function registerModel(model: ModelArtifact): ModelArtifact {
    const existing = listModels();
    existing.push(model);
    store.writeCollection(MODELS_FILE, existing);
    return model;
  }

  function createVersion(modelId: string, version: ModelVersion): ModelVersion {
    const models = listModels();
    const model = models.find((m) => m.id === modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);
    model.versions.push(version);
    model.updatedAt = new Date().toISOString();
    store.writeCollection(MODELS_FILE, models);
    return version;
  }

  function linkToExperimentRun(
    modelId: string,
    versionId: string,
    experimentRunId: string
  ): ModelVersion {
    const models = listModels();
    const model = models.find((m) => m.id === modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);
    const version = model.versions.find((v) => v.id === versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);
    version.experimentRunId = experimentRunId;
    store.writeCollection(MODELS_FILE, models);
    return version;
  }

  function updateStatus(
    modelId: string,
    versionId: string,
    status: ModelVersion['status']
  ): ModelVersion {
    const models = listModels();
    const model = models.find((m) => m.id === modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);
    const version = model.versions.find((v) => v.id === versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);
    version.status = status;
    model.updatedAt = new Date().toISOString();
    store.writeCollection(MODELS_FILE, models);
    return version;
  }

  function attachEvaluation(
    modelId: string,
    versionId: string,
    evaluation: ModelEvaluation
  ): ModelVersion {
    const models = listModels();
    const model = models.find((m) => m.id === modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);
    const version = model.versions.find((v) => v.id === versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);
    version.evaluations.push(evaluation);
    store.writeCollection(MODELS_FILE, models);
    return version;
  }

  function setActiveVersion(modelId: string, versionId: string): ModelArtifact {
    const models = listModels();
    const model = models.find((m) => m.id === modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);
    const version = model.versions.find((v) => v.id === versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);
    if (version.status !== 'validated') {
      throw new Error('Only validated versions can be set as active');
    }
    model.activeVersionId = versionId;
    model.updatedAt = new Date().toISOString();
    store.writeCollection(MODELS_FILE, models);
    return model;
  }

  return {
    listModels,
    getModel,
    registerModel,
    createVersion,
    linkToExperimentRun,
    updateStatus,
    attachEvaluation,
    setActiveVersion,
  };
}
