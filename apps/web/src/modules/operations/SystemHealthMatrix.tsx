import type { ServiceHealth } from './useObservabilityWorkbench.ts';
import { deriveOverallStatus } from './useObservabilityWorkbench.ts';

type Props = {
  services: ServiceHealth[];
};

const STATUS_INDICATOR: Record<string, string> = {
  healthy: '#22c55e',
  degraded: '#f59e0b',
  blocked: '#ef4444',
};

export function SystemHealthMatrix({ services }: Props) {
  const overall = deriveOverallStatus(services);

  if (services.length === 0) {
    return <div data-testid="health-matrix-empty">No services registered.</div>;
  }

  return (
    <div data-testid="health-matrix">
      <h3>
        System Health{' '}
        <span data-testid="overall-status" style={{ color: STATUS_INDICATOR[overall] }}>
          [{overall}]
        </span>
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Service</th>
            <th style={{ textAlign: 'left' }}>Status</th>
            <th style={{ textAlign: 'left' }}>Last Check</th>
            <th style={{ textAlign: 'left' }}>Message</th>
          </tr>
        </thead>
        <tbody>
          {services.map((svc) => (
            <tr key={svc.name} data-testid={`service-${svc.name}`}>
              <td>{svc.name}</td>
              <td>
                <span style={{ color: STATUS_INDICATOR[svc.status] || '#888' }}>{svc.status}</span>
              </td>
              <td style={{ fontSize: '0.85em', opacity: 0.7 }}>{svc.lastCheckAt}</td>
              <td style={{ fontSize: '0.85em' }}>{svc.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
