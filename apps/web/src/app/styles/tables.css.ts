import { globalStyle } from '@vanilla-extract/css';

/* ============================================================
   FOCUS ROWS
   ============================================================ */

globalStyle('.focus-row', {
  position: 'relative',
  isolation: 'isolate',
  display: 'grid',
  gridTemplateColumns: 'minmax(120px, 1.2fr) minmax(90px, 0.9fr) minmax(84px, 0.7fr) auto',
  gap: '12px',
  alignItems: 'start',
  padding: '12px 16px 12px 18px',
  border: 'none',
  borderBottom: '1px solid var(--line)',
  borderRadius: 0,
  background: 'var(--panel)',
  overflow: 'clip',
  transition: 'background 180ms ease',
} as any);

globalStyle('.focus-row::before', {
  content: '""',
  position: 'absolute',
  inset: '0 auto 0 0',
  width: '3px',
  borderRadius: '0 2px 2px 0',
  background: 'var(--accent)',
  opacity: 0.2,
  transition: 'opacity 180ms ease',
} as any);

globalStyle('.focus-row:hover', {
  background: 'var(--panel)',
} as any);

globalStyle('.focus-row:hover::before', { opacity: 0.8 } as any);

globalStyle('.focus-row:last-child', { marginBottom: 0 } as any);

globalStyle('.focus-row-wide', {
  gridTemplateColumns: 'minmax(180px, 1.5fr) repeat(4, minmax(84px, 0.8fr))',
} as any);

globalStyle('.focus-main-button', {
  width: '100%',
  border: 0,
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  padding: 0,
} as any);

globalStyle('.focus-metric', {
  display: 'grid',
  gap: '2px',
  fontSize: '12px',
  color: 'var(--muted)',
} as any);

globalStyle('.focus-metric strong, .focus-metric span:first-child', {
  color: 'var(--text)',
  fontFamily: 'var(--font-data)',
} as any);

/* ============================================================
   INSPECTION PANELS
   ============================================================ */

globalStyle('.inspection-actions', {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '6px',
} as any);

globalStyle('.panel-head', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px',
  marginBottom: '16px',
} as any);

globalStyle('.panel-subtitle', {
  marginTop: '18px',
  marginBottom: '10px',
  color: 'var(--muted)',
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
} as any);

globalStyle('.inspection-json', {
  margin: 0,
  padding: '14px 16px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'var(--panel)',
  color: 'var(--muted)',
  font: '12px/1.6 var(--font-data)',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
} as any);

globalStyle('.panel-title', {
  font: '600 16px/1.3 var(--font-display)',
  color: 'var(--text-strong)',
} as any);

globalStyle('.panel-badge', {
  padding: '6px 11px',
  background: 'rgba(99, 102, 241, 0.06)',
  color: 'var(--accent)',
  border: '1px solid rgba(99, 102, 241, 0.12)',
  borderRadius: 'var(--radius-sm)',
} as any);

globalStyle('.panel-badge.accent', {
  background: 'rgba(99, 102, 241, 0.08)',
  color: 'var(--info)',
  borderColor: 'rgba(99, 102, 241, 0.14)',
} as any);

globalStyle('.panel-badge.muted', {
  background: 'var(--panel)',
  color: 'var(--muted)',
  borderColor: 'var(--line)',
} as any);

globalStyle('.badge-info', {
  background: 'rgba(99, 102, 241, 0.08)',
  color: 'var(--info)',
  borderColor: 'rgba(99, 102, 241, 0.14)',
} as any);

globalStyle('.badge-ok, .badge-success', {
  background: 'rgba(16, 185, 129, 0.08)',
  color: 'var(--buy)',
  borderColor: 'rgba(16, 185, 129, 0.15)',
} as any);

globalStyle('.badge-warn', {
  background: 'rgba(245, 158, 11, 0.08)',
  color: 'var(--hold)',
  borderColor: 'rgba(245, 158, 11, 0.15)',
} as any);

globalStyle('.badge-danger', {
  background: 'rgba(239, 68, 68, 0.08)',
  color: 'var(--sell)',
  borderColor: 'rgba(239, 68, 68, 0.15)',
} as any);

globalStyle('.badge-muted', {
  background: 'var(--panel)',
  color: 'var(--muted)',
  borderColor: 'var(--line)',
} as any);

/* ============================================================
   TABLES — clean minimal design
   ============================================================ */

globalStyle('.table-wrap', {
  position: 'relative',
  overflowX: 'auto',
  border: 'none',
  borderRadius: 0,
  background: 'var(--panel)',
  maxWidth: '100%',
  minWidth: 0,
} as any);

globalStyle('.table-wrap table', {
  width: '100%',
  borderCollapse: 'collapse',
} as any);

globalStyle('th, td', {
  padding: '12px 14px',
  borderBottom: '1px solid var(--line)',
  textAlign: 'left',
  whiteSpace: 'nowrap',
} as any);

globalStyle('th', {
  font: '600 11px/1 var(--font-ui)',
  color: 'var(--muted-strong)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  background: 'var(--panel)',
  borderBottomColor: 'var(--line)',
  position: 'sticky',
  top: 0,
  zIndex: 1,
} as any);

globalStyle('td', {
  fontSize: '13px',
  fontFamily: 'var(--font-data)',
  color: 'var(--text)',
} as any);

globalStyle('.td-numeric', {
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
} as any);

globalStyle('.table-wrap tr:nth-child(even) td', {
  background: 'rgba(34, 38, 58, 0.3)',
} as any);

globalStyle('.table-row-hover', {
  transition: 'background 140ms ease',
} as any);

globalStyle('.table-row-hover:hover, .table-row-hover:focus-within', {
  background: 'var(--panel)',
} as any);

globalStyle('.table-row-hover:hover td, .table-row-hover:focus-within td', {
  borderBottomColor: 'var(--line-strong)',
} as any);

globalStyle('.table-row-hover:hover td:first-child, .table-row-hover:focus-within td:first-child', {
  boxShadow: 'inset 3px 0 0 var(--accent)',
} as any);

globalStyle('.symbol-cell', {
  display: 'grid',
  gap: '2px',
} as any);

globalStyle('.symbol-cell span', {
  color: 'var(--muted)',
  fontSize: '12px',
  lineHeight: '1.5',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
} as any);

globalStyle('.table-note', {
  color: 'var(--muted)',
  fontSize: '12px',
} as any);

/* ============================================================
   INLINE ACTIONS
   ============================================================ */

globalStyle('.inline-action', {
  position: 'relative',
  overflow: 'hidden',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  background: 'rgba(239, 68, 68, 0.06)',
  color: 'var(--sell)',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 12px',
  cursor: 'pointer',
  font: '600 11px/1 var(--font-ui)',
  letterSpacing: '0.02em',
  transition: 'border-color 140ms ease, background 140ms ease, transform 120ms ease',
} as any);

globalStyle('.inline-action:hover', {
  background: 'rgba(239, 68, 68, 0.10)',
  borderColor: 'rgba(239, 68, 68, 0.35)',
  transform: 'translateY(-1px)',
} as any);

globalStyle('.inline-action:active', {
  transform: 'translateY(0) scale(0.97)',
} as any);

globalStyle(
  '.inline-action:disabled, .settings-button:disabled, .settings-inline-button:disabled, .settings-chip:disabled, .mode-pill:disabled',
  {
    cursor: 'not-allowed',
    opacity: 0.45,
    transform: 'none !important',
  } as any
);

globalStyle('.inline-action-approve', {
  borderColor: 'rgba(16, 185, 129, 0.2)',
  background: 'rgba(16, 185, 129, 0.06)',
  color: 'var(--buy)',
} as any);

globalStyle('.inline-action-approve:hover', {
  background: 'rgba(16, 185, 129, 0.10)',
  borderColor: 'rgba(16, 185, 129, 0.35)',
} as any);

globalStyle('.action-group', {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
} as any);

/* ============================================================
   LOG LIST
   ============================================================ */

globalStyle('.log-list', {
  display: 'grid',
  gap: '10px',
} as any);

globalStyle('.log-item', {
  position: 'relative',
  alignItems: 'start',
  display: 'grid',
  gridTemplateColumns: '74px 1fr auto',
  gap: '12px',
  padding: '12px 16px 12px 18px',
  border: 'none',
  borderBottom: '1px solid var(--line)',
  borderRadius: 0,
  background: 'var(--panel)',
  overflow: 'hidden',
  transition: 'background 180ms ease',
} as any);

globalStyle('.log-item::before', {
  content: '""',
  position: 'absolute',
  inset: '0 auto 0 0',
  width: '3px',
  borderRadius: '0 2px 2px 0',
  background: 'var(--accent)',
  opacity: 0.2,
  transition: 'opacity 180ms ease',
} as any);

globalStyle('.log-item:hover', {
  background: 'var(--panel)',
} as any);

globalStyle('.log-item:hover::before', { opacity: 0.8 } as any);

globalStyle('.log-item:last-child', { marginBottom: 0 } as any);

globalStyle('.log-time', {
  color: 'var(--muted)',
  font: '600 11px/1.2 var(--font-data)',
} as any);

globalStyle('.log-title', {
  fontWeight: 600,
  color: 'var(--text)',
} as any);

globalStyle('.log-copy', {
  marginTop: '4px',
  color: 'var(--muted)',
  fontSize: '12px',
  lineHeight: '1.6',
} as any);

globalStyle('.log-tag', {
  padding: '5px 9px',
  alignSelf: 'start',
  borderRadius: 'var(--radius-sm)',
} as any);

globalStyle('.log-tag.buy', {
  background: 'rgba(16, 185, 129, 0.08)',
  color: 'var(--buy)',
  border: '1px solid rgba(16, 185, 129, 0.15)',
} as any);

globalStyle('.log-tag.sell', {
  background: 'rgba(239, 68, 68, 0.08)',
  color: 'var(--sell)',
  border: '1px solid rgba(239, 68, 68, 0.15)',
} as any);

globalStyle('.log-tag.info', {
  background: 'rgba(99, 102, 241, 0.08)',
  color: 'var(--info)',
  border: '1px solid rgba(99, 102, 241, 0.12)',
} as any);

/* ============================================================
   CANVAS
   ============================================================ */

globalStyle('canvas', {
  display: 'block',
  width: '100% !important',
  borderRadius: 'var(--radius)',
} as any);
