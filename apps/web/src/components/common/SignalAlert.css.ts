import { keyframes, style } from '@vanilla-extract/css';

const pulse = keyframes({
  '0%': { transform: 'scale(1)', opacity: '1' },
  '50%': { transform: 'scale(1.15)', opacity: '0.7' },
  '100%': { transform: 'scale(1)', opacity: '1' },
});

const ring = keyframes({
  '0%': { transform: 'scale(1)', opacity: '0.6' },
  '100%': { transform: 'scale(2.2)', opacity: '0' },
});

export const badge = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const dot = style({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: 'var(--accent)',
  position: 'relative',
});

export const dotBuy = style({
  background: 'var(--buy)',
});

export const dotSell = style({
  background: 'var(--sell)',
});

export const dotWarning = style({
  background: 'var(--warning)',
});

export const pulsing = style({
  animation: `${pulse} 600ms ease-in-out 3`,
});

export const ringEffect = style({
  position: 'absolute',
  inset: 0,
  borderRadius: '50%',
  border: '2px solid var(--accent)',
  animation: `${ring} 800ms ease-out 2`,
  pointerEvents: 'none',
});

export const ringBuy = style({
  borderColor: 'var(--buy)',
});

export const ringSell = style({
  borderColor: 'var(--sell)',
});

export const ringWarning = style({
  borderColor: 'var(--warning)',
});
