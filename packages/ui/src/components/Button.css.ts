import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { colors } from '../tokens/colors.css.js';
import { duration, easing } from '../tokens/motion.css.js';
import { radii } from '../tokens/radii.css.js';
import { shadows } from '../tokens/shadows.css.js';
import { spacing } from '../tokens/spacing.css.js';
import { fontSize, fontWeight } from '../tokens/typography.css.js';

const spin = keyframes({
  to: { transform: 'rotate(360deg)' },
});

const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  border: '1px solid transparent',
  borderRadius: radii.md,
  fontFamily: 'inherit',
  fontWeight: fontWeight.medium,
  fontSize: fontSize.md,
  lineHeight: '1',
  cursor: 'pointer',
  transition: `all ${duration.normal} ${easing.out}`,
  selectors: {
    '&:disabled': {
      opacity: 0.4,
      cursor: 'not-allowed',
    },
  },
});

export const variants = styleVariants({
  primary: [
    base,
    {
      background: colors.accent,
      color: 'var(--on-accent)',
      boxShadow: shadows.sm,
      selectors: {
        '&:hover:not(:disabled)': {
          background: colors.accentHover,
          boxShadow: shadows.md,
        },
        '&:active:not(:disabled)': {
          boxShadow: shadows.sm,
        },
      },
    },
  ],
  secondary: [
    base,
    {
      background: 'transparent',
      color: colors.text,
      borderColor: colors.border,
      selectors: {
        '&:hover:not(:disabled)': {
          borderColor: colors.borderStrong,
          background: colors.accentSubtle,
        },
      },
    },
  ],
  ghost: [
    base,
    {
      background: 'transparent',
      color: colors.textMuted,
      selectors: {
        '&:hover:not(:disabled)': {
          color: colors.text,
          background: colors.accentSubtle,
        },
      },
    },
  ],
  danger: [
    base,
    {
      background: colors.danger,
      color: 'var(--on-danger)',
      boxShadow: shadows.sm,
      selectors: {
        '&:hover:not(:disabled)': {
          background: colors.danger,
          filter: 'brightness(0.9)',
          boxShadow: shadows.md,
        },
        '&:active:not(:disabled)': {
          boxShadow: shadows.sm,
        },
      },
    },
  ],
});

export const sizes = styleVariants({
  sm: {
    height: '28px',
    padding: `0 ${spacing.sm}`,
    fontSize: fontSize.sm,
  },
  md: {
    height: '36px',
    padding: `0 ${spacing.lg}`,
  },
  lg: {
    height: '40px',
    padding: `0 ${spacing.xl}`,
    fontSize: fontSize.lg,
  },
});

export const loading = style({
  position: 'relative',
  color: 'transparent',
  selectors: {
    '&::after': {
      content: '',
      position: 'absolute',
      width: '14px',
      height: '14px',
      // Use an explicit color rather than currentColor: the parent sets
      // color: transparent to hide the label, which would also hide a
      // currentColor-based spinner.
      border: `2px solid ${colors.text}`,
      borderTopColor: 'transparent',
      borderRadius: radii.full,
      animation: `${spin} 0.6s linear infinite`,
    },
  },
});
