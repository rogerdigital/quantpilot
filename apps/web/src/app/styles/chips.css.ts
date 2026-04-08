import { globalStyle } from '@vanilla-extract/css';

/* ============================================================
   STATUS CHIPS
   ============================================================ */

globalStyle('.status-chip', {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: '28px',
  padding: '0 10px',
  border: '1px solid transparent',
  borderRadius: 'var(--radius-sm)',
  font: '700 11px/1 var(--font-data)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  flexWrap: 'nowrap',
  flexShrink: 0,
} as any);

globalStyle('.status-chip-large', {
  marginTop: '12px',
  minHeight: '40px',
  padding: '0 14px',
  fontSize: '14px',
  letterSpacing: '0.06em',
} as any);

/* ============================================================
   SIGNAL & ORDER CHIPS
   ============================================================ */

globalStyle('.signal-chip', {
  padding: '7px 10px',
} as any);

globalStyle('.order-status', {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: 'var(--radius-sm)',
  font: '700 11px/1 var(--font-data)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
} as any);

globalStyle('.order-status-open', {
  background: 'rgba(77, 166, 255, 0.12)',
  color: 'var(--info)',
} as any);

globalStyle('.order-status-filled', {
  background: 'rgba(0, 232, 157, 0.1)',
  color: 'var(--buy)',
  boxShadow: '0 0 8px rgba(0, 232, 157, 0.12)',
} as any);

globalStyle('.order-status-canceled', {
  background: 'rgba(255, 51, 88, 0.1)',
  color: 'var(--sell)',
} as any);

globalStyle('.order-status-muted', {
  background: 'rgba(255, 255, 255, 0.04)',
  color: 'var(--muted)',
} as any);

globalStyle('.signal-buy', {
  background: 'rgba(0, 232, 157, 0.1)',
  color: 'var(--buy)',
  border: '1px solid rgba(0, 232, 157, 0.2)',
  boxShadow: '0 0 8px rgba(0, 232, 157, 0.12)',
} as any);

globalStyle('.signal-hold', {
  background: 'rgba(255, 183, 0, 0.08)',
  color: 'var(--hold)',
  border: '1px solid rgba(255, 183, 0, 0.18)',
} as any);

globalStyle('.signal-sell', {
  background: 'rgba(255, 51, 88, 0.1)',
  color: 'var(--sell)',
  border: '1px solid rgba(255, 51, 88, 0.2)',
  boxShadow: '0 0 8px rgba(255, 51, 88, 0.1)',
} as any);

globalStyle('.text-up', {
  color: 'var(--buy)',
  textShadow: '0 0 16px rgba(0, 232, 157, 0.3)',
} as any);

globalStyle('.text-down', {
  color: 'var(--sell)',
  textShadow: '0 0 16px rgba(255, 51, 88, 0.3)',
} as any);

globalStyle('.empty-cell', {
  textAlign: 'center',
  color: 'var(--muted)',
  padding: '18px 12px',
  fontSize: '13px',
} as any);
