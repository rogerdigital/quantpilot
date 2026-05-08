import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../theme.css.js';
import { duration, easing } from '../tokens/motion.css.js';
import { radii } from '../tokens/radii.css.js';
import { spacing } from '../tokens/spacing.css.js';
import { fontFamily, fontSize } from '../tokens/typography.css.js';

export const wrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
});

export const label = style({
  fontSize: fontSize.sm,
  fontWeight: '500',
  color: vars.textMuted,
});

export const inputContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  border: `1px solid ${vars.border}`,
  borderRadius: radii.md,
  background: vars.surface,
  padding: `0 ${spacing.md}`,
  height: '34px',
  transition: `border-color ${duration.normal} ${easing.out}`,
  selectors: {
    '&:focus-within': {
      borderColor: vars.accent,
    },
  },
});

export const input = style({
  flex: 1,
  border: 'none',
  background: 'transparent',
  color: vars.text,
  fontFamily: fontFamily.ui,
  fontSize: fontSize.md,
  outline: 'none',
  selectors: {
    '&::placeholder': {
      color: vars.textMuted,
      opacity: 0.5,
    },
  },
});

export const validationState = styleVariants({
  default: {},
  error: {
    borderColor: `${vars.danger} !important`,
  },
  success: {
    borderColor: `${vars.success} !important`,
  },
});

export const errorText = style({
  fontSize: fontSize.xs,
  color: vars.danger,
});
