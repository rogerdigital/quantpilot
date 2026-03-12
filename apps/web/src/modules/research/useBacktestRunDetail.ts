import { useEffect, useState } from 'react';
import type { BacktestRunDetailSnapshot } from '@shared-types/trading.ts';
import { fetchBacktestRunItem } from './research.service.ts';

type BacktestRunDetailState = {
  data: BacktestRunDetailSnapshot | null;
  loading: boolean;
  error: string;
};

export function useBacktestRunDetail(runId: string, refreshKey?: string | number) {
  const [state, setState] = useState<BacktestRunDetailState>({
    data: null,
    loading: false,
    error: '',
  });

  useEffect(() => {
    if (!runId) {
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

    fetchBacktestRunItem(runId)
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
  }, [refreshKey, runId]);

  return state;
}
