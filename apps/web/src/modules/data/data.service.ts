import type {
  DataQualityReport,
  Dataset,
  DatasetVersion,
  FeatureSet,
} from '@shared-types/data-science.ts';
import { API_PREFIX, assertOk, fetchJson, jsonHeaders } from '../../app/api/http.ts';

export async function fetchDatasets(): Promise<{ ok: boolean; datasets: Dataset[] }> {
  return fetchJson(`${API_PREFIX}/data/datasets`);
}

export async function createDataset(
  payload: Omit<Dataset, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ ok: boolean; dataset: Dataset }> {
  const response = await fetch(`${API_PREFIX}/data/datasets`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function fetchDatasetVersions(
  datasetId: string
): Promise<{ ok: boolean; versions: DatasetVersion[] }> {
  return fetchJson(`${API_PREFIX}/data/datasets/${datasetId}/versions`);
}

export async function createDatasetVersion(
  datasetId: string,
  payload: Omit<DatasetVersion, 'id' | 'datasetId' | 'createdAt'>
): Promise<{ ok: boolean; version: DatasetVersion }> {
  const response = await fetch(`${API_PREFIX}/data/datasets/${datasetId}/versions`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function fetchDataQuality(): Promise<{ ok: boolean; reports: DataQualityReport[] }> {
  return fetchJson(`${API_PREFIX}/data/quality`);
}

export async function fetchFeatures(): Promise<{ ok: boolean; features: FeatureSet[] }> {
  return fetchJson(`${API_PREFIX}/data/features`);
}

export async function createFeature(
  payload: Omit<FeatureSet, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ ok: boolean; feature: FeatureSet }> {
  const response = await fetch(`${API_PREFIX}/data/features`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}
