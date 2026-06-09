import { globalStyle, style } from '@vanilla-extract/css';

/* -- RESULTS BANNER (result-first hero row) ------------- */

export const overviewResultsBanner = style({
  display: 'grid',
  gridTemplateColumns: '1.2fr 1fr',
  gap: '1px',
  background: 'var(--line)',
  marginTop: 0,
  marginBottom: 0,
  padding: 0,
  borderRadius: 0,
  border: 'none',
  boxShadow: 'none',
  position: 'relative',
  overflow: 'hidden',
  '@media': {
    '(max-width: 720px)': { gridTemplateColumns: '1fr' },
  },
});

export const overviewResultsKpi = style({
  display: 'grid',
  gap: '6px',
  padding: '12px 16px',
  border: 'none',
  borderRadius: 0,
  background: 'var(--panel)',
  minHeight: '88px',
  alignContent: 'start',
});

export const overviewResultsKpiDivider = style({
  width: '1px',
  background: 'var(--line)',
  alignSelf: 'stretch',
  margin: '4px 0',
  '@media': {
    '(max-width: 640px)': { display: 'none' },
  },
});

globalStyle(`${overviewResultsKpi} .kpi-label`, {
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
});

globalStyle(`${overviewResultsKpi} .kpi-value`, {
  font: '700 clamp(22px, 2.5vw, 32px)/1 var(--font-data)',
  letterSpacing: '-0.04em',
  color: 'var(--text)',
});

globalStyle(`${overviewResultsKpi} .kpi-sub`, {
  font: '600 11px/1 var(--font-data)',
  color: 'var(--muted-strong)',
  marginTop: '2px',
});

export const overviewResultsHero = style({
  display: 'grid',
  gap: '6px',
  alignContent: 'center',
  padding: '12px 16px',
  background: 'var(--panel)',
});

globalStyle(`${overviewResultsHero} .kpi-value`, {
  font: '700 clamp(40px, 5vw, 64px)/1 var(--font-data)',
  letterSpacing: '-0.04em',
  color: 'var(--text-strong)',
  textShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
});

export const overviewResultsSecondary = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1px',
  background: 'var(--line)',
  alignContent: 'start',
});

export const overviewHeroGrid = style({
  display: 'grid',
  gridTemplateColumns: '1.8fr 0.8fr 0.8fr',
  gap: '1px',
  background: 'var(--line)',
  marginTop: 0,
  '@media': {
    '(max-width: 900px)': { gridTemplateColumns: '1fr' },
  },
});

/* -- OVERVIEW COMMAND CARD ------------------------------ */

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
  letterSpacing: '-0.01em',
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
  background: 'var(--panel-2)',
});

export const overviewPrimaryNote = style([overviewBriefCard]);

export const overviewCommandNote = style({ display: 'grid', gap: '8px' });

globalStyle(`${overviewBriefCard} span, ${overviewCommandNote} span, ${overviewPrimaryNote} span`, {
  color: 'var(--muted)',
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

globalStyle(
  `${overviewBriefCard} strong, ${overviewCommandNote} strong, ${overviewPrimaryNote} strong`,
  {
    font: '700 15px/1.2 var(--font-data)',
    color: 'var(--text)',
  }
);

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

/* -- OVERVIEW STAT -------------------------------------- */

export const overviewStat = style({ display: 'grid', gap: '6px' });

globalStyle(`${overviewStat} span`, {
  color: 'var(--muted)',
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

globalStyle(`${overviewStat} strong`, {
  font: '700 16px/1.1 var(--font-data)',
  letterSpacing: '-0.02em',
});

/* -- OVERVIEW KPI CARD ---------------------------------- */

export const overviewKpiCard = style({
  minHeight: '230px',
  display: 'grid',
  alignContent: 'start',
});

export const overviewKpiTitle = style({
  marginTop: '8px',
  font: '700 18px/1.05 var(--font-display)',
  letterSpacing: '-0.01em',
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

/* -- KPI mini-metric uses monospace data font -- */
globalStyle(`${overviewKpiCard} .mini-metric`, {
  font: '700 22px/1.02 var(--font-data)',
  letterSpacing: '-0.03em',
});

export const overviewKpiNote = style({
  marginTop: '18px',
  paddingTop: '14px',
  borderTop: '1px solid var(--line)',
  margin: 0,
  color: 'var(--muted-strong)',
  fontSize: '13px',
  lineHeight: '1.6',
});

/* -- OVERVIEW DESK GRID --------------------------------- */

export const overviewDeskGrid = style({
  gridTemplateColumns: '1.65fr 0.95fr',
  '@media': {
    '(max-width: 640px)': { gridTemplateColumns: '1fr' },
  },
});
export const overviewPrimaryPanel = style({ minHeight: '468px' });
export const overviewSidePanel = style({ minHeight: '468px' });
export const overviewPanelFlow = style({ display: 'grid', gap: '16px' });

/* -- OVERVIEW INLINE METRICS ---------------------------- */

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
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

globalStyle(`${overviewInlineMetric} strong`, {
  font: '700 14px/1.1 var(--font-data)',
  color: 'var(--text)',
});

/* -- OVERVIEW OPS CLUSTER ------------------------------- */

export const overviewOpsCluster = style({
  display: 'grid',
  gap: '2px',
  padding: '14px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'var(--panel-2)',
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
  ':hover': {
    borderColor: 'var(--line-strong)',
    boxShadow: 'var(--shadow-panel)',
  },
});

/* -- OVERVIEW BLOTTER ----------------------------------- */

export const overviewBlotterGrid = style({ gridTemplateColumns: '1.06fr 0.94fr' });
export const overviewBlotterCard = style({ display: 'grid', gap: '14px' });
export const overviewBlotterList = style({ padding: '6px 14px' });
