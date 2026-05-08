import { style } from '@vanilla-extract/css';
import { vars } from '../theme.css.js';
import { duration, easing } from '../tokens/motion.css.js';
import { radii } from '../tokens/radii.css.js';
import { spacing } from '../tokens/spacing.css.js';
import { fontSize } from '../tokens/typography.css.js';

export const trigger = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing.sm,
  border: `1px solid ${vars.border}`,
  borderRadius: radii.md,
  background: vars.surface,
  padding: `0 ${spacing.md}`,
  height: '34px',
  cursor: 'pointer',
  fontSize: fontSize.md,
  color: vars.text,
  transition: `border-color ${duration.normal} ${easing.out}`,
  selectors: {
    '&:hover': {
      borderColor: vars.borderStrong,
    },
  },
});

export const dropdown = style({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: spacing.xs,
  background: vars.surfaceRaised,
  border: `1px solid ${vars.border}`,
  borderRadius: radii.md,
  boxShadow: '0 8px 28px rgba(0, 0, 0, 0.5)',
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
  color: vars.text,
  fontSize: fontSize.md,
  cursor: 'pointer',
  textAlign: 'left',
  selectors: {
    '&:hover': {
      background: vars.accentSubtle,
    },
  },
});

export const optionSelected = style({
  color: vars.accent,
  fontWeight: '600',
});

export const placeholder = style({
  color: vars.textMuted,
  opacity: 0.5,
});
