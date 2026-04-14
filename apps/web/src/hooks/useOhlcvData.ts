import { useEffect, useState } from 'react';
import type { OhlcvBar } from '@shared-types/trading.ts';
import { fetchOhlcv } from '../app/api/controlPlane.ts';

type UseOhlcvDataResult = {
  bars: OhlcvBar[];
  loading: boolean;
  error: string | null;
};

export function useOhlcvData(symbol: string, timeframe: string, limit = 100): UseOhlcvDataResult {
  const [bars, setBars] = useState<OhlcvBar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchOhlcv(symbol, timeframe, limit)
      .then((res) => {
        if (!cancelled) {
          setBars(res.bars);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load chart data');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, timeframe, limit]);

  return { bars, loading, error };
}
