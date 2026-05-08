import { style } from '@vanilla-extract/css';
import { duration, easing } from '../tokens/motion.css.js';
import { radii } from '../tokens/radii.css.js';
import { spacing } from '../tokens/spacing.css.js';
import { fontSize, fontWeight } from '../tokens/typography.css.js';

export const card = style({
  background: 'var(--surface)',
  border: `1px solid ${'var(--border)'}`,
  borderRadius: radii.lg,
  transition: `border-color ${duration.normal} ${easing.out}, box-shadow ${duration.normal} ${easing.out}`,
  selectors: {
    '&:hover': {
      borderColor: 'var(--borderStrong)',
      boxShadow: '0 0 28px rgba(99, 102, 241, 0.10)',
    },
  },
});

export const cardHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.lg} ${spacing.xl}`,
  borderBottom: `1px solid ${'var(--border)'}`,
});

export const cardTitle = style({
  margin: 0,
  fontSize: fontSize.lg,
  fontWeight: fontWeight.semibold,
  color: 'var(--textStrong)',
});

export const cardBody = style({
  padding: spacing.xl,
});

export const cardFooter = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing.sm,
  padding: `${spacing.md} ${spacing.xl}`,
  borderTop: `1px solid ${'var(--border)'}`,
});
