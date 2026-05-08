import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { radii } from '../tokens/radii.css.js';

const shimmer = keyframes({
  '0%': { backgroundPosition: '200% 0' },
  '100%': { backgroundPosition: '-200% 0' },
});

export const base = style({
  background: 'linear-gradient(90deg, var(--panel) 25%, var(--panel-2) 50%, var(--panel) 75%)',
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.5s ease-in-out infinite`,
  borderRadius: radii.sm,
});

export const variants = styleVariants({
  text: [base, { height: '14px', width: '100%' }],
  title: [base, { height: '20px', width: '60%' }],
  circle: [base, { borderRadius: '50%' }],
  rect: [base],
  avatar: [base, { width: '36px', height: '36px', borderRadius: '50%' }],
  button: [base, { height: '34px', width: '100px', borderRadius: radii.md }],
});

export const row = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '12px 0',
});

export const tableRow = style({
  display: 'grid',
  gap: '12px',
  padding: '10px 0',
  borderBottom: '1px solid var(--line)',
});
