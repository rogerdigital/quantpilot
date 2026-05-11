export type DataQualityCheckSeverity = 'info' | 'warning' | 'blocker';

export type DataQualityCheckInput = {
  timestamps: string[];
  values: Record<string, (number | null)[]>;
  symbols?: string[];
  expectedSymbols?: string[];
  schemaHash?: string;
  expectedSchemaHash?: string;
  lastUpdatedAt?: string;
  staleThresholdSeconds?: number;
};

export type DataQualityCheckOutput = {
  check: string;
  severity: DataQualityCheckSeverity;
  passed: boolean;
  message: string;
  value: number | null;
  threshold: number | null;
};
