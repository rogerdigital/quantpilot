import type {
  Experiment,
  ExperimentMetric,
  ExperimentRun,
  MetricDirection,
} from '../../shared-types/src/experiments.ts';

type ExperimentRegistryStore = {
  readCollection: (filename: string) => any[];
  writeCollection: (filename: string, entries: any[]) => void;
};

export function createExperimentRegistry(store: ExperimentRegistryStore) {
  const EXPERIMENTS_FILE = 'experiments.json';

  function listExperiments(): Experiment[] {
    return store.readCollection(EXPERIMENTS_FILE);
  }

  function getExperiment(id: string): Experiment | undefined {
    return listExperiments().find((e) => e.id === id);
  }

  function registerExperiment(experiment: Experiment): Experiment {
    const existing = listExperiments();
    existing.push(experiment);
    store.writeCollection(EXPERIMENTS_FILE, existing);
    return experiment;
  }

  function createRun(experimentId: string, run: ExperimentRun): ExperimentRun {
    const experiments = listExperiments();
    const exp = experiments.find((e) => e.id === experimentId);
    if (!exp) throw new Error(`Experiment ${experimentId} not found`);
    exp.runs.push(run);
    exp.updatedAt = new Date().toISOString();
    store.writeCollection(EXPERIMENTS_FILE, experiments);
    return run;
  }

  function attachMetrics(
    experimentId: string,
    runId: string,
    metrics: ExperimentMetric[]
  ): ExperimentRun {
    const experiments = listExperiments();
    const exp = experiments.find((e) => e.id === experimentId);
    if (!exp) throw new Error(`Experiment ${experimentId} not found`);
    const run = exp.runs.find((r) => r.id === runId);
    if (!run) throw new Error(`Run ${runId} not found`);
    run.metrics.push(...metrics);
    store.writeCollection(EXPERIMENTS_FILE, experiments);
    return run;
  }

  function attachArtifacts(
    experimentId: string,
    runId: string,
    artifactIds: string[]
  ): ExperimentRun {
    const experiments = listExperiments();
    const exp = experiments.find((e) => e.id === experimentId);
    if (!exp) throw new Error(`Experiment ${experimentId} not found`);
    const run = exp.runs.find((r) => r.id === runId);
    if (!run) throw new Error(`Run ${runId} not found`);
    run.artifactIds.push(...artifactIds);
    store.writeCollection(EXPERIMENTS_FILE, experiments);
    return run;
  }

  function markCandidate(experimentId: string, runId: string): Experiment {
    const experiments = listExperiments();
    const exp = experiments.find((e) => e.id === experimentId);
    if (!exp) throw new Error(`Experiment ${experimentId} not found`);
    const run = exp.runs.find((r) => r.id === runId);
    if (!run) throw new Error(`Run ${runId} not found`);
    if (run.artifactIds.length === 0) {
      throw new Error('Candidate run must reference exact artifacts');
    }
    exp.runs.forEach((r) => {
      r.isCandidate = false;
    });
    run.isCandidate = true;
    exp.candidateRunId = runId;
    exp.updatedAt = new Date().toISOString();
    store.writeCollection(EXPERIMENTS_FILE, experiments);
    return exp;
  }

  function compareRuns(
    experimentId: string,
    runIdA: string,
    runIdB: string
  ): Array<{
    metric: string;
    direction: MetricDirection;
    valueA: number | null;
    valueB: number | null;
    better: 'A' | 'B' | 'tie';
  }> {
    const exp = getExperiment(experimentId);
    if (!exp) throw new Error(`Experiment ${experimentId} not found`);
    const runA = exp.runs.find((r) => r.id === runIdA);
    const runB = exp.runs.find((r) => r.id === runIdB);
    if (!runA || !runB) throw new Error('Run not found');

    const metricNames = new Set([
      ...runA.metrics.map((m) => m.name),
      ...runB.metrics.map((m) => m.name),
    ]);

    return Array.from(metricNames).map((name) => {
      const mA = runA.metrics.find((m) => m.name === name);
      const mB = runB.metrics.find((m) => m.name === name);
      const direction = mA?.direction || mB?.direction || 'higher_is_better';
      const valA = mA?.value.kind === 'scalar' ? mA.value.value : null;
      const valB = mB?.value.kind === 'scalar' ? mB.value.value : null;

      let better: 'A' | 'B' | 'tie' = 'tie';
      if (valA !== null && valB !== null) {
        if (direction === 'higher_is_better') {
          better = valA > valB ? 'A' : valA < valB ? 'B' : 'tie';
        } else {
          better = valA < valB ? 'A' : valA > valB ? 'B' : 'tie';
        }
      }

      return { metric: name, direction, valueA: valA, valueB: valB, better };
    });
  }

  return {
    listExperiments,
    getExperiment,
    registerExperiment,
    createRun,
    attachMetrics,
    attachArtifacts,
    markCandidate,
    compareRuns,
  };
}
