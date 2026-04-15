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
  zIndex: 9000,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: 'clamp(60px, 12vh, 140px)',
  background: 'rgba(3, 4, 18, 0.75)',
  backdropFilter: 'blur(6px)',
  animation: `${backdropIn} 120ms ease both`,
});

export const panel = style({
  width: '100%',
  maxWidth: '560px',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgba(99, 102, 241, 0.22)',
  background: 'rgba(12, 15, 40, 0.98)',
  boxShadow:
    '0 32px 80px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(0, 0, 0, 0.4), 0 0 60px rgba(99, 102, 241, 0.08)',
  overflow: 'hidden',
  animation: `${panelIn} 160ms cubic-bezier(0.16, 1, 0.3, 1) both`,
});

export const inputWrap = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '14px 18px',
  borderBottom: '1px solid rgba(99, 102, 241, 0.12)',
});

export const inputIcon = style({
  flexShrink: 0,
  color: 'rgba(99, 102, 241, 0.65)',
  fontSize: '16px',
  lineHeight: 1,
  fontFamily: 'var(--font-data)',
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
    color: 'rgba(160, 162, 210, 0.38)',
  },
} as any);

export const kbdHint = style({
  flexShrink: 0,
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.08em',
  color: 'rgba(160, 162, 210, 0.45)',
  background: 'rgba(99, 102, 241, 0.06)',
  border: '1px solid rgba(99, 102, 241, 0.14)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 7px',
  userSelect: 'none',
});

export const results = style({
  maxHeight: '320px',
  overflowY: 'auto',
  padding: '6px',
});

export const sectionLabel = style({
  padding: '8px 12px 4px',
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgba(160, 162, 210, 0.45)',
  userSelect: 'none',
});

export const resultItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 12px',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  transition: 'background 100ms ease',
  border: '1px solid transparent',
});

export const resultItemActive = style({
  background: 'rgba(99, 102, 241, 0.12)',
  borderColor: 'rgba(99, 102, 241, 0.18)',
});

globalStyle(`${resultItem}:hover`, {
  background: 'rgba(99, 102, 241, 0.08)',
});

export const resultIcon = style({
  flexShrink: 0,
  width: '28px',
  height: '28px',
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(99, 102, 241, 0.1)',
  border: '1px solid rgba(99, 102, 241, 0.16)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  font: '700 11px/1 var(--font-data)',
  letterSpacing: '0.04em',
  color: 'rgba(99, 102, 241, 0.9)',
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
  color: 'rgba(160, 162, 210, 0.55)',
});

export const resultEnter = style({
  flexShrink: 0,
  font: '600 10px/1 var(--font-data)',
  color: 'rgba(160, 162, 210, 0.35)',
  background: 'rgba(99, 102, 241, 0.06)',
  border: '1px solid rgba(99, 102, 241, 0.12)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 7px',
  userSelect: 'none',
});

export const emptyState = style({
  padding: '32px 20px',
  textAlign: 'center',
  color: 'rgba(160, 162, 210, 0.4)',
  font: '400 13px/1.5 var(--font-ui)',
});

export const footer = style({
  display: 'flex',
  gap: '16px',
  padding: '10px 18px',
  borderTop: '1px solid rgba(99, 102, 241, 0.10)',
  background: 'rgba(99, 102, 241, 0.03)',
});

export const footerHint = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  font: '400 11px/1 var(--font-ui)',
  color: 'rgba(160, 162, 210, 0.38)',
});

export const footerKbd = style({
  font: '600 9px/1 var(--font-data)',
  letterSpacing: '0.06em',
  color: 'rgba(160, 162, 210, 0.55)',
  background: 'rgba(99, 102, 241, 0.07)',
  border: '1px solid rgba(99, 102, 241, 0.14)',
  borderRadius: 'var(--radius-sm)',
  padding: '3px 6px',
});
