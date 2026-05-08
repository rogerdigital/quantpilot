import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../theme.css.js';
import { duration, easing } from '../tokens/motion.css.js';
import { radii } from '../tokens/radii.css.js';
import { spacing } from '../tokens/spacing.css.js';
import { fontSize, fontWeight } from '../tokens/typography.css.js';

export const overlay = style({
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.6)',
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
  background: vars.surfaceRaised,
  border: `1px solid ${vars.border}`,
  borderRadius: radii.lg,
  boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75), 0 4px 16px rgba(0, 0, 0, 0.55)',
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
  borderBottom: `1px solid ${vars.border}`,
});

export const title = style({
  margin: 0,
  fontSize: fontSize.xl,
  fontWeight: fontWeight.semibold,
  color: vars.textStrong,
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
  borderTop: `1px solid ${vars.border}`,
});

export const closeBtn = style({
  background: 'transparent',
  border: 'none',
  color: vars.textMuted,
  cursor: 'pointer',
  padding: spacing.xs,
  fontSize: fontSize.xl,
  selectors: {
    '&:hover': {
      color: vars.text,
    },
  },
});
