import { createHash } from 'node:crypto';

export type SpecHashInput = {
  strategyVersionId: string;
  datasetVersionId: string;
  featureVersionId: string;
  benchmark: string;
  timeRange: { start: string; end: string };
  rebalanceCadence: string;
  costModel: Record<string, unknown>;
  slippageModel: Record<string, unknown>;
  riskConstraints: Record<string, unknown>;
  universe: string[];
  initialCapital: number;
  seed: number;
};

export function computeSpecHash(input: SpecHashInput): string {
  const normalized = {
    strategyVersionId: input.strategyVersionId,
    datasetVersionId: input.datasetVersionId,
    featureVersionId: input.featureVersionId,
    benchmark: input.benchmark,
    timeRange: { start: input.timeRange.start, end: input.timeRange.end },
    rebalanceCadence: input.rebalanceCadence,
    costModel: sortKeys(input.costModel),
    slippageModel: sortKeys(input.slippageModel),
    riskConstraints: sortKeys(input.riskConstraints),
    universe: [...input.universe].sort(),
    initialCapital: input.initialCapital,
    seed: input.seed,
  };
  const payload = JSON.stringify(normalized);
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

function sortKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key];
  }
  return sorted;
}
