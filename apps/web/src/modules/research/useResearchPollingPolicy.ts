import { useEffect } from 'react';

export function useResearchPollingPolicy(options?: {
  enabled?: boolean;
  active?: boolean;
  activeIntervalMs?: number;
  idleIntervalMs?: number;
  onRefresh?: () => void;
}) {
  const enabled = options?.enabled ?? false;
  const active = options?.active ?? false;
  const activeIntervalMs = options?.activeIntervalMs ?? 5000;
  const idleIntervalMs = options?.idleIntervalMs ?? 15000;
  const onRefresh = options?.onRefresh;

  useEffect(() => {
    if (!enabled || !onRefresh) return undefined;

    const intervalMs = active ? activeIntervalMs : idleIntervalMs;
    const timer = window.setInterval(() => {
      onRefresh();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [active, activeIntervalMs, enabled, idleIntervalMs, onRefresh]);

  return {
    requestRefresh: onRefresh || (() => {}),
    pollingEnabled: enabled,
    pollingIntervalMs: active ? activeIntervalMs : idleIntervalMs,
  };
}
