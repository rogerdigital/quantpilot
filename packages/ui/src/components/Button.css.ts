import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../theme.css.js';
import { duration, easing } from '../tokens/motion.css.js';
import { radii } from '../tokens/radii.css.js';
import { spacing } from '../tokens/spacing.css.js';
import { fontSize, fontWeight } from '../tokens/typography.css.js';

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
      background: vars.accent,
      color: '#fff',
      selectors: {
        '&:hover:not(:disabled)': {
          background: vars.accentHover,
        },
      },
    },
  ],
  secondary: [
    base,
    {
      background: 'transparent',
      color: vars.text,
      borderColor: vars.border,
      selectors: {
        '&:hover:not(:disabled)': {
          borderColor: vars.borderStrong,
          background: vars.accentSubtle,
        },
      },
    },
  ],
  ghost: [
    base,
    {
      background: 'transparent',
      color: vars.textMuted,
      selectors: {
        '&:hover:not(:disabled)': {
          color: vars.text,
          background: vars.accentSubtle,
        },
      },
    },
  ],
  danger: [
    base,
    {
      background: vars.danger,
      color: '#fff',
      selectors: {
        '&:hover:not(:disabled)': {
          background: '#e02e4d',
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
    height: '34px',
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
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
    },
  },
});
