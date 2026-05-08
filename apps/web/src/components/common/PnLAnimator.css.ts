import { style } from '@vanilla-extract/css';

export const value = style({
  display: 'inline-block',
  fontVariantNumeric: 'tabular-nums',
  transition: 'color 200ms ease',
});

export const positive = style({
  color: 'var(--buy)',
});

export const negative = style({
  color: 'var(--sell)',
});

export const zero = style({
  color: 'var(--muted)',
});
