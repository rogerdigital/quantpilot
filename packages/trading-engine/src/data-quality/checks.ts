import type {
  DataQualityCheckInput,
  DataQualityCheckOutput,
  DataQualityCheckSeverity,
} from './types.ts';

export function checkMissingValues(
  input: DataQualityCheckInput,
  threshold = 0.01
): DataQualityCheckOutput {
  const allValues = Object.values(input.values).flat();
  const total = allValues.length;
  if (total === 0)
    return {
      check: 'missing_values',
      severity: 'info',
      passed: true,
      message: 'No data to check',
      value: 0,
      threshold,
    };
  const missing = allValues.filter((v) => v === null || v === undefined).length;
  const ratio = missing / total;
  const passed = ratio <= threshold;
  return {
    check: 'missing_values',
    severity: passed ? 'info' : 'warning',
    passed,
    message: passed
      ? `Missing ratio ${(ratio * 100).toFixed(2)}% within ${threshold * 100}% threshold`
      : `Missing ratio ${(ratio * 100).toFixed(2)}% exceeds ${threshold * 100}% threshold`,
    value: ratio,
    threshold,
  };
}

export function checkDuplicateTimestamps(input: DataQualityCheckInput): DataQualityCheckOutput {
  const timestamps = input.timestamps;
  const unique = new Set(timestamps);
  const duplicates = timestamps.length - unique.size;
  const passed = duplicates === 0;
  return {
    check: 'duplicate_timestamps',
    severity: passed ? 'info' : 'warning',
    passed,
    message: passed ? 'No duplicate timestamps' : `${duplicates} duplicate timestamps found`,
    value: duplicates,
    threshold: 0,
  };
}

export function checkTimestampMonotonicity(input: DataQualityCheckInput): DataQualityCheckOutput {
  const timestamps = input.timestamps;
  let violations = 0;
  for (let i = 1; i < timestamps.length; i++) {
    if (timestamps[i] <= timestamps[i - 1]) violations++;
  }
  const passed = violations === 0;
  return {
    check: 'timestamp_monotonicity',
    severity: passed ? 'info' : 'blocker',
    passed,
    message: passed
      ? 'Timestamps are monotonically increasing'
      : `${violations} monotonicity violations`,
    value: violations,
    threshold: 0,
  };
}

export function checkStaleData(
  input: DataQualityCheckInput,
  thresholdSeconds = 86400
): DataQualityCheckOutput {
  const lastUpdated = input.lastUpdatedAt;
  if (!lastUpdated)
    return {
      check: 'stale_data',
      severity: 'warning',
      passed: false,
      message: 'No lastUpdatedAt provided',
      value: null,
      threshold: thresholdSeconds,
    };
  const lagSeconds = (Date.now() - new Date(lastUpdated).getTime()) / 1000;
  const passed = lagSeconds <= thresholdSeconds;
  return {
    check: 'stale_data',
    severity: passed ? 'info' : 'warning',
    passed,
    message: passed
      ? `Data lag ${Math.round(lagSeconds)}s within ${thresholdSeconds}s threshold`
      : `Data lag ${Math.round(lagSeconds)}s exceeds ${thresholdSeconds}s threshold`,
    value: lagSeconds,
    threshold: thresholdSeconds,
  };
}

export function checkExtremeReturnSpikes(
  input: DataQualityCheckInput,
  threshold = 0.5
): DataQualityCheckOutput {
  let spikes = 0;
  for (const [, values] of Object.entries(input.values)) {
    for (let i = 1; i < values.length; i++) {
      const prev = values[i - 1];
      const curr = values[i];
      if (prev === null || curr === null || prev === 0) continue;
      const ret = Math.abs((curr - prev) / prev);
      if (ret > threshold) spikes++;
    }
  }
  const passed = spikes === 0;
  return {
    check: 'extreme_return_spikes',
    severity: passed ? 'info' : 'warning',
    passed,
    message: passed
      ? 'No extreme return spikes detected'
      : `${spikes} return spikes exceeding ${threshold * 100}%`,
    value: spikes,
    threshold: 0,
  };
}

export function checkSchemaMismatch(input: DataQualityCheckInput): DataQualityCheckOutput {
  if (!input.schemaHash || !input.expectedSchemaHash) {
    return {
      check: 'schema_mismatch',
      severity: 'info',
      passed: true,
      message: 'Schema check skipped (no expected hash)',
      value: null,
      threshold: null,
    };
  }
  const passed = input.schemaHash === input.expectedSchemaHash;
  return {
    check: 'schema_mismatch',
    severity: passed ? 'info' : 'blocker',
    passed,
    message: passed
      ? 'Schema hash matches expected'
      : `Schema drift detected: ${input.schemaHash} vs expected ${input.expectedSchemaHash}`,
    value: passed ? 0 : 1,
    threshold: 0,
  };
}

export function checkSymbolCoverageDrop(
  input: DataQualityCheckInput,
  dropThreshold = 0.1
): DataQualityCheckOutput {
  const actual = input.symbols || [];
  const expected = input.expectedSymbols || [];
  if (expected.length === 0) {
    return {
      check: 'symbol_coverage_drop',
      severity: 'info',
      passed: true,
      message: 'No expected symbols to compare',
      value: null,
      threshold: dropThreshold,
    };
  }
  const missing = expected.filter((s) => !actual.includes(s));
  const dropRatio = missing.length / expected.length;
  const passed = dropRatio <= dropThreshold;
  return {
    check: 'symbol_coverage_drop',
    severity: passed ? 'info' : 'warning',
    passed,
    message: passed
      ? `Symbol coverage drop ${(dropRatio * 100).toFixed(1)}% within threshold`
      : `Symbol coverage drop ${(dropRatio * 100).toFixed(1)}% exceeds ${dropThreshold * 100}% threshold (${missing.length} symbols missing)`,
    value: dropRatio,
    threshold: dropThreshold,
  };
}

export function runAllQualityChecks(input: DataQualityCheckInput): DataQualityCheckOutput[] {
  return [
    checkMissingValues(input),
    checkDuplicateTimestamps(input),
    checkTimestampMonotonicity(input),
    checkStaleData(input, input.staleThresholdSeconds),
    checkExtremeReturnSpikes(input),
    checkSchemaMismatch(input),
    checkSymbolCoverageDrop(input),
  ];
}
