import type {
  ConnectorConfig,
  ConnectorHealthCheck,
} from '../../../shared-types/src/connectors.ts';

export type DataIngestionResult = {
  connectorId: string;
  datasetId: string;
  versionId: string;
  recordCount: number;
  qualityCheckPassed: boolean;
  qualityIssues: string[];
  activatedVersion: boolean;
  timestamp: string;
};

export type DataQualityCheck = {
  name: string;
  passed: boolean;
  detail: string;
};

export interface DataConnector {
  config: ConnectorConfig;
  connect(): Promise<ConnectorHealthCheck>;
  disconnect(): Promise<void>;
  ingest(datasetId: string, params: Record<string, unknown>): Promise<DataIngestionResult>;
  checkHealth(): Promise<ConnectorHealthCheck>;
}

export function runDataQualityChecks(
  records: unknown[],
  checks: DataQualityCheck[]
): { passed: boolean; issues: string[] } {
  const issues: string[] = [];

  for (const check of checks) {
    if (!check.passed) {
      issues.push(`${check.name}: ${check.detail}`);
    }
  }

  if (records.length === 0) {
    issues.push('empty_dataset: No records returned from ingestion');
  }

  return { passed: issues.length === 0, issues };
}

export function createDataIngestionResult(params: {
  connectorId: string;
  datasetId: string;
  versionId: string;
  records: unknown[];
  qualityChecks: DataQualityCheck[];
}): DataIngestionResult {
  const qualityResult = runDataQualityChecks(params.records, params.qualityChecks);

  return {
    connectorId: params.connectorId,
    datasetId: params.datasetId,
    versionId: params.versionId,
    recordCount: params.records.length,
    qualityCheckPassed: qualityResult.passed,
    qualityIssues: qualityResult.issues,
    activatedVersion: qualityResult.passed,
    timestamp: new Date().toISOString(),
  };
}

export function shouldActivateVersion(result: DataIngestionResult): boolean {
  return result.qualityCheckPassed && result.recordCount > 0;
}
