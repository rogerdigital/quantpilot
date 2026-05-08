import { style } from '@vanilla-extract/css';
import { vars } from '../theme.css.js';
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
  borderBottom: `1px solid ${vars.borderStrong}`,
});

export const headerCell = style({
  padding: `${spacing.sm} ${spacing.md}`,
  textAlign: 'left',
  color: vars.textMuted,
  fontWeight: '500',
  fontSize: fontSize.xs,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  cursor: 'pointer',
  userSelect: 'none',
  transition: `color ${duration.fast} ${easing.out}`,
  selectors: {
    '&:hover': {
      color: vars.text,
    },
  },
});

export const row = style({
  borderBottom: `1px solid ${vars.border}`,
  transition: `background ${duration.fast} ${easing.out}`,
  selectors: {
    '&:hover': {
      background: vars.accentSubtle,
    },
  },
});

export const rowSelected = style({
  background: `${vars.accentSubtle} !important`,
});

export const cell = style({
  padding: `${spacing.sm} ${spacing.md}`,
  color: vars.text,
});

export const emptyState = style({
  padding: `${spacing.xxxxl} ${spacing.xl}`,
  textAlign: 'center',
  color: vars.textMuted,
});

export const loadingSkeleton = style({
  height: '12px',
  background: `linear-gradient(90deg, ${vars.surface} 25%, ${vars.surfaceRaised} 50%, ${vars.surface} 75%)`,
  backgroundSize: '200% 100%',
  borderRadius: '4px',
  animation: 'shimmer 1.5s infinite',
});
