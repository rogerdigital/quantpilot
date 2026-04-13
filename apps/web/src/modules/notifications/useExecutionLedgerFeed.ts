import type { ExecutionLedgerEntry } from '@shared-types/trading.ts';
import { useEffect, useState } from 'react';
import { fetchExecutionLedger } from '../../app/api/controlPlane.ts';

type ExecutionLedgerFeedOptions = {
  refreshKey?: number;
  status?: string;
};

export function useExecutionLedgerFeed(options: ExecutionLedgerFeedOptions = {}) {
  const [items, setItems] = useState<ExecutionLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshKey = 0, status = '' } = options;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchExecutionLedger()
      .then((payload) => {
        if (!mounted) return;
        const next = (Array.isArray(payload?.entries) ? payload.entries : []).filter(
          (item) => !status || item.plan.status === status || item.plan.riskStatus === status
        );
        setItems(next);
      })
      .catch(() => {
        if (mounted) {
          setItems([]);
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
  }, [refreshKey, status]);

  return { items, loading };
}
