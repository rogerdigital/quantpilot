import { style } from '@vanilla-extract/css';
import { colors } from '../tokens/colors.css.js';
import { duration, easing } from '../tokens/motion.css.js';
import { radii } from '../tokens/radii.css.js';
import { shadows } from '../tokens/shadows.css.js';
import { spacing } from '../tokens/spacing.css.js';
import { fontSize, fontWeight } from '../tokens/typography.css.js';

export const card = style({
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.lg,
  boxShadow: shadows.panel,
  transition: `box-shadow ${duration.normal} ${easing.out}, border-color ${duration.normal} ${easing.out}`,
  selectors: {
    '&:hover': {
      borderColor: colors.borderStrong,
      boxShadow: shadows.panelHover,
    },
  },
});

export const cardHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.lg} ${spacing.xl}`,
  borderBottom: `1px solid ${colors.border}`,
});

export const cardTitle = style({
  margin: 0,
  fontSize: fontSize.lg,
  fontWeight: fontWeight.semibold,
  color: colors.textStrong,
});

export const cardBody = style({
  padding: spacing.xl,
});

export const cardFooter = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing.sm,
  padding: `${spacing.md} ${spacing.xl}`,
  borderTop: `1px solid ${colors.border}`,
});
