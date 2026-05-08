import { style } from '@vanilla-extract/css';

export const workspace = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
});

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 12px',
  background: 'var(--panel)',
  borderBottom: '1px solid var(--line)',
  flexShrink: 0,
});

export const toolbarBtn = style({
  padding: '4px 10px',
  background: 'transparent',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  color: 'var(--muted)',
  fontFamily: 'var(--font-data)',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  selectors: {
    '&:hover': {
      borderColor: 'var(--accent)',
      color: 'var(--text)',
    },
  },
});

export const toolbarBtnActive = style({
  background: 'var(--accent-subtle)',
  borderColor: 'var(--accent)',
  color: 'var(--accent)',
});

export const layoutArea = style({
  flex: 1,
  overflow: 'hidden',
});
