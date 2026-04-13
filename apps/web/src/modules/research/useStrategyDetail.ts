import type { StrategyCatalogDetailSnapshot } from '@shared-types/trading.ts';
import { useEffect, useState } from 'react';
import { fetchStrategyCatalogItem } from './research.service.ts';

type StrategyDetailState = {
  data: StrategyCatalogDetailSnapshot | null;
  loading: boolean;
  error: string;
};

export function useStrategyDetail(strategyId: string, refreshKey?: string | number) {
  const [state, setState] = useState<StrategyDetailState>({
    data: null,
    loading: false,
    error: '',
  });

  useEffect(() => {
    if (!strategyId) {
      setState({
        data: null,
        loading: false,
        error: '',
      });
      return;
    }

    let cancelled = false;
    setState((current) => ({
      ...current,
      loading: true,
      error: '',
    }));

    fetchStrategyCatalogItem(strategyId)
      .then((data) => {
        if (cancelled) return;
        setState({
          data,
          loading: false,
          error: '',
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'unknown error',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey, strategyId]);

  return state;
}
