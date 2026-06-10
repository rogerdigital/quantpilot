import { globalStyle, keyframes, style } from '@vanilla-extract/css';

const backdropIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const panelIn = keyframes({
  from: { opacity: 0, transform: 'translateY(-12px) scale(0.97)' },
  to: { opacity: 1, transform: 'translateY(0) scale(1)' },
});

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 'var(--z-modal)' as any,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: 'clamp(60px, 12vh, 140px)',
  background: 'var(--overlay-dim)',
  backdropFilter: 'var(--overlay-blur)',
  animation: `${backdropIn} 120ms ease both`,
});

export const panel = style({
  width: '100%',
  maxWidth: '560px',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--line)',
  background: 'var(--panel)',
  boxShadow: 'var(--shadow-modal)',
  overflow: 'hidden',
  animation: `${panelIn} 160ms cubic-bezier(0.16, 1, 0.3, 1) both`,
});

export const inputWrap = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '14px 18px',
  borderBottom: '1px solid var(--line)',
});

export const inputIcon = style({
  width: '20px',
  height: '20px',
  flexShrink: 0,
  color: 'var(--muted)',
  userSelect: 'none',
});

export const input = style({
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'var(--text)',
  font: '500 15px/1 var(--font-ui)',
  caretColor: 'var(--accent)',
  '::placeholder': {
    color: 'var(--muted)',
  },
} as any);

export const kbdHint = style({
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '34px',
  height: '34px',
  fontSize: '18px',
  color: 'var(--muted)',
  background: 'var(--panel-2)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  transition: 'border-color 120ms ease, background 120ms ease, color 120ms ease',
  selectors: {
    '&:hover': {
      background: 'var(--panel-3)',
      borderColor: 'var(--line-strong)',
      color: 'var(--text)',
    },
  },
});

export const results = style({
  maxHeight: '320px',
  overflowY: 'auto',
  padding: '6px',
});

export const sectionLabel = style({
  padding: '8px 12px 4px',
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  userSelect: 'none',
});

export const resultItem = style({
  appearance: 'none',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 12px',
  borderRadius: 'var(--radius)',
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background 100ms ease',
  border: '1px solid transparent',
});

export const resultItemActive = style({
  background: 'var(--panel-2)',
  borderColor: 'var(--line)',
});

globalStyle(`${resultItem}:hover`, {
  background: 'var(--panel-2)',
});

export const resultIcon = style({
  flexShrink: 0,
  width: '28px',
  height: '28px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--accent-subtle)',
  border: '1px solid var(--line)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  font: '700 11px/1 var(--font-data)',
  letterSpacing: '0.04em',
  color: 'var(--accent)',
});

export const resultText = style({
  flex: 1,
  minWidth: 0,
});

export const resultName = style({
  font: '500 14px/1 var(--font-ui)',
  color: 'var(--text)',
});

export const resultHint = style({
  marginTop: '3px',
  font: '400 12px/1 var(--font-ui)',
  color: 'var(--muted)',
});

export const resultEnter = style({
  flexShrink: 0,
  font: '600 11px/1 var(--font-data)',
  color: 'var(--muted)',
  background: 'var(--panel-2)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 7px',
  userSelect: 'none',
});

export const recentBadge = style({
  flexShrink: 0,
  font: '600 9px/1 var(--font-data)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--accent)',
  background: 'var(--accent-subtle)',
  borderRadius: 'var(--radius-sm)',
  padding: '3px 6px',
  userSelect: 'none',
});

export const emptyState = style({
  padding: '32px 20px',
  textAlign: 'center',
  color: 'var(--muted)',
  font: '400 13px/1.5 var(--font-ui)',
});

export const footer = style({
  display: 'flex',
  gap: '16px',
  padding: '10px 18px',
  borderTop: '1px solid var(--line)',
  background: 'var(--panel-2)',
});

export const footerHint = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  font: '400 11px/1 var(--font-ui)',
  color: 'var(--muted)',
});

export const footerKbd = style({
  font: '600 9px/1 var(--font-data)',
  letterSpacing: '0.06em',
  color: 'var(--muted-strong)',
  background: 'var(--panel-3)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-sm)',
  padding: '3px 6px',
});
