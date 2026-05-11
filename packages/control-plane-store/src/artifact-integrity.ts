// @ts-nocheck

import { createHash } from 'node:crypto';

export type ArtifactIntegrityIssue = {
  artifactId: string;
  check:
    | 'missing_metadata'
    | 'missing_payload'
    | 'hash_mismatch'
    | 'orphaned'
    | 'stale_active_dataset'
    | 'promotion_missing_evidence';
  severity: 'warning' | 'error';
  message: string;
  detectedAt: string;
};

export type ArtifactRecord = {
  id: string;
  type: string;
  metadata?: Record<string, unknown> | null;
  payload?: string | null;
  hash?: string | null;
  parentId?: string | null;
  createdAt: string;
};

export type DatasetVersionRecord = {
  id: string;
  datasetId: string;
  active: boolean;
  activatedAt: string;
};

export type PromotionRecord = {
  id: string;
  strategyId: string;
  evidence: string[];
};

export type ArtifactIntegrityReport = {
  checkedAt: string;
  totalArtifacts: number;
  issues: ArtifactIntegrityIssue[];
  healthy: number;
  unhealthy: number;
};

export function computePayloadHash(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

export function checkMissingMetadata(artifacts: ArtifactRecord[]): ArtifactIntegrityIssue[] {
  return artifacts
    .filter((a) => !a.metadata || Object.keys(a.metadata).length === 0)
    .map((a) => ({
      artifactId: a.id,
      check: 'missing_metadata' as const,
      severity: 'warning' as const,
      message: `Artifact ${a.id} has no metadata`,
      detectedAt: new Date().toISOString(),
    }));
}

export function checkMissingPayload(artifacts: ArtifactRecord[]): ArtifactIntegrityIssue[] {
  return artifacts
    .filter((a) => !a.payload)
    .map((a) => ({
      artifactId: a.id,
      check: 'missing_payload' as const,
      severity: 'error' as const,
      message: `Artifact ${a.id} has no payload`,
      detectedAt: new Date().toISOString(),
    }));
}

export function checkHashMismatch(artifacts: ArtifactRecord[]): ArtifactIntegrityIssue[] {
  return artifacts
    .filter((a) => a.payload && a.hash && computePayloadHash(a.payload) !== a.hash)
    .map((a) => ({
      artifactId: a.id,
      check: 'hash_mismatch' as const,
      severity: 'error' as const,
      message: `Artifact ${a.id} payload hash does not match stored hash`,
      detectedAt: new Date().toISOString(),
    }));
}

export function checkOrphaned(artifacts: ArtifactRecord[]): ArtifactIntegrityIssue[] {
  const ids = new Set(artifacts.map((a) => a.id));
  return artifacts
    .filter((a) => a.parentId && !ids.has(a.parentId))
    .map((a) => ({
      artifactId: a.id,
      check: 'orphaned' as const,
      severity: 'warning' as const,
      message: `Artifact ${a.id} references non-existent parent ${a.parentId}`,
      detectedAt: new Date().toISOString(),
    }));
}

export function checkStaleActiveDataset(
  datasets: DatasetVersionRecord[],
  staleThresholdMs: number = 7 * 24 * 60 * 60 * 1000
): ArtifactIntegrityIssue[] {
  const now = Date.now();
  return datasets
    .filter((d) => d.active && now - new Date(d.activatedAt).getTime() > staleThresholdMs)
    .map((d) => ({
      artifactId: d.id,
      check: 'stale_active_dataset' as const,
      severity: 'warning' as const,
      message: `Dataset version ${d.id} for ${d.datasetId} has been active longer than threshold`,
      detectedAt: new Date().toISOString(),
    }));
}

export function checkPromotionMissingEvidence(
  promotions: PromotionRecord[]
): ArtifactIntegrityIssue[] {
  return promotions
    .filter((p) => !p.evidence || p.evidence.length === 0)
    .map((p) => ({
      artifactId: p.id,
      check: 'promotion_missing_evidence' as const,
      severity: 'error' as const,
      message: `Promotion ${p.id} for strategy ${p.strategyId} has no evidence attached`,
      detectedAt: new Date().toISOString(),
    }));
}

export function runIntegrityChecks(params: {
  artifacts: ArtifactRecord[];
  datasets?: DatasetVersionRecord[];
  promotions?: PromotionRecord[];
  staleThresholdMs?: number;
}): ArtifactIntegrityReport {
  const { artifacts, datasets = [], promotions = [], staleThresholdMs } = params;
  const issues: ArtifactIntegrityIssue[] = [
    ...checkMissingMetadata(artifacts),
    ...checkMissingPayload(artifacts),
    ...checkHashMismatch(artifacts),
    ...checkOrphaned(artifacts),
    ...checkStaleActiveDataset(datasets, staleThresholdMs),
    ...checkPromotionMissingEvidence(promotions),
  ];

  const unhealthyIds = new Set(issues.map((i) => i.artifactId));

  return {
    checkedAt: new Date().toISOString(),
    totalArtifacts: artifacts.length + datasets.length + promotions.length,
    issues,
    healthy: artifacts.length + datasets.length + promotions.length - unhealthyIds.size,
    unhealthy: unhealthyIds.size,
  };
}
