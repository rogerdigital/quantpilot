import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

export const summaryCard = style({
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--panel)',
  padding: '16px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  cursor: 'pointer',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  ':hover': {
    borderColor: 'var(--line-strong)',
    boxShadow: 'var(--shadow-panel-hover)',
  },
});

export const summaryCollapsible = style({
  display: 'grid',
  gridTemplateRows: '0fr',
  opacity: 0,
  transition: 'grid-template-rows 200ms ease, opacity 200ms ease, gap 200ms ease',
});

export const summaryCollapsibleOpen = style({
  gridTemplateRows: '1fr',
  opacity: 1,
  marginTop: '10px',
});

export const summaryCollapsibleInner = style({
  overflow: 'hidden',
});

export const summaryExpandToggle = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  border: 'none',
  background: 'transparent',
  color: 'var(--muted)',
  fontFamily: 'var(--font-data)',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  padding: '4px 0',
  transition: 'color 150ms ease',
  ':hover': {
    color: 'var(--accent)',
  },
});

export const summaryExpandCaret = style({
  display: 'inline-block',
  fontSize: '10px',
  transition: 'transform 200ms ease',
});

export const summaryExpandCaretOpen = style({
  transform: 'rotate(180deg)',
});

export const summaryCardHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
});

export const summaryCardTitle = style({
  fontSize: '10px',
  fontFamily: 'var(--font-data)',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'var(--muted)',
});

export const summaryCardTime = style({
  fontSize: '10px',
  fontFamily: 'var(--font-data)',
  color: 'var(--muted)',
});

export const summaryText = style({
  fontSize: '13px',
  fontFamily: 'var(--font-data)',
  color: 'var(--text)',
  lineHeight: 1.6,
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
});

export const summaryCardFooter = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

export const summaryKindChip = styleVariants({
  pre_market: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
    color: 'var(--accent)',
    fontSize: '10px',
    fontFamily: 'var(--font-data)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  intraday_monitor: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    background: 'color-mix(in srgb, var(--accent-2) 10%, transparent)',
    color: 'var(--accent-2)',
    fontSize: '10px',
    fontFamily: 'var(--font-data)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  post_market: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    background: 'color-mix(in srgb, var(--buy) 10%, transparent)',
    color: 'var(--buy)',
    fontSize: '10px',
    fontFamily: 'var(--font-data)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  other: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--panel-3)',
    color: 'var(--muted)',
    fontSize: '10px',
    fontFamily: 'var(--font-data)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
});

export const summaryStatusChip = styleVariants({
  completed: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    background: 'color-mix(in srgb, var(--buy) 8%, transparent)',
    color: 'var(--buy)',
    fontSize: '10px',
    fontFamily: 'var(--font-data)',
    fontWeight: 600,
  },
  running: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
    color: 'var(--accent)',
    fontSize: '10px',
    fontFamily: 'var(--font-data)',
    fontWeight: 600,
  },
  failed: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    background: 'color-mix(in srgb, var(--sell) 8%, transparent)',
    color: 'var(--sell)',
    fontSize: '10px',
    fontFamily: 'var(--font-data)',
    fontWeight: 600,
  },
  queued: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--panel-3)',
    color: 'var(--muted)',
    fontSize: '10px',
    fontFamily: 'var(--font-data)',
    fontWeight: 600,
  },
});

export const summarySkeletonLine = style({
  height: '12px',
  borderRadius: '4px',
  background: 'var(--panel-3)',
  animation: 'pulse 1.5s ease-in-out infinite',
});

globalStyle(`${summaryCard} .cta-arrow`, {
  fontSize: '12px',
  color: 'var(--muted)',
  transition: 'color 150ms ease',
});

globalStyle(`${summaryCard}:hover .cta-arrow`, {
  color: 'var(--accent)',
});
