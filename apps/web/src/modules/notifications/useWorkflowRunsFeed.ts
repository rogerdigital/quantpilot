import type { WorkflowRunRecord } from '@shared-types/trading.ts';
import { useEffect, useState } from 'react';
import { fetchTaskWorkflows } from '../../app/api/controlPlane.ts';

type WorkflowRunsFeedOptions = {
  refreshKey?: number;
  status?: string;
};

export function useWorkflowRunsFeed(options: WorkflowRunsFeedOptions = {}) {
  const [items, setItems] = useState<WorkflowRunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshKey = 0, status = '' } = options;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchTaskWorkflows()
      .then((payload) => {
        if (!mounted) return;
        const next = (Array.isArray(payload?.workflows) ? payload.workflows : []).filter(
          (item) => !status || item.status === status
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
