import { style, styleVariants } from '@vanilla-extract/css';

/* -- STATUS DOT ------------------------------------------ */

export const statusDotWrap = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
});

export const statusDot = style({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  flexShrink: 0,
});

export const statusDotColor = styleVariants({
  ok: { background: 'var(--buy)' },
  warn: { background: 'var(--hold)' },
  danger: { background: 'var(--sell)' },
  muted: { background: 'var(--muted)' },
});

export const statusDotText = style({
  fontSize: '12px',
  fontFamily: 'var(--font-ui)',
  color: 'var(--text)',
});

/* -- LABEL BADGE ----------------------------------------- */

export const labelBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '5px 10px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-sm)',
  background: 'transparent',
  font: '700 11px/1 var(--font-data)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted-strong)',
  whiteSpace: 'nowrap',
});

/* -- VALUE BADGE ----------------------------------------- */

const valueBadgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '5px 12px',
  borderRadius: 'var(--radius-sm)',
  font: '700 11px/1 var(--font-data)',
  letterSpacing: '0.08em',
  whiteSpace: 'nowrap',
} as const;

export const valueBadge = styleVariants({
  accent: {
    ...valueBadgeBase,
    background: 'rgba(99, 102, 241, 0.08)',
    color: 'var(--info)',
    border: '1px solid rgba(99, 102, 241, 0.14)',
  },
  success: {
    ...valueBadgeBase,
    background: 'rgba(16, 185, 129, 0.08)',
    color: 'var(--buy)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
  },
  warning: {
    ...valueBadgeBase,
    background: 'rgba(245, 158, 11, 0.08)',
    color: 'var(--hold)',
    border: '1px solid rgba(245, 158, 11, 0.15)',
  },
  danger: {
    ...valueBadgeBase,
    background: 'rgba(239, 68, 68, 0.08)',
    color: 'var(--sell)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
  },
  neutral: {
    ...valueBadgeBase,
    background: 'var(--panel-2)',
    color: 'var(--muted)',
    border: '1px solid var(--line)',
  },
});
