import { keyframes, style } from '@vanilla-extract/css';

const flashUp = keyframes({
  '0%': { backgroundColor: 'rgba(0, 232, 157, 0.35)' },
  '100%': { backgroundColor: 'transparent' },
});

const flashDown = keyframes({
  '0%': { backgroundColor: 'rgba(255, 51, 88, 0.35)' },
  '100%': { backgroundColor: 'transparent' },
});

export const wrapper = style({
  display: 'inline-block',
  borderRadius: '3px',
  transition: 'color 150ms ease',
  padding: '1px 4px',
  margin: '-1px -4px',
});

export const flashUpStyle = style({
  animation: `${flashUp} 200ms ease-out`,
});

export const flashDownStyle = style({
  animation: `${flashDown} 200ms ease-out`,
});

export const priceUp = style({
  color: 'var(--buy)',
});

export const priceDown = style({
  color: 'var(--sell)',
});

export const priceFlat = style({
  color: 'var(--text)',
});
