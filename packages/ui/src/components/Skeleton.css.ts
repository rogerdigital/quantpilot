import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { colors } from '../tokens/colors.css.js';
import { radii } from '../tokens/radii.css.js';
import { spacing } from '../tokens/spacing.css.js';

const shimmer = keyframes({
  '0%': { backgroundPosition: '200% 0' },
  '100%': { backgroundPosition: '-200% 0' },
});

export const base = style({
  background: `linear-gradient(90deg, ${colors.surfaceRaised} 25%, ${colors.surfaceOverlay} 50%, ${colors.surfaceRaised} 75%)`,
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.5s ease-in-out infinite`,
  borderRadius: radii.sm,
});

export const variants = styleVariants({
  text: [base, { height: '14px', width: '100%' }],
  title: [base, { height: '20px', width: '60%' }],
  circle: [base, { borderRadius: radii.full }],
  rect: [base],
  avatar: [base, { width: '36px', height: '36px', borderRadius: radii.full }],
  button: [base, { height: '36px', width: '100px', borderRadius: radii.md }],
});

export const row = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
  padding: `${spacing.md} 0`,
});

export const tableRow = style({
  display: 'grid',
  gap: spacing.md,
  padding: `${spacing.sm} 0`,
  borderBottom: `1px solid ${colors.border}`,
});
