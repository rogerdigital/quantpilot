import type {
  FeatureLineage,
  FeatureSet,
  FeatureVersion,
} from '../../shared-types/src/data-science.ts';

type FeatureRegistryStore = {
  readCollection: (filename: string) => any[];
  writeCollection: (filename: string, entries: any[]) => void;
};

export function createFeatureRegistry(store: FeatureRegistryStore) {
  const FEATURE_SETS_FILE = 'feature_sets.json';
  const FEATURE_VERSIONS_FILE = 'feature_versions.json';

  function listFeatureSets(): FeatureSet[] {
    return store.readCollection(FEATURE_SETS_FILE);
  }

  function getFeatureSet(id: string): FeatureSet | undefined {
    return listFeatureSets().find((f) => f.id === id);
  }

  function registerFeatureSet(featureSet: FeatureSet): FeatureSet {
    const existing = listFeatureSets();
    existing.push(featureSet);
    store.writeCollection(FEATURE_SETS_FILE, existing);
    return featureSet;
  }

  function createFeatureVersion(version: FeatureVersion): FeatureVersion {
    const versions = store.readCollection(FEATURE_VERSIONS_FILE);
    versions.push(version);
    store.writeCollection(FEATURE_VERSIONS_FILE, versions);
    return version;
  }

  function listFeatureVersions(featureSetId: string): FeatureVersion[] {
    return store
      .readCollection(FEATURE_VERSIONS_FILE)
      .filter((v) => v.featureSetId === featureSetId);
  }

  function getFeatureVersion(id: string): FeatureVersion | undefined {
    return store.readCollection(FEATURE_VERSIONS_FILE).find((v) => v.id === id);
  }

  function computeLineageHash(lineage: FeatureLineage): string {
    const payload = JSON.stringify({
      sources: [...lineage.sourceDatasetVersionIds].sort(),
      transform: lineage.transformationHash,
      lookback: lineage.lookbackWindow,
      cadence: lineage.rebalanceCadence,
    });
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `lineage-${Math.abs(hash).toString(16)}`;
  }

  function compareFeatureVersions(versionIdA: string, versionIdB: string) {
    const a = getFeatureVersion(versionIdA);
    const b = getFeatureVersion(versionIdB);
    if (!a || !b) return null;

    return {
      versionA: a,
      versionB: b,
      sameLineageSources:
        JSON.stringify(a.lineage.sourceDatasetVersionIds.sort()) ===
        JSON.stringify(b.lineage.sourceDatasetVersionIds.sort()),
      sameTransformation: a.lineage.transformationHash === b.lineage.transformationHash,
      sameLookback: a.lineage.lookbackWindow === b.lineage.lookbackWindow,
      sameCadence: a.lineage.rebalanceCadence === b.lineage.rebalanceCadence,
      formulaChanged: a.formulaFingerprint !== b.formulaFingerprint,
    };
  }

  return {
    listFeatureSets,
    getFeatureSet,
    registerFeatureSet,
    createFeatureVersion,
    listFeatureVersions,
    getFeatureVersion,
    computeLineageHash,
    compareFeatureVersions,
  };
}
