import { globalStyle } from '@vanilla-extract/css';

/* ============================================================
   APP SHELL — global class used as plain className string
   (scoped version lives in ConsoleChrome.css.ts, but global
   class is kept for responsive overrides below)
   ============================================================ */

globalStyle('.app-shell', {
  position: 'relative',
  isolation: 'isolate',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: '260px 1fr',
  minHeight: '100vh',
  gap: 0,
  padding: 0,
} as any);

globalStyle('.app-shell::before', {
  content: '""',
  position: 'fixed',
  left: 0,
  right: 0,
  top: '-80px',
  height: '80px',
  zIndex: 9998,
  pointerEvents: 'none',
  background: 'linear-gradient(180deg, transparent 0%, rgba(0, 212, 255, 0.022) 50%, transparent 100%)',
  animation: 'scan-sweep 16s linear infinite',
} as any);

/* ============================================================
   SIDEBAR — global class for responsive overrides
   ============================================================ */

globalStyle('.sidebar', {
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
} as any);

globalStyle('.sidebar::after', {
  content: '""',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '200%',
  height: '1px',
  background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.65) 25%, rgba(255, 183, 0, 0.35) 55%, rgba(139, 92, 246, 0.25) 75%, transparent)',
  animation: 'gradient-flow 5s linear infinite',
  pointerEvents: 'none',
} as any);

globalStyle('.sidebar::before', {
  content: '""',
  position: 'absolute',
  bottom: 0,
  right: 0,
  width: '120px',
  height: '120px',
  background: 'radial-gradient(circle at bottom right, rgba(139, 92, 246, 0.06), transparent 70%)',
  pointerEvents: 'none',
} as any);

globalStyle('.brand', {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  marginBottom: '24px',
  paddingBottom: '18px',
  borderBottom: '1px solid var(--line)',
  animation: 'slide-right 400ms ease 100ms both',
} as any);

globalStyle('.brand-mark', {
  width: '20px',
  height: '20px',
  marginTop: '3px',
  borderRadius: 0,
  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  background: 'conic-gradient(from 0deg, var(--accent), var(--accent-2), var(--accent-3), var(--accent))',
  boxShadow: 'var(--glow-cyan)',
  animation: 'diamond-spin 10s linear infinite',
  flexShrink: 0,
  transition: 'animation-duration 300ms',
} as any);

globalStyle('.brand-mark:hover', {
  animationDuration: '2s',
} as any);

globalStyle('.brand-name', {
  color: 'var(--text-strong)',
  font: '700 20px/1 var(--font-data)',
  letterSpacing: '0.02em',
  animation: 'fade-in 500ms ease 200ms both',
} as any);

globalStyle('.brand-sub, .sidebar-label, .eyebrow, .card-eyebrow, .tile-label, .meta-label, .panel-copy', {
  color: 'var(--muted)',
} as any);

globalStyle('.brand-sub, .sidebar-label, .eyebrow, .card-eyebrow, .tile-label, .meta-label', {
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  fontSize: '10px',
  fontFamily: 'var(--font-data)',
} as any);

globalStyle('.brand-sub', {
  marginTop: '6px',
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'none',
  color: 'var(--muted-strong)',
} as any);

globalStyle('.sidebar-block', {
  marginBottom: '18px',
  padding: '13px 12px 11px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'linear-gradient(135deg, rgba(10, 20, 44, 0.85), rgba(6, 12, 28, 0.9))',
  transition: 'border-color 180ms ease',
} as any);

globalStyle('.sidebar-block:hover', {
  borderColor: 'rgba(40, 120, 220, 0.2)',
} as any);

globalStyle('.nav-stack', {
  display: 'grid',
  gap: '2px',
  marginTop: '10px',
  marginBottom: 0,
} as any);

/* Staggered nav entrance */
globalStyle('.nav-stack .nav-link:nth-child(1)', { animation: 'fade-up 280ms ease 180ms both' } as any);
globalStyle('.nav-stack .nav-link:nth-child(2)', { animation: 'fade-up 280ms ease 220ms both' } as any);
globalStyle('.nav-stack .nav-link:nth-child(3)', { animation: 'fade-up 280ms ease 260ms both' } as any);
globalStyle('.nav-stack .nav-link:nth-child(4)', { animation: 'fade-up 280ms ease 300ms both' } as any);
globalStyle('.nav-stack .nav-link:nth-child(5)', { animation: 'fade-up 280ms ease 340ms both' } as any);
globalStyle('.nav-stack .nav-link:nth-child(6)', { animation: 'fade-up 280ms ease 380ms both' } as any);
globalStyle('.nav-stack .nav-link:nth-child(7)', { animation: 'fade-up 280ms ease 420ms both' } as any);
globalStyle('.nav-stack .nav-link:nth-child(8)', { animation: 'fade-up 280ms ease 460ms both' } as any);
globalStyle('.nav-stack .nav-link:nth-child(9)', { animation: 'fade-up 280ms ease 500ms both' } as any);

globalStyle('.nav-link', {
  display: 'block',
  position: 'relative',
  padding: '11px 12px 11px 15px',
  borderRadius: 'var(--radius)',
  border: '1px solid transparent',
  color: 'var(--muted)',
  textDecoration: 'none',
  font: '500 13px/1 var(--font-ui)',
  letterSpacing: '0.01em',
  transition: 'color 160ms ease',
  overflow: 'hidden',
} as any);

globalStyle('.nav-link::after', {
  content: '""',
  position: 'absolute',
  inset: 0,
  borderRadius: 'var(--radius)',
  background: 'linear-gradient(90deg, rgba(0, 212, 255, 0.08), rgba(0, 212, 255, 0.02))',
  transform: 'translateX(-100%)',
  transition: 'transform 200ms ease',
  pointerEvents: 'none',
} as any);

globalStyle('.nav-link:hover', { color: 'var(--text)' } as any);

globalStyle('.nav-link:hover::after', { transform: 'translateX(0)' } as any);

globalStyle('.nav-link.active', {
  color: 'var(--accent)',
  borderColor: 'rgba(0, 212, 255, 0.16)',
  background: 'rgba(0, 212, 255, 0.055)',
} as any);

globalStyle('.nav-link.active::before', {
  content: '""',
  position: 'absolute',
  left: 0,
  top: '5px',
  bottom: '5px',
  width: '2px',
  borderRadius: '0 2px 2px 0',
  background: 'var(--accent)',
  boxShadow: 'var(--glow-cyan)',
  animation: 'pulse-glow 2.8s ease-in-out infinite',
} as any);

/* ============================================================
   MAIN PANEL — global class for responsive overrides
   ============================================================ */

globalStyle('.main-panel', {
  position: 'relative',
  isolation: 'isolate',
  padding: '20px 24px 40px',
  maxWidth: '1480px',
  marginLeft: 'auto',
  marginRight: 'auto',
} as any);

globalStyle('.main-panel::before', {
  content: '""',
  position: 'absolute',
  inset: 0,
  zIndex: -1,
  pointerEvents: 'none',
  background: 'transparent',
} as any);

/* ============================================================
   GLOBAL TOOLBAR
   ============================================================ */

globalStyle('.global-toolbar', {
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
} as any);

globalStyle('.global-toolbar::before', {
  content: '""',
  position: 'absolute',
  top: 0,
  left: '10%',
  width: '80%',
  height: '1px',
  background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.25), rgba(255, 183, 0, 0.12), transparent)',
  pointerEvents: 'none',
} as any);

globalStyle('.toolbar-copy', { display: 'grid', gap: '3px' } as any);

globalStyle('.toolbar-kicker', {
  color: 'var(--muted)',
  font: '500 10px/1 var(--font-data)',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
} as any);

globalStyle('.toolbar-title', {
  font: '700 15px/1 var(--font-data)',
  letterSpacing: '0.01em',
} as any);

globalStyle('.toolbar-sub', {
  color: 'var(--muted)',
  fontSize: '12px',
  fontFamily: 'var(--font-data)',
  letterSpacing: '0.04em',
} as any);

globalStyle('.toolbar-actions', {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
} as any);

globalStyle('.toolbar-pill, .locale-trigger, .locale-option', {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
  background: 'rgba(7, 15, 34, 0.9)',
  color: 'var(--muted)',
  font: '600 12px/1 var(--font-data)',
  letterSpacing: '0.08em',
} as any);

globalStyle('.toolbar-pill', {
  minHeight: '38px',
  padding: '0 12px',
  gap: '10px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'border-color 160ms ease, box-shadow 160ms ease, color 160ms ease, background 160ms ease',
} as any);

globalStyle('.toolbar-pill::after', {
  content: '""',
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent)',
  transform: 'translateX(-100%)',
  pointerEvents: 'none',
} as any);

globalStyle('.toolbar-pill-button', {
  cursor: 'pointer',
  justifyContent: 'space-between',
  minWidth: '156px',
  textAlign: 'left',
} as any);

globalStyle('.toolbar-pill-button:hover', {
  borderColor: 'rgba(0, 212, 255, 0.28)',
  boxShadow: '0 0 18px rgba(0, 212, 255, 0.1), inset 0 0 18px rgba(0, 212, 255, 0.02)',
  background: 'rgba(0, 212, 255, 0.04)',
} as any);

globalStyle('.toolbar-pill-button:hover::after', {
  animation: 'shimmer-sweep 600ms ease',
} as any);

globalStyle('.toolbar-pill-button strong', {
  flex: '0 0 auto',
  paddingLeft: '10px',
  borderLeft: '1px solid currentColor',
  fontSize: '10px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'inherit',
  opacity: 0.9,
} as any);

globalStyle('.toolbar-pill-main', {
  minWidth: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
} as any);

globalStyle('.toolbar-pill-label', {
  color: 'var(--text)',
  font: '600 12px/1 var(--font-ui)',
  letterSpacing: '0.02em',
} as any);

globalStyle('.status-dot', {
  position: 'relative',
  width: '8px',
  height: '8px',
  borderRadius: 0,
  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  background: 'currentColor',
  boxShadow: '0 0 6px currentColor',
  flex: '0 0 auto',
} as any);

globalStyle('.tone-ok', {
  color: 'var(--buy)',
  borderColor: 'rgba(0, 232, 157, 0.26)',
  background: 'rgba(0, 232, 157, 0.04)',
} as any);

globalStyle('.tone-ok .status-dot', {
  boxShadow: 'var(--glow-green)',
  animation: 'pulse-glow 2s ease-in-out infinite',
} as any);

globalStyle('.tone-warn', {
  color: 'var(--hold)',
  borderColor: 'rgba(255, 183, 0, 0.26)',
  background: 'rgba(255, 183, 0, 0.04)',
} as any);

globalStyle('.tone-warn .status-dot', {
  boxShadow: 'var(--glow-amber)',
  animation: 'pulse-glow 2.5s ease-in-out infinite',
} as any);

globalStyle('.tone-muted', {
  color: 'rgba(100, 140, 195, 0.65)',
  borderColor: 'rgba(0, 212, 255, 0.1)',
  background: 'rgba(0, 212, 255, 0.02)',
} as any);

globalStyle('.tone-muted .status-dot', {
  boxShadow: '0 0 6px rgba(0, 212, 255, 0.3)',
} as any);

/* ============================================================
   LOCALE SWITCHER
   ============================================================ */

globalStyle('.locale-switch-wrap', {
  position: 'relative',
  zIndex: 45,
} as any);

globalStyle('.locale-trigger', {
  minHeight: '34px',
  padding: '0 14px',
  gap: '10px',
  cursor: 'pointer',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
} as any);

globalStyle('.locale-trigger:hover', {
  borderColor: 'rgba(0, 212, 255, 0.22)',
  boxShadow: '0 0 10px rgba(0, 212, 255, 0.08)',
} as any);

globalStyle('.locale-trigger strong', {
  color: 'var(--text)',
  fontWeight: 700,
} as any);

globalStyle('.locale-caret', {
  color: 'var(--muted)',
  fontSize: '12px',
  transition: 'transform 160ms ease',
} as any);

globalStyle('.locale-caret.open', {
  transform: 'rotate(180deg)',
} as any);

globalStyle('.locale-menu', {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  right: 0,
  zIndex: 60,
  minWidth: '168px',
  padding: '6px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line-strong)',
  background: 'rgba(6, 14, 32, 0.98)',
  boxShadow: 'var(--shadow), 0 0 30px rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(12px)',
  animation: 'fade-up 160ms ease both',
} as any);

globalStyle('.locale-option', {
  width: '100%',
  justifyContent: 'space-between',
  minHeight: '38px',
  padding: '0 12px',
  marginTop: '4px',
  background: 'rgba(10, 20, 40, 0.9)',
  cursor: 'pointer',
  transition: 'border-color 140ms ease, background 140ms ease',
} as any);

globalStyle('.locale-option:first-of-type', {
  marginTop: 0,
} as any);

globalStyle('.locale-option:hover', {
  borderColor: 'rgba(0, 212, 255, 0.22)',
  background: 'rgba(0, 212, 255, 0.07)',
} as any);

globalStyle('.locale-option span', {
  color: 'var(--text)',
  fontWeight: 700,
} as any);

globalStyle('.locale-option small', {
  color: 'var(--muted)',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
} as any);

globalStyle('.locale-check', {
  color: 'var(--accent)',
  fontSize: '14px',
  fontWeight: 700,
  letterSpacing: 0,
  textTransform: 'none',
} as any);

globalStyle('.locale-option.active', {
  borderColor: 'rgba(0, 212, 255, 0.28)',
  background: 'rgba(0, 212, 255, 0.08)',
} as any);

/* ============================================================
   TOPBAR / PAGE HEADER
   ============================================================ */

globalStyle('.topbar', {
  position: 'relative',
  display: 'flex',
  justifyContent: 'space-between',
  gap: '24px',
  alignItems: 'flex-start',
  marginBottom: '20px',
  padding: '22px 24px 18px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-xl)',
  background: 'linear-gradient(140deg, rgba(8, 18, 40, 0.97) 0%, rgba(5, 10, 26, 0.98) 60%, rgba(8, 5, 28, 0.97) 100%)',
  boxShadow: 'var(--shadow-panel)',
  animation: 'panel-enter 300ms ease 50ms both',
  overflow: 'hidden',
} as any);

globalStyle('.topbar::before', {
  content: '""',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '200%',
  height: '1px',
  background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.7) 20%, rgba(255, 183, 0, 0.45) 48%, rgba(139, 92, 246, 0.35) 65%, rgba(0, 212, 255, 0.5) 80%, transparent)',
  animation: 'gradient-flow 4s linear infinite',
  pointerEvents: 'none',
} as any);

globalStyle('.topbar::after', {
  content: '""',
  position: 'absolute',
  bottom: '-20px',
  right: '-20px',
  width: '120px',
  height: '120px',
  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.07), transparent 70%)',
  pointerEvents: 'none',
} as any);

globalStyle('h1', {
  margin: '6px 0 10px',
  font: '700 clamp(26px, 4vw, 44px)/0.9 var(--font-display)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: 'var(--text-strong)',
} as any);

globalStyle('.topbar-copy', {
  maxWidth: '720px',
  color: 'var(--muted)',
  margin: 0,
  fontSize: '13px',
  lineHeight: '1.6',
} as any);

globalStyle('.topbar-meta', {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(112px, 1fr))',
  gap: '10px',
  minWidth: '360px',
} as any);

/* ============================================================
   MODE STACK (segmented control)
   ============================================================ */

globalStyle('.mode-stack', {
  display: 'inline-flex',
  marginTop: '14px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'rgba(2, 6, 18, 0.8)',
  padding: '3px',
  gap: '3px',
} as any);

globalStyle('.mode-pill', {
  border: '1px solid transparent',
  background: 'transparent',
  color: 'var(--muted-strong)',
  borderRadius: 'calc(var(--radius) - 1px)',
  padding: '8px 22px',
  cursor: 'pointer',
  font: '600 12px/1 var(--font-data)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  transition: 'border-color 160ms ease, background 160ms ease, color 160ms ease, box-shadow 160ms ease',
  whiteSpace: 'nowrap',
} as any);

globalStyle('.mode-pill:hover', {
  color: 'var(--text)',
  background: 'rgba(0, 212, 255, 0.05)',
} as any);

globalStyle('.mode-pill.active', {
  borderColor: 'rgba(0, 212, 255, 0.28)',
  background: 'rgba(0, 212, 255, 0.1)',
  color: 'var(--text-strong)',
  boxShadow: '0 0 12px rgba(0, 212, 255, 0.12), inset 0 1px 0 rgba(0, 212, 255, 0.1)',
} as any);

/* ============================================================
   ROUTE & POLICY CARDS
   ============================================================ */

globalStyle('.route-card, .policy-card', {
  marginTop: '10px',
  padding: '14px',
  borderRadius: 'var(--radius)',
  background: 'rgba(10, 20, 40, 0.8)',
  border: '1px solid var(--line)',
} as any);

globalStyle('.route-row, .policy-row, .switch-row', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
} as any);

globalStyle('.route-row + .route-row, .policy-row + .policy-row, .switch-row + .switch-row', {
  marginTop: '10px',
} as any);

globalStyle('.route-status, .panel-badge, .signal-chip, .log-tag', {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-sm)',
  font: '700 11px/1 var(--font-data)',
  letterSpacing: '0.08em',
} as any);

globalStyle('.route-status', {
  padding: '6px 10px',
  background: 'rgba(0, 212, 255, 0.08)',
  color: 'var(--info)',
  borderRadius: 'var(--radius-sm)',
} as any);

globalStyle('.route-status.active', {
  background: 'rgba(0, 212, 255, 0.14)',
  color: 'var(--accent)',
  boxShadow: '0 0 8px rgba(0, 212, 255, 0.2)',
} as any);

globalStyle('.route-copy', {
  marginTop: '12px',
  color: 'var(--muted)',
  fontSize: '12px',
} as any);

globalStyle('.switch-row', { marginTop: '10px' } as any);

globalStyle('.switch-row input', {
  accentColor: 'var(--accent)',
  width: '18px',
  height: '18px',
} as any);

/* ============================================================
   RESPONSIVE
   ============================================================ */

globalStyle('@media (max-width: 1180px)', {} as any);

/* VE globalStyle doesn't support @media at top level directly.
   Use the selector-based approach with media queries. */

/* eslint-disable @typescript-eslint/no-explicit-any */
const mediaLarge = '@media (max-width: 1180px)';
const mediaSmall = '@media (max-width: 720px)';

globalStyle(`.app-shell`, {
  '@media': {
    '(max-width: 1180px)': {
      gridTemplateColumns: '1fr',
    },
  },
} as any);

globalStyle(`.sidebar`, {
  '@media': {
    '(max-width: 1180px)': {
      borderRight: 0,
      borderBottom: '1px solid var(--line)',
      minHeight: 'auto',
      position: 'relative',
      top: 0,
    },
    '(max-width: 720px)': {
      padding: '16px',
    },
  },
} as any);

globalStyle(`.global-toolbar, .topbar`, {
  '@media': {
    '(max-width: 1180px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  },
} as any);

globalStyle(`.hero-grid, .overview-hero-grid, .terminal-strip, .metrics-grid, .panel-grid, .panel-grid-wide, .panel-grid-terminal, .panel-grid-terminal-bottom`, {
  '@media': {
    '(max-width: 1180px)': {
      gridTemplateColumns: '1fr',
    },
  },
} as any);

globalStyle(`.toolbar-actions`, {
  '@media': {
    '(max-width: 1180px)': {
      width: '100%',
      justifyContent: 'flex-start',
    },
  },
} as any);

globalStyle(`.topbar-meta`, {
  '@media': {
    '(max-width: 1180px)': {
      minWidth: 0,
    },
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
} as any);

globalStyle(`.main-panel`, {
  '@media': {
    '(max-width: 720px)': {
      padding: '16px',
    },
  },
} as any);

globalStyle(`.hero-foot`, {
  '@media': {
    '(max-width: 720px)': {
      flexDirection: 'column',
    },
  },
} as any);

globalStyle(`.overview-command-core, .overview-command-strip, .overview-inline-metrics`, {
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
} as any);

globalStyle(`.overview-command-head`, {
  '@media': {
    '(max-width: 720px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  },
} as any);

globalStyle(`.focus-row`, {
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
} as any);

globalStyle(`.agent-chat-shell`, {
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
} as any);

globalStyle(`.agent-dual-view`, {
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
} as any);

globalStyle(`.agent-stage-header, .agent-insight-header`, {
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
      display: 'grid',
    },
  },
} as any);

globalStyle(`.agent-pulse-grid`, {
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
} as any);

globalStyle(`.agent-chat-composer-actions`, {
  '@media': {
    '(max-width: 720px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
  },
} as any);

globalStyle(`.log-item`, {
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
} as any);
