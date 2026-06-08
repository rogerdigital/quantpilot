import { style } from '@vanilla-extract/css';

/* -- PANEL HEADER (full) --------------------------------- */

export const panelHeaderWrap = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px',
  marginBottom: '16px',
});

export const panelHeaderContent = style({
  display: 'grid',
  gap: '6px',
  minWidth: 0,
});

export const panelHeaderTitle = style({
  font: '600 16px/1.3 var(--font-display)',
  color: 'var(--text-strong)',
});

export const panelHeaderDescription = style({
  color: 'var(--muted-strong)',
  fontSize: '13px',
  lineHeight: '1.6',
  maxWidth: '560px',
});

/* -- PANEL HEADER COMPACT -------------------------------- */

export const panelHeaderCompact = style({
  fontSize: '11px',
  fontFamily: 'var(--font-data)',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'var(--muted-strong)',
  paddingBottom: '12px',
  borderBottom: '1px solid var(--line)',
  marginBottom: '16px',
});
