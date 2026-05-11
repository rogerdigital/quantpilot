// @ts-nocheck
import type {
  DataQualityReport,
  Dataset,
  DatasetCategory,
  DatasetVersion,
} from '../../shared-types/src/data-science.ts';

type DatasetRegistryStore = {
  readCollection: (filename: string) => any[];
  writeCollection: (filename: string, entries: any[]) => void;
};

export function createDatasetRegistry(store: DatasetRegistryStore) {
  const DATASETS_FILE = 'datasets.json';
  const DATASET_VERSIONS_FILE = 'dataset_versions.json';
  const QUALITY_REPORTS_FILE = 'data_quality_reports.json';

  function listDatasets(): Dataset[] {
    return store.readCollection(DATASETS_FILE);
  }

  function getDataset(id: string): Dataset | undefined {
    return listDatasets().find((d) => d.id === id);
  }

  function registerDataset(dataset: Dataset): Dataset {
    const existing = listDatasets();
    existing.push(dataset);
    store.writeCollection(DATASETS_FILE, existing);
    return dataset;
  }

  function createDatasetVersion(version: DatasetVersion): DatasetVersion {
    const versions = store.readCollection(DATASET_VERSIONS_FILE);
    versions.push(version);
    store.writeCollection(DATASET_VERSIONS_FILE, versions);
    return version;
  }

  function listDatasetVersions(datasetId: string): DatasetVersion[] {
    return store.readCollection(DATASET_VERSIONS_FILE).filter((v) => v.datasetId === datasetId);
  }

  function markVersionActive(datasetId: string, versionId: string): void {
    const versions = store.readCollection(DATASET_VERSIONS_FILE);
    for (const v of versions) {
      if (v.datasetId === datasetId) {
        v.status = v.id === versionId ? 'active' : 'deprecated';
      }
    }
    store.writeCollection(DATASET_VERSIONS_FILE, versions);

    const datasets = listDatasets();
    const ds = datasets.find((d) => d.id === datasetId);
    if (ds) {
      ds.activeVersionId = versionId;
      ds.updatedAt = new Date().toISOString();
      store.writeCollection(DATASETS_FILE, datasets);
    }
  }

  function attachQualityReport(report: DataQualityReport): DataQualityReport {
    const reports = store.readCollection(QUALITY_REPORTS_FILE);
    reports.push(report);
    store.writeCollection(QUALITY_REPORTS_FILE, reports);

    const versions = store.readCollection(DATASET_VERSIONS_FILE);
    const version = versions.find((v) => v.id === report.versionId);
    if (version) {
      version.qualityReport = report;
      store.writeCollection(DATASET_VERSIONS_FILE, versions);
    }
    return report;
  }

  function getQualityReport(versionId: string): DataQualityReport | undefined {
    return store.readCollection(QUALITY_REPORTS_FILE).find((r) => r.versionId === versionId);
  }

  function listStaleDatasets(thresholdSeconds: number): Dataset[] {
    const now = Date.now();
    return listDatasets().filter((d) => {
      const lastIngestion = d.source?.lastSuccessfulIngestion;
      if (!lastIngestion) return true;
      const lag = (now - new Date(lastIngestion).getTime()) / 1000;
      return lag > thresholdSeconds;
    });
  }

  return {
    listDatasets,
    getDataset,
    registerDataset,
    createDatasetVersion,
    listDatasetVersions,
    markVersionActive,
    attachQualityReport,
    getQualityReport,
    listStaleDatasets,
  };
}
