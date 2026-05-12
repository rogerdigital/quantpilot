import { style, styleVariants } from '@vanilla-extract/css';
import { colors } from '../tokens/colors.css.js';
import { duration, easing } from '../tokens/motion.css.js';
import { radii } from '../tokens/radii.css.js';
import { spacing } from '../tokens/spacing.css.js';
import { fontFamily, fontSize, fontWeight } from '../tokens/typography.css.js';

export const wrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
});

export const label = style({
  fontSize: fontSize.sm,
  fontWeight: fontWeight.medium,
  color: colors.textMuted,
});

export const inputContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.md,
  background: colors.surface,
  padding: `0 ${spacing.md}`,
  height: '40px',
  transition: `border-color ${duration.normal} ${easing.out}`,
  selectors: {
    '&:focus-within': {
      borderColor: colors.accent,
    },
  },
});

export const input = style({
  flex: 1,
  border: 'none',
  background: 'transparent',
  color: colors.text,
  fontFamily: fontFamily.ui,
  fontSize: fontSize.md,
  outline: 'none',
  height: '100%',
  selectors: {
    '&::placeholder': {
      color: colors.textMuted,
      opacity: 0.6,
    },
  },
});

export const validationState = styleVariants({
  default: {},
  error: {
    borderColor: `${colors.danger} !important`,
  },
  success: {
    borderColor: `${colors.success} !important`,
  },
});

export const errorText = style({
  fontSize: fontSize.xs,
  color: colors.danger,
});
