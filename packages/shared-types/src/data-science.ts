export type DatasetCategory =
  | 'market_data'
  | 'tick'
  | 'fundamental'
  | 'macro'
  | 'alternative'
  | 'news';

export type DataSource = {
  id: string;
  name: string;
  provider: string;
  category: DatasetCategory;
  license: string;
  ingestionFrequency: string;
  lastSuccessfulIngestion: string;
  owner: string;
  metadata: Record<string, unknown>;
};

export type DataQualitySeverity = 'info' | 'warning' | 'blocker';

export type DataQualityCheckResult = {
  check: string;
  severity: DataQualitySeverity;
  passed: boolean;
  message: string;
  value: number | null;
  threshold: number | null;
  metadata: Record<string, unknown>;
};

export type DataQualityReport = {
  id: string;
  datasetId: string;
  versionId: string;
  generatedAt: string;
  overallStatus: 'pass' | 'warning' | 'blocker';
  freshness: {
    lastUpdatedAt: string;
    lagSeconds: number;
    stale: boolean;
  };
  missingRatio: number;
  duplicateRatio: number;
  schemaDrift: boolean;
  outlierSummary: {
    count: number;
    ratio: number;
    worstField: string;
  };
  checks: DataQualityCheckResult[];
  metadata: Record<string, unknown>;
};

export type DatasetVersion = {
  id: string;
  datasetId: string;
  version: number;
  schemaHash: string;
  rowCount: number;
  columnCount: number;
  timeRange: { start: string; end: string };
  symbols: string[];
  status: 'draft' | 'active' | 'deprecated';
  qualityReport: DataQualityReport | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type Dataset = {
  id: string;
  name: string;
  description: string;
  category: DatasetCategory;
  source: DataSource;
  owner: string;
  activeVersionId: string | null;
  versions: DatasetVersion[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type FeatureLineage = {
  sourceDatasetVersionIds: string[];
  transformationHash: string;
  lookbackWindow: string;
  rebalanceCadence: string;
  leakagePreventionFlags: string[];
  leakageRisk: boolean;
};

export type FeatureVersion = {
  id: string;
  featureSetId: string;
  version: number;
  formulaFingerprint: string;
  lineage: FeatureLineage;
  columnCount: number;
  rowCount: number;
  status: 'draft' | 'active' | 'deprecated';
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type FeatureSet = {
  id: string;
  name: string;
  description: string;
  owner: string;
  activeVersionId: string | null;
  versions: FeatureVersion[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};
