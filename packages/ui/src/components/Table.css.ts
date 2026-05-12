import { keyframes, style } from '@vanilla-extract/css';
import { colors } from '../tokens/colors.css.js';
import { duration, easing } from '../tokens/motion.css.js';
import { radii } from '../tokens/radii.css.js';
import { spacing } from '../tokens/spacing.css.js';
import { fontFamily, fontSize, fontWeight } from '../tokens/typography.css.js';

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: fontFamily.data,
  fontSize: fontSize.sm,
});

export const headerRow = style({
  background: colors.surfaceRaised,
  borderBottom: `1px solid ${colors.border}`,
});

export const headerCell = style({
  padding: `${spacing.sm} ${spacing.md}`,
  textAlign: 'left',
  color: colors.textMuted,
  fontWeight: fontWeight.medium,
  fontSize: fontSize.xs,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  cursor: 'pointer',
  userSelect: 'none',
  transition: `color ${duration.fast} ${easing.out}`,
  selectors: {
    '&:hover': {
      color: colors.text,
    },
  },
});

export const row = style({
  borderBottom: `1px solid ${colors.border}`,
  transition: `background ${duration.fast} ${easing.out}`,
  selectors: {
    '&:hover': {
      background: colors.accentSubtle,
    },
  },
});

export const rowSelected = style({
  background: `${colors.accentSubtle} !important`,
});

export const cell = style({
  padding: `${spacing.sm} ${spacing.md}`,
  color: colors.text,
});

export const emptyState = style({
  padding: `${spacing.xxxxl} ${spacing.xl}`,
  textAlign: 'center',
  color: colors.textMuted,
});

const shimmer = keyframes({
  '0%': { backgroundPosition: '200% 0' },
  '100%': { backgroundPosition: '-200% 0' },
});

export const loadingSkeleton = style({
  height: '12px',
  background: `linear-gradient(90deg, ${colors.surfaceRaised} 25%, ${colors.surfaceOverlay} 50%, ${colors.surfaceRaised} 75%)`,
  backgroundSize: '200% 100%',
  borderRadius: radii.sm,
  animation: `${shimmer} 1.5s ease-in-out infinite`,
});
