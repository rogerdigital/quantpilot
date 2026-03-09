import { useEffect, useState } from 'react';
import type { ResearchHubSnapshot } from '@shared-types/trading.ts';
import { fetchResearchHub } from '../services/research.ts';

type ResearchHubState = {
  data: ResearchHubSnapshot | null;
  loading: boolean;
  error: string;
};

export function useResearchHub() {
  const [state, setState] = useState<ResearchHubState>({
    data: null,
    loading: true,
    error: '',
  });

  useEffect(() => {
    let cancelled = false;

    fetchResearchHub()
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
  }, []);

  return state;
}
