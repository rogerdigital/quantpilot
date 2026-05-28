import {
  createDataIngestionResult,
  shouldActivateVersion,
} from '../../../../packages/trading-engine/src/connectors/data-connector.js';

export async function handleDataIngestionJob(job: any) {
  const { connectorId, datasetId, versionId, records, qualityChecks } = job.payload || {};

  if (!connectorId || !datasetId || !versionId) {
    return {
      ok: false,
      error: 'Missing required fields: connectorId, datasetId, versionId',
    };
  }

  const ingestionRecords = records || [];
  const checks = qualityChecks || [];

  const result = createDataIngestionResult({
    connectorId,
    datasetId,
    versionId,
    records: ingestionRecords,
    qualityChecks: checks,
  });

  const activated = shouldActivateVersion(result);

  return {
    ok: true,
    result: {
      ...result,
      activatedVersion: activated,
    },
  };
}
