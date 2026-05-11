import type {
  PlatformEvent,
  PlatformEventSeverity,
  PlatformEventType,
} from '@shared-types/platform-events.ts';
import { useEffect, useState } from 'react';

export type ServiceHealth = {
  name: string;
  status: 'healthy' | 'degraded' | 'blocked';
  lastCheckAt: string;
  message: string;
};

export type ObservabilitySnapshot = {
  services: ServiceHealth[];
  recentEvents: PlatformEvent[];
  eventCountByType: Record<string, number>;
  eventCountBySeverity: Record<string, number>;
  incidentLinks: Array<{ id: string; title: string; url: string }>;
};

const EMPTY_SNAPSHOT: ObservabilitySnapshot = {
  services: [],
  recentEvents: [],
  eventCountByType: {},
  eventCountBySeverity: {},
  incidentLinks: [],
};

export function useObservabilityWorkbench(options: { refreshKey?: number } = {}) {
  const [snapshot, setSnapshot] = useState<ObservabilitySnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const { refreshKey = 0 } = options;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.resolve(EMPTY_SNAPSHOT)
      .then((data) => {
        if (mounted) setSnapshot(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  return { snapshot, loading };
}

export function deriveOverallStatus(services: ServiceHealth[]): 'healthy' | 'degraded' | 'blocked' {
  if (services.some((s) => s.status === 'blocked')) return 'blocked';
  if (services.some((s) => s.status === 'degraded')) return 'degraded';
  return 'healthy';
}

export function filterEventsBySeverity(
  events: PlatformEvent[],
  severity: PlatformEventSeverity
): PlatformEvent[] {
  return events.filter((e) => e.severity === severity);
}

export function filterEventsByType(
  events: PlatformEvent[],
  type: PlatformEventType
): PlatformEvent[] {
  return events.filter((e) => e.type === type);
}
