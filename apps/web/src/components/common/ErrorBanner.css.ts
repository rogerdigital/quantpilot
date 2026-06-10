import { style } from '@vanilla-extract/css';

export const banner = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
  background: 'var(--danger-subtle)',
  border: '1px solid var(--danger)',
  borderRadius: 'var(--radius)',
  color: 'var(--danger)',
  fontSize: '13px',
  lineHeight: 1.4,
  fontFamily: 'var(--font-ui)',
});

export const icon = style({
  flexShrink: 0,
  width: '18px',
  height: '18px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const content = style({
  flex: 1,
  minWidth: 0,
});

export const message = style({
  fontWeight: 600,
});

export const detail = style({
  marginTop: '2px',
  fontSize: '12px',
  opacity: 0.8,
});

export const actions = style({
  display: 'flex',
  gap: '6px',
  flexShrink: 0,
});

export const btn = style({
  padding: '4px 10px',
  background: 'transparent',
  border: '1px solid currentColor',
  borderRadius: 'var(--radius)',
  color: 'inherit',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  selectors: {
    '&:hover': {
      background: 'currentColor',
      color: 'var(--on-danger)',
    },
  },
});

export const dismissBtn = style({
  width: '28px',
  height: '28px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  opacity: 0.6,
  cursor: 'pointer',
  transition: 'opacity 150ms ease',
  selectors: {
    '&:hover': {
      opacity: 1,
    },
  },
});
