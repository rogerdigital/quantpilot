import * as css from './ChartSkeleton.css.ts';

const BAR_HEIGHTS = [40, 65, 50, 75, 55, 70, 45, 80, 60, 72, 48, 68];

export function ChartSkeleton() {
  return (
    <div className={css.chartSkeletonWrap} role="img" aria-label="Loading chart">
      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '100%' }}>
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className={css.chartSkeletonBar}
            style={{
              flex: 1,
              height: `${h}%`,
              animationDelay: `${i * 120}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
