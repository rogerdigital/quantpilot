import { globalStyle, keyframes, style } from '@vanilla-extract/css';

const slideIn = keyframes({
  from: { opacity: 0, transform: 'translateX(40px)' },
  to: { opacity: 1, transform: 'translateX(0)' },
});

const slideOut = keyframes({
  from: { opacity: 1, transform: 'translateX(0)' },
  to: { opacity: 0, transform: 'translateX(40px)' },
});

export const toastContainer = style({
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  zIndex: 'var(--z-toast)' as any,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  maxWidth: '360px',
  width: 'calc(100vw - 48px)',
  pointerEvents: 'none',
});

export const toast = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  padding: '12px 14px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
  background: 'var(--panel)',
  backdropFilter: 'blur(8px)',
  boxShadow: 'var(--shadow-panel-hover)',
  pointerEvents: 'auto',
  animation: `${slideIn} 200ms cubic-bezier(0.16, 1, 0.3, 1) both`,
});

export const toastExiting = style({
  animation: `${slideOut} 160ms ease forwards`,
});

export const toastSuccess = style({
  borderColor: 'var(--buy)',
});

export const toastError = style({
  borderColor: 'var(--sell)',
});

export const toastInfo = style({
  borderColor: 'var(--accent)',
});

export const toastWarn = style({
  borderColor: 'var(--hold)',
});

export const toastIcon = style({
  flexShrink: 0,
  font: '700 13px/1 var(--font-data)',
  marginTop: '1px',
});

export const toastBody = style({ flex: 1, minWidth: 0 });

export const toastTitle = style({
  font: '600 13px/1.3 var(--font-ui)',
  color: 'var(--text)',
});

export const toastDetail = style({
  marginTop: '3px',
  font: '400 12px/1.4 var(--font-ui)',
  color: 'var(--muted)',
});

export const toastClose = style({
  flexShrink: 0,
  background: 'transparent',
  border: 'none',
  color: 'var(--muted)',
  cursor: 'pointer',
  font: '16px/1 var(--font-ui)',
  padding: '0 2px',
  marginTop: '-1px',
  transition: 'color 140ms ease',
  ':hover': { color: 'var(--text)' },
} as any);

globalStyle(`${toastSuccess} ${toastIcon}`, { color: 'var(--buy)' });
globalStyle(`${toastError} ${toastIcon}`, { color: 'var(--sell)' });
globalStyle(`${toastInfo} ${toastIcon}`, { color: 'var(--accent)' });
globalStyle(`${toastWarn} ${toastIcon}`, { color: 'var(--hold)' });
