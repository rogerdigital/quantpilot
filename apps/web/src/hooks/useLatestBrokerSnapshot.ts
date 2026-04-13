import type { BrokerAccountSnapshotRecord } from '@shared-types/trading.ts';
import { useEffect, useState } from 'react';
import { fetchLatestBrokerAccountSnapshot } from '../app/api/controlPlane.ts';

export function useLatestBrokerSnapshot(refreshKey?: string) {
  const [snapshot, setSnapshot] = useState<BrokerAccountSnapshotRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchLatestBrokerAccountSnapshot()
      .then((payload) => {
        if (mounted) {
          setSnapshot(payload.snapshot || null);
        }
      })
      .catch(() => {
        if (mounted) {
          setSnapshot(null);
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

  return { snapshot, loading };
}
