import type { DataQualityReport, Dataset, FeatureSet } from '@shared-types/data-science.ts';
import { useEffect, useState } from 'react';
import { fetchDataQuality, fetchDatasets, fetchFeatures } from './data.service.ts';

export type DataConsoleState = {
  datasets: Dataset[];
  qualityReports: DataQualityReport[];
  features: FeatureSet[];
  loading: boolean;
  error: string;
};

export function useDataConsole(refreshKey?: string | number) {
  const [state, setState] = useState<DataConsoleState>({
    datasets: [],
    qualityReports: [],
    features: [],
    loading: true,
    error: '',
  });

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchDatasets(), fetchDataQuality(), fetchFeatures()])
      .then(([datasetsRes, qualityRes, featuresRes]) => {
        if (cancelled) return;
        setState({
          datasets: datasetsRes.datasets,
          qualityReports: qualityRes.reports,
          features: featuresRes.features,
          loading: false,
          error: '',
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          datasets: [],
          qualityReports: [],
          features: [],
          loading: false,
          error: err instanceof Error ? err.message : 'unknown error',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return state;
}
