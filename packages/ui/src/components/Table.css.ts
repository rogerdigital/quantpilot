import { style } from '@vanilla-extract/css';
import { duration, easing } from '../tokens/motion.css.js';
import { spacing } from '../tokens/spacing.css.js';
import { fontFamily, fontSize } from '../tokens/typography.css.js';

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: fontFamily.data,
  fontSize: fontSize.sm,
});

export const headerRow = style({
  borderBottom: '1px solid var(--line-strong)',
});

export const headerCell = style({
  padding: `${spacing.sm} ${spacing.md}`,
  textAlign: 'left',
  color: 'var(--muted)',
  fontWeight: '500',
  fontSize: fontSize.xs,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  cursor: 'pointer',
  userSelect: 'none',
  transition: `color ${duration.fast} ${easing.out}`,
  selectors: {
    '&:hover': {
      color: 'var(--text)',
    },
  },
});

export const row = style({
  borderBottom: '1px solid var(--line)',
  transition: `background ${duration.fast} ${easing.out}`,
  selectors: {
    '&:hover': {
      background: 'rgba(99, 102, 241, 0.08)',
    },
  },
});

export const rowSelected = style({
  background: 'rgba(99, 102, 241, 0.08) !important',
});

export const cell = style({
  padding: `${spacing.sm} ${spacing.md}`,
  color: 'var(--text)',
});

export const emptyState = style({
  padding: `${spacing.xxxxl} ${spacing.xl}`,
  textAlign: 'center',
  color: 'var(--muted)',
});

export const loadingSkeleton = style({
  height: '12px',
  background: 'linear-gradient(90deg, var(--panel) 25%, var(--panel-2) 50%, var(--panel) 75%)',
  backgroundSize: '200% 100%',
  borderRadius: '4px',
  animation: 'shimmer 1.5s infinite',
});
