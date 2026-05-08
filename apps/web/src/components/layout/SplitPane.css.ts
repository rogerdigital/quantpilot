import { style } from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  overflow: 'hidden',
  height: '100%',
  width: '100%',
});

export const containerVertical = style({
  flexDirection: 'column',
});

export const pane = style({
  overflow: 'auto',
  minWidth: 0,
  minHeight: 0,
});

export const divider = style({
  flexShrink: 0,
  background: 'var(--line)',
  transition: 'background 150ms ease',
  selectors: {
    '&:hover': {
      background: 'var(--accent)',
    },
    '&:active': {
      background: 'var(--accent)',
    },
  },
});

export const dividerHorizontal = style({
  width: '4px',
  cursor: 'col-resize',
  userSelect: 'none',
});

export const dividerVertical = style({
  height: '4px',
  cursor: 'row-resize',
  userSelect: 'none',
});

export const dragOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  cursor: 'col-resize',
});
