import { style, globalStyle } from '@vanilla-extract/css';

/* ── OVERVIEW HERO GRID ─────────────────────────────────── */

export const overviewHeroGrid = style({
  display: 'grid',
  gridTemplateColumns: '1.8fr 0.8fr 0.8fr',
  gap: '16px',
  marginTop: '28px',
  '@media': {
    '(max-width: 900px)': { gridTemplateColumns: '1fr' },
  },
});

/* ── OVERVIEW COMMAND CARD ──────────────────────────────── */

export const overviewCommandCard = style({ minHeight: '230px' });

export const overviewCommandFrame = style({ display: 'grid', gap: '18px' });

export const overviewCommandHead = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  alignItems: 'flex-start',
  '@media': {
    '(max-width: 720px)': { flexDirection: 'column', alignItems: 'flex-start' },
  },
});

export const overviewCommandCore = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.45fr) minmax(220px, 0.9fr)',
  gap: '14px',
  alignItems: 'stretch',
  '@media': {
    '(max-width: 720px)': { gridTemplateColumns: '1fr' },
  },
});

export const overviewCommandSummary = style({ display: 'grid', gap: '14px' });

export const overviewCommandTitle = style({
  marginTop: '6px',
  font: '700 24px/1 var(--font-display)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
});

export const overviewCommandCopy = style({
  marginTop: '10px',
  maxWidth: '560px',
  color: 'var(--muted-strong)',
  fontSize: '13px',
  lineHeight: '1.6',
});

export const overviewCommandAside = style({ display: 'grid', gap: '10px' });

export const overviewBriefCard = style({
  display: 'grid',
  gap: '6px',
  padding: '12px 14px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'rgba(10, 20, 44, 0.8)',
});

export const overviewPrimaryNote = style([overviewBriefCard]);

export const overviewCommandNote = style({ display: 'grid', gap: '8px' });

globalStyle(`${overviewBriefCard} span, ${overviewCommandNote} span, ${overviewPrimaryNote} span`, {
  color: 'var(--muted)',
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

globalStyle(`${overviewBriefCard} strong, ${overviewCommandNote} strong, ${overviewPrimaryNote} strong`, {
  font: '700 15px/1.2 var(--font-data)',
  color: 'var(--text)',
});

globalStyle(`${overviewCommandNote} p, ${overviewPrimaryNote} p`, {
  margin: 0,
  color: 'var(--muted-strong)',
  fontSize: '13px',
  lineHeight: '1.6',
});

export const overviewCommandStrip = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '10px',
  marginTop: '18px',
  paddingTop: '16px',
  borderTop: '1px solid var(--line)',
  '@media': {
    '(max-width: 720px)': { gridTemplateColumns: '1fr' },
  },
});

/* ── OVERVIEW STAT ──────────────────────────────────────── */

export const overviewStat = style({ display: 'grid', gap: '6px' });

globalStyle(`${overviewStat} span`, {
  color: 'var(--muted)',
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

globalStyle(`${overviewStat} strong`, {
  font: '700 16px/1.1 var(--font-data)',
  letterSpacing: '-0.02em',
  animation: 'tick-up 280ms ease 300ms both',
});

/* ── OVERVIEW KPI CARD ──────────────────────────────────── */

export const overviewKpiCard = style({ minHeight: '230px' });

export const overviewKpiTitle = style({
  marginTop: '8px',
  font: '700 18px/1.05 var(--font-display)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
});

export const overviewKpiGrid = style({
  display: 'grid',
  gap: '12px',
  marginTop: '18px',
  paddingTop: '14px',
  borderTop: '1px solid var(--line)',
});

globalStyle(`${overviewKpiGrid} div`, {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'center',
});

globalStyle(`${overviewKpiGrid} span`, { color: 'var(--muted)', fontSize: '12px' });
globalStyle(`${overviewKpiGrid} strong`, { font: '700 15px/1 var(--font-data)' });

export const overviewKpiNote = style({
  marginTop: '18px',
  paddingTop: '14px',
  borderTop: '1px solid var(--line)',
  margin: 0,
  color: 'var(--muted-strong)',
  fontSize: '13px',
  lineHeight: '1.6',
});

/* ── OVERVIEW DESK GRID ─────────────────────────────────── */

export const overviewDeskGrid = style({ gridTemplateColumns: '1.65fr 0.95fr' });
export const overviewPrimaryPanel = style({ minHeight: '468px' });
export const overviewSidePanel = style({ minHeight: '468px' });
export const overviewPanelFlow = style({ display: 'grid', gap: '16px' });

/* ── OVERVIEW INLINE METRICS ────────────────────────────── */

export const overviewInlineMetrics = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '10px',
  marginTop: '16px',
  paddingTop: '14px',
  borderTop: '1px solid var(--line)',
  '@media': {
    '(max-width: 720px)': { gridTemplateColumns: '1fr' },
  },
});

export const overviewInlineMetric = style({ display: 'grid', gap: '6px' });

globalStyle(`${overviewInlineMetric} span`, {
  color: 'var(--muted)',
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

globalStyle(`${overviewInlineMetric} strong`, {
  font: '700 14px/1.1 var(--font-data)',
  color: 'var(--text)',
  animation: 'tick-up 260ms ease 280ms both',
});

/* ── OVERVIEW OPS CLUSTER ───────────────────────────────── */

export const overviewOpsCluster = style({
  display: 'grid',
  gap: '2px',
  padding: '14px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'rgba(8, 18, 40, 0.85)',
  transition: 'border-color 180ms ease',
  ':hover': { borderColor: 'rgba(40, 120, 220, 0.2)' },
});

/* ── OVERVIEW BLOTTER ───────────────────────────────────── */

export const overviewBlotterGrid = style({ gridTemplateColumns: '1.06fr 0.94fr' });
export const overviewBlotterCard = style({ display: 'grid', gap: '14px' });
export const overviewBlotterList = style({ padding: '6px 14px' });
