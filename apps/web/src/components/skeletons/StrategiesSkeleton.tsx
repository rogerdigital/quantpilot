import { Skeleton, SkeletonTable } from '@quantpilot/ui';

export function StrategiesSkeleton() {
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton variant="title" width="160px" height="24px" />
        <Skeleton variant="button" width="120px" />
      </div>

      {/* Strategies table */}
      <div
        style={{
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
        }}
      >
        <SkeletonTable columns={7} rows={6} />
      </div>
    </div>
  );
}
