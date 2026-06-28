import { useEffect, useRef } from 'react';

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

  // Hold the latest onRefresh in a ref so the interval effect does not depend
  // on its identity. Callers pass an inline arrow function on every render,
  // which would otherwise tear down and recreate the interval each render and
  // prevent it from ever firing.
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled) return undefined;

    const intervalMs = active ? activeIntervalMs : idleIntervalMs;
    const timer = window.setInterval(() => {
      onRefreshRef.current?.();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [active, activeIntervalMs, enabled, idleIntervalMs]);

  return {
    requestRefresh: onRefresh || (() => {}),
    pollingEnabled: enabled,
    pollingIntervalMs: active ? activeIntervalMs : idleIntervalMs,
  };
}
