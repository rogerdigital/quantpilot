import type { PlatformEvent } from '@shared-types/platform-events.ts';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ArtifactIntegrityPanel } from './ArtifactIntegrityPanel.tsx';
import { PlatformEventStream } from './PlatformEventStream.tsx';
import { SystemHealthMatrix } from './SystemHealthMatrix.tsx';
import type { ServiceHealth } from './useObservabilityWorkbench.ts';
import {
  deriveOverallStatus,
  filterEventsBySeverity,
  filterEventsByType,
} from './useObservabilityWorkbench.ts';

function makeEvent(overrides: Partial<PlatformEvent> = {}): PlatformEvent {
  return {
    id: crypto.randomUUID(),
    type: 'dataset_ingested',
    severity: 'info',
    timestamp: new Date().toISOString(),
    source: 'test',
    payload: {},
    ...overrides,
  };
}

describe('PlatformEventStream', () => {
  it('shows empty state when no events', () => {
    const html = renderToStaticMarkup(<PlatformEventStream events={[]} />);
    expect(html).toContain('event-stream-empty');
    expect(html).toContain('No platform events recorded');
  });

  it('renders events list', () => {
    const events = [
      makeEvent({ id: 'e1', type: 'dataset_ingested' }),
      makeEvent({ id: 'e2', type: 'risk_breach_detected', severity: 'critical' }),
    ];
    const html = renderToStaticMarkup(<PlatformEventStream events={events} />);
    expect(html).toContain('event-stream');
    expect(html).toContain('dataset_ingested');
    expect(html).toContain('risk_breach_detected');
  });

  it('shows overflow indicator when exceeding maxVisible', () => {
    const events = Array.from({ length: 25 }, (_, i) => makeEvent({ id: `e-${i}` }));
    const html = renderToStaticMarkup(<PlatformEventStream events={events} maxVisible={10} />);
    expect(html).toContain('+15');
    expect(html).toContain('event-stream-overflow');
  });
});

describe('SystemHealthMatrix', () => {
  it('shows empty state when no services', () => {
    const html = renderToStaticMarkup(<SystemHealthMatrix services={[]} />);
    expect(html).toContain('health-matrix-empty');
    expect(html).toContain('No services registered');
  });

  it('renders services with statuses', () => {
    const services: ServiceHealth[] = [
      { name: 'api', status: 'healthy', lastCheckAt: '2026-01-01T00:00:00Z', message: 'OK' },
      {
        name: 'broker',
        status: 'degraded',
        lastCheckAt: '2026-01-01T00:00:00Z',
        message: 'High latency',
      },
    ];
    const html = renderToStaticMarkup(<SystemHealthMatrix services={services} />);
    expect(html).toContain('service-api');
    expect(html).toContain('service-broker');
    expect(html).toContain('healthy');
    expect(html).toContain('degraded');
  });

  it('shows overall status as blocked when any service blocked', () => {
    const services: ServiceHealth[] = [
      { name: 'api', status: 'healthy', lastCheckAt: '', message: '' },
      { name: 'db', status: 'blocked', lastCheckAt: '', message: 'Connection refused' },
    ];
    const html = renderToStaticMarkup(<SystemHealthMatrix services={services} />);
    expect(html).toContain('overall-status');
    expect(html).toContain('blocked');
  });
});

describe('ArtifactIntegrityPanel', () => {
  it('shows empty state', () => {
    const html = renderToStaticMarkup(<ArtifactIntegrityPanel artifacts={[]} />);
    expect(html).toContain('artifact-integrity-empty');
    expect(html).toContain('No artifacts to verify');
  });

  it('renders artifacts with statuses', () => {
    const artifacts = [
      {
        id: 'a1',
        type: 'backtest_report',
        label: 'Report A',
        hash: 'h1',
        createdAt: '2026-01-01',
        status: 'valid' as const,
      },
      {
        id: 'a2',
        type: 'risk_assessment',
        label: 'Risk B',
        hash: 'h2',
        createdAt: '2026-01-01',
        status: 'hash_mismatch' as const,
      },
    ];
    const html = renderToStaticMarkup(<ArtifactIntegrityPanel artifacts={artifacts} />);
    expect(html).toContain('artifact-a1');
    expect(html).toContain('artifact-a2');
    expect(html).toContain('valid');
    expect(html).toContain('hash_mismatch');
  });

  it('shows issue count when problems exist', () => {
    const artifacts = [
      { id: 'a1', type: 't', label: 'L', hash: 'h', createdAt: '', status: 'orphaned' as const },
      {
        id: 'a2',
        type: 't',
        label: 'L',
        hash: 'h',
        createdAt: '',
        status: 'missing_payload' as const,
      },
      { id: 'a3', type: 't', label: 'L', hash: 'h', createdAt: '', status: 'valid' as const },
    ];
    const html = renderToStaticMarkup(<ArtifactIntegrityPanel artifacts={artifacts} />);
    expect(html).toContain('integrity-issue-count');
    expect(html).toContain('2 issues');
  });
});

describe('deriveOverallStatus', () => {
  it('returns healthy when all healthy', () => {
    const services: ServiceHealth[] = [
      { name: 'a', status: 'healthy', lastCheckAt: '', message: '' },
    ];
    expect(deriveOverallStatus(services)).toBe('healthy');
  });

  it('returns degraded when any degraded', () => {
    const services: ServiceHealth[] = [
      { name: 'a', status: 'healthy', lastCheckAt: '', message: '' },
      { name: 'b', status: 'degraded', lastCheckAt: '', message: '' },
    ];
    expect(deriveOverallStatus(services)).toBe('degraded');
  });

  it('returns blocked when any blocked (takes precedence)', () => {
    const services: ServiceHealth[] = [
      { name: 'a', status: 'degraded', lastCheckAt: '', message: '' },
      { name: 'b', status: 'blocked', lastCheckAt: '', message: '' },
    ];
    expect(deriveOverallStatus(services)).toBe('blocked');
  });
});

describe('filterEventsBySeverity', () => {
  it('filters correctly', () => {
    const events = [
      makeEvent({ severity: 'info' }),
      makeEvent({ severity: 'critical' }),
      makeEvent({ severity: 'critical' }),
    ];
    expect(filterEventsBySeverity(events, 'critical')).toHaveLength(2);
  });
});

describe('filterEventsByType', () => {
  it('filters correctly', () => {
    const events = [
      makeEvent({ type: 'dataset_ingested' }),
      makeEvent({ type: 'risk_breach_detected' }),
      makeEvent({ type: 'dataset_ingested' }),
    ];
    expect(filterEventsByType(events, 'dataset_ingested')).toHaveLength(2);
  });
});
