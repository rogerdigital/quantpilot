import { style, styleVariants } from '@vanilla-extract/css';
import { colors } from '../tokens/colors.css.js';
import { duration, easing } from '../tokens/motion.css.js';
import { radii } from '../tokens/radii.css.js';
import { shadows } from '../tokens/shadows.css.js';
import { spacing } from '../tokens/spacing.css.js';
import { fontSize, fontWeight } from '../tokens/typography.css.js';

export const overlay = style({
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  animation: `fadeIn ${duration.normal} ${easing.out}`,
});

export const sizes = styleVariants({
  sm: { width: '400px' },
  md: { width: '560px' },
  lg: { width: '720px' },
  full: { width: '90vw', height: '85vh' },
});

export const panel = style({
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.xl,
  boxShadow: shadows.xl,
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '85vh',
  animation: `slideUp ${duration.slow} ${easing.spring}`,
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.lg} ${spacing.xl}`,
  borderBottom: `1px solid ${colors.border}`,
});

export const title = style({
  margin: 0,
  fontSize: fontSize.xl,
  fontWeight: fontWeight.semibold,
  color: colors.textStrong,
});

export const body = style({
  flex: 1,
  padding: spacing.xl,
  overflowY: 'auto',
});

export const footer = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing.sm,
  padding: `${spacing.lg} ${spacing.xl}`,
  borderTop: `1px solid ${colors.border}`,
});

export const closeBtn = style({
  background: 'transparent',
  border: 'none',
  color: colors.textMuted,
  cursor: 'pointer',
  padding: spacing.xs,
  fontSize: fontSize.xl,
  borderRadius: radii.sm,
  transition: `color ${duration.fast} ${easing.out}, background ${duration.fast} ${easing.out}`,
  selectors: {
    '&:hover': {
      color: colors.text,
      background: colors.accentSubtle,
    },
  },
});
