import { Skeleton, SkeletonTable } from '@quantpilot/ui';

export function RiskSkeleton() {
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`metric-${i}`}
            style={{
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
            }}
          >
            <Skeleton variant="text" width="60px" height="10px" />
            <div style={{ marginTop: '8px' }}>
              <Skeleton variant="title" width="80px" height="24px" />
            </div>
            <div style={{ marginTop: '6px' }}>
              <Skeleton variant="text" width="50px" height="12px" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div
        style={{
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
        }}
      >
        <Skeleton variant="title" width="100px" />
        <div style={{ marginTop: '12px' }}>
          <Skeleton variant="rect" height="240px" />
        </div>
      </div>

      {/* Risk events table */}
      <div
        style={{
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
        }}
      >
        <Skeleton variant="title" width="120px" />
        <div style={{ marginTop: '12px' }}>
          <SkeletonTable columns={5} rows={5} />
        </div>
      </div>
    </div>
  );
}
