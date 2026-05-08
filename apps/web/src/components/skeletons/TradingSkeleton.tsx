import { Skeleton, SkeletonTable } from '@quantpilot/ui';

export function TradingSkeleton() {
  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* Header skeleton */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px 20px',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <Skeleton variant="circle" width="32px" height="32px" />
        <div style={{ display: 'grid', gap: '6px' }}>
          <Skeleton variant="title" width="120px" height="20px" />
          <Skeleton variant="text" width="80px" />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <Skeleton variant="button" width="80px" />
          <Skeleton variant="button" width="80px" />
        </div>
      </div>

      {/* Three-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr 280px',
          gap: '12px',
          minHeight: '520px',
        }}
      >
        {/* Watchlist */}
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
          }}
        >
          <Skeleton variant="title" width="80px" />
          <div style={{ marginTop: '12px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`item-${i}`}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}
              >
                <Skeleton variant="text" width="60px" />
                <Skeleton variant="text" width="50px" />
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
          }}
        >
          <Skeleton variant="rect" height="360px" />
          <div
            style={{
              marginTop: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={`signal-${i}`} variant="rect" height="60px" />
            ))}
          </div>
        </div>

        {/* Order form + blotter */}
        <div style={{ display: 'grid', gap: '12px' }}>
          <div
            style={{
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
            }}
          >
            <Skeleton variant="title" width="80px" />
            <div style={{ marginTop: '12px', display: 'grid', gap: '10px' }}>
              <Skeleton variant="rect" height="34px" />
              <Skeleton variant="rect" height="34px" />
              <Skeleton variant="rect" height="34px" />
              <Skeleton variant="button" width="100%" height="36px" />
            </div>
          </div>
          <div
            style={{
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
            }}
          >
            <Skeleton variant="title" width="60px" />
            <div style={{ marginTop: '12px' }}>
              <SkeletonTable columns={3} rows={4} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
