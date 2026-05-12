import { style } from '@vanilla-extract/css';
import { colors } from '../tokens/colors.css.js';
import { duration, easing } from '../tokens/motion.css.js';
import { radii } from '../tokens/radii.css.js';
import { shadows } from '../tokens/shadows.css.js';
import { spacing } from '../tokens/spacing.css.js';
import { fontSize, fontWeight } from '../tokens/typography.css.js';

export const trigger = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing.sm,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.md,
  background: colors.surface,
  padding: `0 ${spacing.md}`,
  height: '40px',
  cursor: 'pointer',
  fontSize: fontSize.md,
  color: colors.text,
  transition: `border-color ${duration.normal} ${easing.out}`,
  selectors: {
    '&:hover': {
      borderColor: colors.borderStrong,
    },
    '&:focus': {
      borderColor: colors.accent,
      outline: 'none',
    },
  },
});

export const dropdown = style({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: spacing.xs,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.md,
  boxShadow: shadows.md,
  zIndex: 100,
  maxHeight: '240px',
  overflowY: 'auto',
});

export const option = style({
  display: 'block',
  width: '100%',
  padding: `${spacing.sm} ${spacing.md}`,
  background: 'transparent',
  border: 'none',
  color: colors.text,
  fontSize: fontSize.md,
  cursor: 'pointer',
  textAlign: 'left',
  transition: `background ${duration.fast} ${easing.out}`,
  selectors: {
    '&:hover': {
      background: colors.surfaceRaised,
    },
  },
});

export const optionSelected = style({
  color: colors.accent,
  fontWeight: fontWeight.semibold,
});

export const placeholder = style({
  color: colors.textMuted,
  opacity: 0.6,
});
