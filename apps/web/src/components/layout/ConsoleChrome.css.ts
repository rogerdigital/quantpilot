import { style } from '@vanilla-extract/css';

/* ── BREAKPOINTS ────────────────────────────────────────── */

const mobile = 'screen and (max-width: 640px)';
const tablet = 'screen and (max-width: 1024px)';

/* ── APP SHELL ──────────────────────────────────────────── */

export const appShell = style({
  position: 'relative',
  isolation: 'isolate',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: '260px 1fr',
  minHeight: '100vh',
  gap: 0,
  padding: 0,
  transition: 'grid-template-columns 0.25s ease',
  '@media': {
    [tablet]: {
      gridTemplateColumns: '1fr',
    },
  },
});

export const appShellCollapsed = style({
  gridTemplateColumns: '60px 1fr',
  '@media': {
    [tablet]: {
      gridTemplateColumns: '1fr',
    },
  },
});

/* ── MAIN PANEL ─────────────────────────────────────────── */

export const mainPanel = style({
  position: 'relative',
  isolation: 'isolate',
  height: '100vh',
  overflowY: 'auto',
  padding: '0 24px 40px',
  maxWidth: 'var(--content-max-width)',
  marginLeft: 'auto',
  marginRight: 'auto',
  '@media': {
    [tablet]: {
      height: 'auto',
      overflowY: 'visible',
    },
    [mobile]: {
      padding: '0 12px 80px',
    },
  },
});

/* ── SIDEBAR ────────────────────────────────────────────── */

export const sidebar = style({
  position: 'sticky',
  top: 0,
  height: '100vh',
  padding: '0 12px 16px',
  borderRight: '1px solid var(--line)',
  background: 'var(--panel)',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  zIndex: 50,
  '@media': {
    [tablet]: {
      display: 'none',
    },
  },
});

export const sidebarCollapsed = style({
  width: '60px',
  padding: '0 10px 16px',
  alignItems: 'center',
  overflow: 'visible',
});

export const sidebarToggle = style({
  marginLeft: 'auto',
  flexShrink: 0,
  width: '24px',
  height: '24px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--line)',
  background: 'var(--panel)',
  color: 'var(--muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: '11px',
  transition: 'border-color 160ms ease, color 160ms ease, background 160ms ease',
  ':hover': {
    borderColor: 'var(--accent)',
    color: 'var(--accent)',
    background: 'var(--panel-2)',
  },
});

export const brand = style({
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
  padding: '10px 4px',
  marginBottom: '12px',
  borderBottom: '1px solid var(--line)',
});

export const brandMark = style({
  width: '24px',
  height: '24px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--accent)',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const brandName = style({
  color: 'var(--text-strong)',
  font: '700 15px/1 var(--font-display)',
  letterSpacing: '0.01em',
});

export const brandSub = style({
  marginTop: '4px',
  fontSize: '11px',
  color: 'var(--muted)',
});

export const sidebarBlock = style({
  marginBottom: '8px',
  padding: '0 4px',
});

export const sidebarLabel = style({
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontSize: '10px',
  fontFamily: 'var(--font-data)',
});

export const navStack = style({
  display: 'grid',
  gap: '1px',
  marginTop: '4px',
  marginBottom: 0,
});

/* ── GLOBAL TOOLBAR ─────────────────────────────────────── */

export const globalToolbar = style({
  position: 'sticky',
  top: 0,
  zIndex: 40,
  overflow: 'visible',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '18px',
  padding: '10px 16px',
  borderBottom: '1px solid var(--line)',
  background: 'var(--panel)',
  backdropFilter: 'blur(8px)',
});

export const toolbarCopy = style({
  display: 'grid',
  gap: '3px',
});

export const toolbarKicker = style({
  color: 'var(--muted)',
  font: '500 10px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

export const toolbarTitle = style({
  font: '700 15px/1 var(--font-data)',
  letterSpacing: '0.01em',
  color: 'var(--text-strong)',
});

export const toolbarSub = style({
  color: 'var(--muted)',
  fontSize: '12px',
  fontFamily: 'var(--font-data)',
  letterSpacing: '0.04em',
});

export const toolbarActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
});

/* ── TOPBAR META ────────────────────────────────────────── */

export const topbarMeta = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(112px, 1fr))',
  gap: '10px',
  minWidth: '360px',
  '@media': {
    [mobile]: {
      gridTemplateColumns: '1fr',
      minWidth: 0,
    },
  },
});

export const metaCard = style({
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--panel)',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: 'var(--shadow-panel)',
  transition: 'border-color 200ms ease, box-shadow 200ms ease',
  padding: '14px 16px',
  ':hover': {
    borderColor: 'var(--line-strong)',
    boxShadow: 'var(--shadow-panel-hover)',
  },
});

export const metaLabel = style({
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontSize: '10px',
  fontFamily: 'var(--font-data)',
});

export const metaValue = style({
  marginTop: '8px',
  font: '700 18px/1 var(--font-data)',
  letterSpacing: '-0.02em',
  color: 'var(--text-strong)',
});

export const metaValueAccent = style({
  color: 'var(--accent)',
});

/* ── MOBILE BOTTOM NAV ──────────────────────────────────── */

export const bottomNav = style({
  display: 'none',
  '@media': {
    [mobile]: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: '56px',
      background: 'var(--panel)',
      borderTop: '1px solid var(--line)',
    },
  },
});

export const bottomNavItem = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
  padding: '6px 12px',
  background: 'transparent',
  border: 'none',
  color: 'var(--muted)',
  fontSize: '10px',
  fontFamily: 'var(--font-data)',
  letterSpacing: '0.06em',
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'color 150ms ease',
  ':hover': {
    color: 'var(--text)',
  },
});

export const bottomNavItemActive = style({
  color: 'var(--accent)',
});
