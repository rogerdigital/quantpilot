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
   SIGNAL & ORDER CHIPS — soft pastel fills, no glows
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
  background: 'var(--info-subtle)',
  color: 'var(--info)',
  border: '1px solid rgba(99, 102, 241, 0.15)',
} as any);

globalStyle('.order-status-filled', {
  background: 'var(--success-subtle)',
  color: 'var(--buy)',
} as any);

globalStyle('.order-status-canceled', {
  background: 'var(--danger-subtle)',
  color: 'var(--sell)',
} as any);

globalStyle('.order-status-muted', {
  background: 'var(--panel-2)',
  color: 'var(--muted)',
} as any);

globalStyle('.signal-buy', {
  background: 'var(--success-subtle)',
  color: 'var(--buy)',
  border: '1px solid var(--success-subtle)',
} as any);

globalStyle('.signal-hold', {
  background: 'var(--warning-subtle)',
  color: 'var(--hold)',
  border: '1px solid var(--warning-subtle)',
} as any);

globalStyle('.signal-sell', {
  background: 'var(--danger-subtle)',
  color: 'var(--sell)',
  border: '1px solid var(--danger-subtle)',
} as any);

globalStyle('.text-up', {
  color: 'var(--buy)',
} as any);

globalStyle('.text-down', {
  color: 'var(--sell)',
} as any);

globalStyle('.empty-cell', {
  textAlign: 'center',
  color: 'var(--muted)',
  padding: '18px 12px',
  fontSize: '13px',
} as any);
