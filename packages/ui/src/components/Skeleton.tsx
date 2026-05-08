import { type CSSProperties, type ReactNode } from 'react';
import { base, row, tableRow, variants } from './Skeleton.css.js';

type SkeletonVariant = keyof typeof variants;

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  style?: CSSProperties;
  className?: string;
  count?: number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  style: inlineStyle,
  className = '',
  count = 1,
}: SkeletonProps) {
  const baseStyle: CSSProperties = {
    ...(width != null ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height != null ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...inlineStyle,
  };

  if (count > 1) {
    return (
      <div className={row}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className={`${variants[variant]} ${className}`}
            style={{
              ...baseStyle,
              width: i === count - 1 ? '70%' : baseStyle.width,
            }}
          />
        ))}
      </div>
    );
  }

  return <div className={`${variants[variant]} ${className}`} style={baseStyle} />;
}

interface SkeletonTableProps {
  columns: number;
  rows?: number;
}

export function SkeletonTable({ columns, rows = 5 }: SkeletonTableProps) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={`row-${i}`}
          className={tableRow}
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={`cell-${i}-${j}`} variant="text" />
          ))}
        </div>
      ))}
    </div>
  );
}
