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
  transition: 'border-color 150ms ease',
  ':hover': {
    borderColor: 'rgba(0, 212, 255, 0.25)',
  },
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
    background: 'rgba(0, 212, 255, 0.1)',
    color: 'var(--accent-live)',
    fontSize: '10px',
    fontFamily: 'var(--font-data)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  intraday_monitor: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255, 183, 0, 0.1)',
    color: '#ffb700',
    fontSize: '10px',
    fontFamily: 'var(--font-data)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  post_market: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(0, 232, 157, 0.1)',
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
    background: 'rgba(100, 140, 195, 0.1)',
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
    background: 'rgba(0, 232, 157, 0.08)',
    color: 'var(--buy)',
    fontSize: '10px',
    fontFamily: 'var(--font-data)',
    fontWeight: 600,
  },
  running: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(0, 212, 255, 0.08)',
    color: 'var(--accent-live)',
    fontSize: '10px',
    fontFamily: 'var(--font-data)',
    fontWeight: 600,
  },
  failed: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255, 51, 88, 0.08)',
    color: 'var(--sell)',
    fontSize: '10px',
    fontFamily: 'var(--font-data)',
    fontWeight: 600,
  },
  queued: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(100, 140, 195, 0.08)',
    color: 'var(--muted)',
    fontSize: '10px',
    fontFamily: 'var(--font-data)',
    fontWeight: 600,
  },
});

export const summarySkeletonLine = style({
  height: '12px',
  borderRadius: '4px',
  background: 'rgba(100, 140, 195, 0.1)',
  animation: 'pulse 1.5s ease-in-out infinite',
});

globalStyle(`${summaryCard} .cta-arrow`, {
  fontSize: '12px',
  color: 'var(--muted)',
  transition: 'color 150ms ease',
});

globalStyle(`${summaryCard}:hover .cta-arrow`, {
  color: 'var(--accent-live)',
});
