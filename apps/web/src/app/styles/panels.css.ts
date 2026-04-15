import { globalStyle } from '@vanilla-extract/css';

/* ============================================================
   CARDS & PANELS — Core surface system
   ============================================================ */

globalStyle('.meta-card, .hero-card, .metric-tile, .panel', {
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--panel)',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: 'var(--shadow-panel)',
  transition: 'border-color 200ms ease, box-shadow 200ms ease',
} as any);

globalStyle('.meta-card::before, .hero-card::before, .metric-tile::before, .panel::before', {
  content: '""',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '1px',
  background:
    'linear-gradient(90deg, rgba(99, 102, 241, 0.22), rgba(99, 102, 241, 0.07) 55%, transparent)',
  pointerEvents: 'none',
} as any);

globalStyle('.panel::after', {
  content: '""',
  position: 'absolute',
  bottom: '7px',
  right: '7px',
  width: '10px',
  height: '10px',
  borderRight: '1px solid rgba(99, 102, 241, 0.14)',
  borderBottom: '1px solid rgba(99, 102, 241, 0.14)',
  pointerEvents: 'none',
  transition: 'border-color 200ms ease',
} as any);

globalStyle('.panel:hover', {
  borderColor: 'rgba(99, 102, 241, 0.22)',
  boxShadow: 'var(--shadow-panel-hover)',
} as any);

globalStyle('.panel:hover::after', {
  borderColor: 'rgba(99, 102, 241, 0.35)',
} as any);

globalStyle('.meta-card', {
  padding: '14px 16px',
} as any);

globalStyle('.meta-value', {
  marginTop: '8px',
  font: '700 18px/1 var(--font-data)',
  letterSpacing: '-0.02em',
  animation: 'tick-up 300ms ease 200ms both',
} as any);

globalStyle('.meta-value.accent', {
  color: 'var(--accent)',
  textShadow: '0 0 20px rgba(99, 102, 241, 0.30)',
} as any);

globalStyle('.panel', {
  padding: '20px',
} as any);

/* ============================================================
   GRID LAYOUTS
   ============================================================ */

globalStyle('.hero-grid', {
  display: 'grid',
  gridTemplateColumns: '1.9fr 1fr 1fr',
  gap: '16px',
  marginTop: '28px',
} as any);

globalStyle('.overview-hero-grid', {
  display: 'grid',
  gridTemplateColumns: '1.8fr 0.8fr 0.8fr',
  gap: '16px',
  marginTop: '28px',
} as any);

globalStyle('.hero-grid.two-up', {
  gridTemplateColumns: '1fr 1fr',
} as any);

/* Staggered entrance for grid children */
globalStyle('.hero-grid > *:nth-child(1), .overview-hero-grid > *:nth-child(1)', {
  animation: 'stagger-enter 360ms ease 80ms both',
} as any);
globalStyle('.hero-grid > *:nth-child(2), .overview-hero-grid > *:nth-child(2)', {
  animation: 'stagger-enter 360ms ease 140ms both',
} as any);
globalStyle('.hero-grid > *:nth-child(3), .overview-hero-grid > *:nth-child(3)', {
  animation: 'stagger-enter 360ms ease 200ms both',
} as any);

globalStyle('.hero-card', {
  padding: '22px 22px 20px',
  minHeight: '120px',
} as any);

globalStyle('.overview-command-card', { minHeight: '230px' } as any);
globalStyle('.overview-command-frame', { display: 'grid', gap: '18px' } as any);

globalStyle('.overview-command-head', {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  alignItems: 'flex-start',
} as any);

globalStyle('.overview-command-core', {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.45fr) minmax(220px, 0.9fr)',
  gap: '14px',
  alignItems: 'stretch',
} as any);

globalStyle('.overview-command-summary', { display: 'grid', gap: '14px' } as any);

globalStyle('.overview-command-title', {
  marginTop: '6px',
  font: '700 24px/1 var(--font-display)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
} as any);

globalStyle('.overview-command-copy', {
  marginTop: '10px',
  maxWidth: '560px',
  color: 'var(--muted-strong)',
  fontSize: '13px',
  lineHeight: '1.65',
} as any);

globalStyle('.overview-command-aside', { display: 'grid', gap: '10px' } as any);

globalStyle('.overview-brief-card, .overview-primary-note', {
  display: 'grid',
  gap: '6px',
  padding: '12px 14px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'rgba(14, 26, 58, 0.85)',
} as any);

globalStyle('.overview-brief-card span, .overview-command-note span, .overview-primary-note span', {
  color: 'var(--muted)',
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
} as any);

globalStyle(
  '.overview-brief-card strong, .overview-command-note strong, .overview-primary-note strong',
  {
    font: '700 15px/1.2 var(--font-data)',
    color: 'var(--text)',
  } as any
);

globalStyle('.overview-command-note', { display: 'grid', gap: '8px' } as any);

globalStyle('.overview-command-note p, .overview-primary-note p, .overview-kpi-note', {
  margin: 0,
  color: 'var(--muted-strong)',
  fontSize: '13px',
  lineHeight: '1.6',
} as any);

globalStyle('.overview-command-strip', {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '10px',
  marginTop: '18px',
  paddingTop: '16px',
  borderTop: '1px solid var(--line)',
} as any);

globalStyle('.overview-stat', { display: 'grid', gap: '6px' } as any);

globalStyle('.overview-stat span', {
  color: 'var(--muted-strong)',
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
} as any);

globalStyle('.overview-stat strong', {
  font: '700 16px/1.1 var(--font-data)',
  letterSpacing: '-0.02em',
  animation: 'tick-up 280ms ease 300ms both',
} as any);

globalStyle('.overview-kpi-card', { minHeight: '230px' } as any);

globalStyle('.overview-kpi-title', {
  marginTop: '8px',
  font: '700 18px/1.05 var(--font-display)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
} as any);

globalStyle('.overview-kpi-grid', {
  display: 'grid',
  gap: '12px',
  marginTop: '18px',
  paddingTop: '14px',
  borderTop: '1px solid var(--line)',
} as any);

globalStyle('.overview-kpi-grid div', {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'center',
} as any);

globalStyle('.overview-kpi-grid span', {
  color: 'var(--muted-strong)',
  fontSize: '12px',
} as any);

globalStyle('.overview-kpi-grid strong', {
  font: '700 15px/1 var(--font-data)',
} as any);

globalStyle('.overview-kpi-note', {
  marginTop: '18px',
  paddingTop: '14px',
  borderTop: '1px solid var(--line)',
} as any);

/* ============================================================
   SHORTCUT & INTERACTIVE SURFACES
   ============================================================ */

globalStyle('.shortcut-surface', {
  display: 'grid',
  alignContent: 'start',
  width: '100%',
  minHeight: '100%',
  textAlign: 'left',
  color: 'inherit',
  cursor: 'pointer',
  transition:
    'border-color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease',
} as any);

globalStyle('.shortcut-surface:hover', {
  borderColor: 'rgba(99, 102, 241, 0.28) !important',
  boxShadow: '0 0 22px rgba(99, 102, 241, 0.12)',
  background: 'rgba(99, 102, 241, 0.05) !important',
  transform: 'translateY(-2px)',
} as any);

globalStyle('.toolbar-pill-button:hover, .status-row-button:hover, .inline-link:hover', {
  borderColor: 'rgba(99, 102, 241, 0.30)',
  color: 'var(--text)',
} as any);

globalStyle('.toolbar-pill-button:hover, .shortcut-surface:hover', {
  boxShadow: '0 0 20px rgba(99, 102, 241, 0.12)',
} as any);

globalStyle('.status-row-button:hover, .inline-link:hover', {
  background: 'rgba(99, 102, 241, 0.04)',
} as any);

globalStyle(
  '.shortcut-surface:focus-visible, .toolbar-pill-button:focus-visible, .status-row-button:focus-visible, .inline-link:focus-visible, .locale-trigger:focus-visible, .locale-option:focus-visible, .mode-pill:focus-visible',
  {
    outline: '2px solid rgba(99, 102, 241, 0.65)',
    outlineOffset: '2px',
  } as any
);

/* ============================================================
   HERO CARD — Primary command center
   ============================================================ */

globalStyle('.hero-card-primary', {
  background: [
    'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, transparent 45%)',
    'linear-gradient(220deg, rgba(139, 92, 246, 0.06) 0%, transparent 60%)',
    'var(--panel)',
  ].join(', '),
} as any);

globalStyle('.hero-card-primary::after', {
  content: '""',
  position: 'absolute',
  bottom: '-30%',
  right: '-10%',
  width: '200px',
  height: '200px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(99, 102, 241, 0.14), transparent 60%)',
  pointerEvents: 'none',
  filter: 'blur(16px)',
  opacity: 0.7,
  animation: 'float 7s ease-in-out infinite',
} as any);

globalStyle('.hero-headline', {
  display: 'flex',
  alignItems: 'baseline',
  gap: '16px',
} as any);

globalStyle('.hero-value', {
  font: '700 clamp(30px, 5vw, 52px)/0.88 var(--font-data)',
  letterSpacing: '-0.04em',
  textShadow: '0 0 36px rgba(99, 102, 241, 0.28)',
  animation: 'tick-up 320ms ease 150ms both',
} as any);

globalStyle('.hero-change', {
  font: '700 18px/1 var(--font-data)',
} as any);

globalStyle('.hero-foot', {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  marginTop: '18px',
  color: 'var(--muted)',
} as any);

globalStyle('.mini-metric', {
  marginTop: '14px',
  font: '700 22px/1.02 var(--font-data)',
  letterSpacing: '-0.03em',
  animation: 'tick-up 280ms ease 200ms both',
} as any);

globalStyle('.mini-copy', {
  marginTop: '10px',
  color: 'var(--muted-strong)',
  fontSize: '13px',
  lineHeight: '1.6',
} as any);

/* ============================================================
   METRICS GRID
   ============================================================ */

globalStyle('.metrics-grid', {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '14px',
  marginTop: '18px',
} as any);

globalStyle('.metrics-grid > *:nth-child(1)', {
  animation: 'stagger-enter 320ms ease 60ms both',
} as any);
globalStyle('.metrics-grid > *:nth-child(2)', {
  animation: 'stagger-enter 320ms ease 100ms both',
} as any);
globalStyle('.metrics-grid > *:nth-child(3)', {
  animation: 'stagger-enter 320ms ease 140ms both',
} as any);
globalStyle('.metrics-grid > *:nth-child(4)', {
  animation: 'stagger-enter 320ms ease 180ms both',
} as any);

globalStyle('.metrics-grid-compact', {
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
} as any);

globalStyle('.metric-card', {
  padding: '14px 16px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'linear-gradient(140deg, rgba(14, 28, 56, 0.95), rgba(8, 16, 36, 0.98))',
  display: 'grid',
  gap: '8px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 160ms ease',
} as any);

globalStyle('.metric-card::before', {
  content: '""',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '55%',
  height: '1px',
  background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.30), transparent)',
} as any);

globalStyle('.metric-card:hover', {
  borderColor: 'rgba(99, 102, 241, 0.28)',
  boxShadow: '0 0 20px rgba(99, 102, 241, 0.09)',
  transform: 'translateY(-2px)',
} as any);

globalStyle('.metric-card span', {
  color: 'var(--muted-strong)',
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
} as any);

globalStyle('.metric-card strong', {
  font: '700 22px/1 var(--font-data)',
  letterSpacing: '-0.02em',
  animation: 'tick-up 280ms ease 220ms both',
} as any);

/* ============================================================
   TERMINAL STRIP
   ============================================================ */

globalStyle('.terminal-strip', {
  display: 'grid',
  gridTemplateColumns: '1.3fr repeat(4, minmax(0, 1fr))',
  gap: '14px',
  marginTop: '24px',
} as any);

globalStyle('.terminal-tile', {
  padding: '16px 18px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'var(--panel)',
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
} as any);

globalStyle('.terminal-tile:hover', {
  borderColor: 'rgba(99, 102, 241, 0.22)',
  boxShadow: '0 0 16px rgba(99, 102, 241, 0.07)',
} as any);

globalStyle('.terminal-tile-primary', {
  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.07), transparent 36%), var(--panel)',
} as any);

globalStyle('.metric-tile', {
  padding: '18px 18px 16px',
} as any);

globalStyle('.tile-value', {
  marginTop: '12px',
  font: '700 28px/1 var(--font-data)',
  letterSpacing: '-0.03em',
  animation: 'tick-up 280ms ease 250ms both',
} as any);

globalStyle('.tile-value-compact', { fontSize: '22px' } as any);

globalStyle('.tile-move', {
  marginTop: '8px',
  font: '700 16px/1 var(--font-data)',
} as any);

globalStyle('.tile-sub', {
  marginTop: '8px',
  color: 'var(--muted)',
  fontSize: '13px',
} as any);

/* ============================================================
   PANEL GRID
   ============================================================ */

globalStyle('.panel-grid', {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '16px',
  marginTop: '28px',
  alignItems: 'start',
} as any);

globalStyle('.panel-grid > *:nth-child(1)', {
  animation: 'stagger-enter 360ms ease 80ms both',
} as any);
globalStyle('.panel-grid > *:nth-child(2)', {
  animation: 'stagger-enter 360ms ease 130ms both',
} as any);
globalStyle('.panel-grid > *:nth-child(3)', {
  animation: 'stagger-enter 360ms ease 180ms both',
} as any);
globalStyle('.panel-grid > *:nth-child(4)', {
  animation: 'stagger-enter 360ms ease 230ms both',
} as any);

globalStyle('.panel-grid-wide', {
  alignItems: 'start',
  gridTemplateColumns: '1.4fr 1fr',
} as any);

globalStyle('.panel-grid-wide > *', { minWidth: 0 } as any);

globalStyle('.panel-grid-wide > .panel:only-child', {
  gridColumn: '1 / -1',
} as any);

globalStyle('.panel-grid-terminal', {
  gridTemplateColumns: '1.7fr 0.9fr',
} as any);

globalStyle('.panel-grid-terminal-bottom', {
  gridTemplateColumns: '1.1fr 0.9fr',
} as any);

/* ============================================================
   PANEL BODY — fixed-height scrollable content zones
   ============================================================ */

globalStyle('.panel-body', {
  overflowY: 'auto',
  width: '100%',
} as any);

globalStyle('.panel-body-sm', { height: '220px' } as any);
globalStyle('.panel-body-md', { height: '360px' } as any);
globalStyle('.panel-body-lg', { height: '520px' } as any);

/* ============================================================
   EMPTY STATE
   ============================================================ */

globalStyle('.empty-state', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  padding: '40px 24px',
  textAlign: 'center',
  height: '100%',
  minHeight: '160px',
  color: 'var(--muted)',
} as any);

globalStyle('.empty-state-icon', {
  fontSize: '28px',
  opacity: 0.45,
  lineHeight: 1,
} as any);

globalStyle('.empty-state-message', {
  font: '600 13px/1.4 var(--font-ui)',
  color: 'var(--muted)',
  letterSpacing: '0.01em',
} as any);

globalStyle('.empty-state-detail', {
  font: '400 12px/1.5 var(--font-ui)',
  color: 'var(--muted)',
  opacity: 0.7,
  maxWidth: '260px',
} as any);

/* ============================================================
   TAB PANEL
   ============================================================ */

globalStyle('.tab-panel', {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
} as any);

globalStyle('.tab-panel-bar', {
  display: 'flex',
  gap: 0,
  borderBottom: '1px solid var(--line)',
  marginBottom: 0,
  flexShrink: 0,
} as any);

globalStyle('.tab-panel-tab', {
  padding: '10px 18px',
  font: '600 11px/1 var(--font-ui)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  cursor: 'pointer',
  transition: 'color 160ms ease, border-color 160ms ease',
  whiteSpace: 'nowrap',
  marginBottom: '-1px',
} as any);

globalStyle('.tab-panel-tab:hover', { color: 'var(--text)' } as any);

globalStyle('.tab-panel-tab.active', {
  color: 'var(--accent)',
  borderBottomColor: 'var(--accent)',
} as any);

globalStyle('.tab-panel-content', {
  flex: 1,
  minHeight: 0,
} as any);

/* ============================================================
   OVERVIEW DESK GRID
   ============================================================ */

globalStyle('.overview-desk-grid', {
  gridTemplateColumns: '1.65fr 0.95fr',
} as any);

globalStyle('.overview-primary-panel', { minHeight: '468px' } as any);
globalStyle('.overview-side-panel', { minHeight: '468px' } as any);
globalStyle('.overview-panel-flow', { display: 'grid', gap: '16px' } as any);

globalStyle('.overview-inline-metrics', {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '10px',
  marginTop: '16px',
  paddingTop: '14px',
  borderTop: '1px solid var(--line)',
} as any);

globalStyle('.overview-inline-metric', { display: 'grid', gap: '6px' } as any);

globalStyle('.overview-inline-metric span', {
  color: 'var(--muted-strong)',
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
} as any);

globalStyle('.overview-inline-metric strong', {
  font: '700 14px/1.1 var(--font-data)',
  color: 'var(--text)',
  animation: 'tick-up 260ms ease 280ms both',
} as any);

globalStyle('.overview-ops-cluster', {
  display: 'grid',
  gap: '2px',
  padding: '14px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'rgba(10, 22, 50, 0.9)',
  transition: 'border-color 180ms ease',
} as any);

globalStyle('.overview-ops-cluster:hover', {
  borderColor: 'rgba(99, 102, 241, 0.2)',
} as any);

globalStyle('.overview-blotter-grid', { gridTemplateColumns: '1.06fr 0.94fr' } as any);
globalStyle('.overview-blotter-card', { display: 'grid', gap: '14px' } as any);
globalStyle('.overview-blotter-list', { padding: '6px 14px' } as any);

/* ============================================================
   STATUS STACK & ROWS
   ============================================================ */

globalStyle('.status-stack', {
  display: 'grid',
  gap: '10px',
  paddingTop: '4px',
} as any);

globalStyle('.status-row', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 0',
  borderBottom: '1px solid var(--line)',
  transition: 'border-bottom-color 140ms ease',
} as any);

globalStyle('.status-row:hover', {
  borderBottomColor: 'rgba(99, 102, 241, 0.2)',
} as any);

globalStyle('.status-row-button, .inline-link', {
  width: '100%',
  border: 0,
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
} as any);

globalStyle('.status-row-button', {
  padding: '10px 0',
  transition: 'color 140ms ease',
} as any);

globalStyle('.inline-link', {
  marginTop: '8px',
  padding: 0,
  textAlign: 'left',
  color: 'var(--muted)',
  transition: 'color 140ms ease',
} as any);

globalStyle('.status-copy', {
  color: 'var(--muted-strong)',
  fontSize: '13px',
  lineHeight: '1.6',
} as any);

/* ============================================================
   FOCUS LIST
   ============================================================ */

globalStyle('.focus-list', {
  display: 'grid',
  gap: '8px',
} as any);

globalStyle('.focus-list-terminal', {
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'rgba(4, 8, 22, 0.75)',
  padding: '4px 14px',
} as any);
