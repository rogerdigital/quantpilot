import { globalStyle, style } from '@vanilla-extract/css';

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
});

globalStyle(`${appShell}::before`, {
  content: '""',
  position: 'fixed',
  left: 0,
  right: 0,
  top: '-80px',
  height: '80px',
  zIndex: 9998,
  pointerEvents: 'none',
  background:
    'linear-gradient(180deg, transparent 0%, rgba(0, 212, 255, 0.022) 50%, transparent 100%)',
  animation: 'scan-sweep 16s linear infinite',
});

/* ── MAIN PANEL ─────────────────────────────────────────── */

export const mainPanel = style({
  position: 'relative',
  isolation: 'isolate',
  padding: '20px 24px 40px',
  maxWidth: '1480px',
  marginLeft: 'auto',
  marginRight: 'auto',
});

globalStyle(`${mainPanel}::before`, {
  content: '""',
  position: 'absolute',
  inset: 0,
  zIndex: -1,
  pointerEvents: 'none',
  background: 'transparent',
});

/* ── SIDEBAR ────────────────────────────────────────────── */

export const sidebar = style({
  position: 'sticky',
  top: 0,
  alignSelf: 'start',
  minHeight: '100vh',
  padding: '24px 16px',
  borderRight: '1px solid var(--line)',
  background: 'linear-gradient(180deg, rgba(6, 14, 32, 0.99) 0%, rgba(4, 9, 22, 0.99) 100%)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

globalStyle(`${sidebar}::after`, {
  content: '""',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '200%',
  height: '1px',
  background:
    'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.65) 25%, rgba(255, 183, 0, 0.35) 55%, rgba(139, 92, 246, 0.25) 75%, transparent)',
  animation: 'gradient-flow 5s linear infinite',
  pointerEvents: 'none',
});

globalStyle(`${sidebar}::before`, {
  content: '""',
  position: 'absolute',
  bottom: 0,
  right: 0,
  width: '120px',
  height: '120px',
  background: 'radial-gradient(circle at bottom right, rgba(139, 92, 246, 0.06), transparent 70%)',
  pointerEvents: 'none',
});

export const brand = style({
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  marginBottom: '24px',
  paddingBottom: '18px',
  borderBottom: '1px solid var(--line)',
  animation: 'slide-right 400ms ease 100ms both',
});

export const brandMark = style({
  width: '20px',
  height: '20px',
  marginTop: '3px',
  borderRadius: 0,
  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  background:
    'conic-gradient(from 0deg, var(--accent), var(--accent-2), var(--accent-3), var(--accent))',
  boxShadow: 'var(--glow-cyan)',
  animation: 'diamond-spin 10s linear infinite',
  flexShrink: 0,
  transition: 'animation-duration 300ms',
  ':hover': {
    animationDuration: '2s',
  },
});

export const brandName = style({
  color: 'var(--text-strong)',
  font: '700 20px/1 var(--font-data)',
  letterSpacing: '0.02em',
  animation: 'fade-in 500ms ease 200ms both',
});

export const brandSub = style({
  marginTop: '6px',
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'none',
  color: 'var(--muted-strong)',
});

export const sidebarBlock = style({
  marginBottom: '18px',
  padding: '13px 12px 11px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'linear-gradient(135deg, rgba(10, 20, 44, 0.85), rgba(6, 12, 28, 0.9))',
  transition: 'border-color 180ms ease',
  ':hover': {
    borderColor: 'rgba(40, 120, 220, 0.2)',
  },
});

export const sidebarLabel = style({
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  fontSize: '10px',
  fontFamily: 'var(--font-data)',
});

export const navStack = style({
  display: 'grid',
  gap: '2px',
  marginTop: '10px',
  marginBottom: 0,
});

/* ── GLOBAL TOOLBAR ─────────────────────────────────────── */

export const globalToolbar = style({
  position: 'relative',
  zIndex: 40,
  overflow: 'visible',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '18px',
  marginBottom: '22px',
  padding: '10px 16px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  background: 'linear-gradient(135deg, rgba(6, 14, 32, 0.98), rgba(4, 9, 22, 0.99))',
  boxShadow: '0 2px 16px rgba(0, 0, 0, 0.45)',
  animation: 'panel-enter 250ms ease both',
});

globalStyle(`${globalToolbar}::before`, {
  content: '""',
  position: 'absolute',
  top: 0,
  left: '10%',
  width: '80%',
  height: '1px',
  background:
    'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.25), rgba(255, 183, 0, 0.12), transparent)',
  pointerEvents: 'none',
});

export const toolbarCopy = style({
  display: 'grid',
  gap: '3px',
});

export const toolbarKicker = style({
  color: 'var(--muted)',
  font: '500 10px/1 var(--font-data)',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
});

export const toolbarTitle = style({
  font: '700 15px/1 var(--font-data)',
  letterSpacing: '0.01em',
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
});

globalStyle(`${metaCard}::before`, {
  content: '""',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '1px',
  background:
    'linear-gradient(90deg, rgba(0, 212, 255, 0.2), rgba(0, 212, 255, 0.06) 55%, transparent)',
  pointerEvents: 'none',
});

export const metaLabel = style({
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  fontSize: '10px',
  fontFamily: 'var(--font-data)',
});

export const metaValue = style({
  marginTop: '8px',
  font: '700 18px/1 var(--font-data)',
  letterSpacing: '-0.02em',
  animation: 'tick-up 300ms ease 200ms both',
});

export const metaValueAccent = style({
  color: 'var(--accent)',
  textShadow: '0 0 20px rgba(0, 212, 255, 0.25)',
});
