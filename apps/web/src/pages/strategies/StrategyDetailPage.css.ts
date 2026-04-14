import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

export const detailHeader = style({
  marginBottom: '20px',
  padding: '20px 24px 18px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-xl)',
  background:
    'linear-gradient(140deg, rgba(8, 18, 40, 0.97) 0%, rgba(5, 10, 26, 0.98) 60%, rgba(8, 5, 28, 0.97) 100%)',
  boxShadow: 'var(--shadow-panel)',
});

export const detailBackRow = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '14px',
  padding: '6px 12px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
  background: 'rgba(0, 212, 255, 0.04)',
  color: 'var(--muted)',
  fontSize: '12px',
  fontFamily: 'var(--font-data)',
  letterSpacing: '0.04em',
  cursor: 'pointer',
  transition: 'border-color 160ms ease, color 160ms ease',
  ':hover': {
    borderColor: 'var(--accent-live)',
    color: 'var(--accent-live)',
  },
});

export const detailHeaderMeta = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '16px',
  flexWrap: 'wrap',
});

export const detailHeaderActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexShrink: 0,
  paddingTop: '6px',
});

export const detailStageBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 14px',
  borderRadius: 'var(--radius)',
  border: '1px solid',
  fontSize: '11px',
  fontFamily: 'var(--font-data)',
  fontWeight: 700,
  letterSpacing: '0.1em',
});

export const detailStageBadgeVariants = styleVariants({
  live: {
    color: 'var(--buy)',
    borderColor: 'rgba(0, 232, 157, 0.4)',
    background: 'rgba(0, 232, 157, 0.08)',
  },
  paper: {
    color: 'var(--accent-live)',
    borderColor: 'rgba(0, 212, 255, 0.4)',
    background: 'rgba(0, 212, 255, 0.08)',
  },
  candidate: {
    color: 'var(--accent-2)',
    borderColor: 'rgba(255, 183, 0, 0.4)',
    background: 'rgba(255, 183, 0, 0.08)',
  },
  researching: {
    color: 'var(--accent-3)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    background: 'rgba(139, 92, 246, 0.08)',
  },
  draft: {
    color: 'var(--muted)',
    borderColor: 'var(--line)',
    background: 'rgba(0, 212, 255, 0.02)',
  },
});

export const detailMetricsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '12px',
  marginBottom: '20px',
  '@media': {
    '(max-width: 1180px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const detailMetricCard = style({
  padding: '20px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--panel)',
  boxShadow: 'var(--shadow-panel)',
  transition: 'border-color 200ms ease, box-shadow 200ms ease',
  ':hover': {
    borderColor: 'var(--line-strong)',
    boxShadow: 'var(--shadow-panel-hover)',
  },
});

export const detailMetricLabel = style({
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  fontSize: '10px',
  fontFamily: 'var(--font-data)',
  marginBottom: '10px',
});

export const detailMetricValue = style({
  fontFamily: 'var(--font-data)',
  fontSize: '28px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: 1,
  color: 'var(--text-strong)',
});

export const detailChartPanel = style({
  padding: '20px 24px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--panel)',
  boxShadow: 'var(--shadow-panel)',
  marginBottom: '20px',
});

export const detailPanelHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '16px',
});

export const detailGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  '@media': {
    '(max-width: 1180px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const detailPanel = style({
  padding: '20px 24px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--panel)',
  boxShadow: 'var(--shadow-panel)',
});

export const detailKvTable = style({
  display: 'grid',
  gap: '10px',
});

export const detailKvRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  padding: '8px 0',
  borderBottom: '1px solid var(--line)',
  ':last-child': {
    borderBottom: 'none',
  },
  selectors: {
    '&:last-child': {
      borderBottom: 'none',
    },
  },
});

globalStyle(`${detailKvRow} span`, {
  color: 'var(--muted)',
  fontSize: '12px',
  fontFamily: 'var(--font-data)',
  letterSpacing: '0.04em',
  flexShrink: 0,
});

globalStyle(`${detailKvRow} strong`, {
  color: 'var(--text-strong)',
  fontSize: '13px',
  fontFamily: 'var(--font-data)',
  fontWeight: 600,
  wordBreak: 'break-word',
});

export const detailRunTable = style({
  display: 'grid',
  gap: '8px',
});

export const detailRunRow = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto auto',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 12px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
  background: 'rgba(0, 212, 255, 0.02)',
  transition: 'border-color 160ms ease, background 160ms ease',
  ':hover': {
    borderColor: 'var(--line-strong)',
    background: 'rgba(0, 212, 255, 0.04)',
  },
});
