import { Skeleton, SkeletonTable } from '@quantpilot/ui';

export function OverviewSkeleton() {
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* KPI banner skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          padding: '20px 24px',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`kpi-${i}`} style={{ display: 'grid', gap: '6px' }}>
            <Skeleton variant="text" width="60px" height="10px" />
            <Skeleton variant="title" width="100px" height="28px" />
            <Skeleton variant="text" width="80px" height="12px" />
          </div>
        ))}
      </div>

      {/* Chart + sidebar skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.8fr 0.8fr', gap: '16px' }}>
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
          }}
        >
          <Skeleton variant="rect" height="280px" />
        </div>
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
          }}
        >
          <Skeleton variant="title" width="80px" />
          <div style={{ marginTop: '12px' }}>
            <SkeletonTable columns={2} rows={4} />
          </div>
        </div>
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
          }}
        >
          <Skeleton variant="title" width="80px" />
          <div style={{ marginTop: '12px' }}>
            <SkeletonTable columns={2} rows={4} />
          </div>
        </div>
      </div>

      {/* Blotter skeleton */}
      <div
        style={{
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
        }}
      >
        <Skeleton variant="title" width="120px" />
        <div style={{ marginTop: '12px' }}>
          <SkeletonTable columns={6} rows={5} />
        </div>
      </div>
    </div>
  );
}
