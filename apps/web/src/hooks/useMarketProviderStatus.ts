import { useEffect, useState } from 'react';
import { fetchMarketProviderStatus } from '../app/api/controlPlane.ts';
import type { MarketProviderStatusSnapshot } from '@shared-types/trading.ts';

export function useMarketProviderStatus(refreshKey?: string) {
  const [status, setStatus] = useState<MarketProviderStatusSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchMarketProviderStatus()
      .then((payload) => {
        if (mounted) {
          setStatus(payload.status || null);
        }
      })
      .catch(() => {
        if (mounted) {
          setStatus(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  return { status, loading };
}
