import { style } from '@vanilla-extract/css';

export const error = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '4px',
  marginTop: '4px',
  color: 'var(--danger, #ff3358)',
  fontSize: '11px',
  lineHeight: 1.4,
  fontFamily: 'var(--font-ui)',
});

export const icon = style({
  flexShrink: 0,
  fontSize: '12px',
  lineHeight: 1.4,
});
