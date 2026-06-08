import { globalStyle } from '@vanilla-extract/css';

/* ============================================================
   APP SHELL — global class for responsive overrides
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

/* ============================================================
   SIDEBAR — clean white panel
   ============================================================ */

globalStyle('.sidebar', {
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
} as any);

globalStyle('.brand', {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
  padding: '10px 4px',
  marginBottom: '12px',
  borderBottom: '1px solid var(--line)',
} as any);

globalStyle('.brand-mark', {
  width: '24px',
  height: '24px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--accent)',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as any);

globalStyle('.brand-name', {
  color: 'var(--text-strong)',
  font: '700 15px/1 var(--font-display)',
  letterSpacing: '0.01em',
} as any);

globalStyle('.brand-sub, .sidebar-label, .eyebrow, .card-eyebrow, .tile-label, .meta-label', {
  color: 'var(--muted-strong)',
} as any);

globalStyle('.panel-copy', {
  color: 'var(--muted)',
} as any);

globalStyle('.brand-sub, .sidebar-label, .eyebrow, .card-eyebrow, .tile-label, .meta-label', {
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontSize: '11px',
  fontFamily: 'var(--font-data)',
} as any);

globalStyle('.brand-sub', {
  marginTop: '4px',
  fontSize: '11px',
  letterSpacing: '0.06em',
  textTransform: 'none',
  color: 'var(--muted)',
} as any);

globalStyle('.sidebar-block', {
  marginBottom: '8px',
  padding: '0 4px',
} as any);

globalStyle('.sidebar-block:hover', {} as any);

globalStyle('.nav-stack', {
  display: 'grid',
  gap: '1px',
  marginTop: '4px',
  marginBottom: 0,
} as any);

globalStyle('.nav-link', {
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  padding: '8px 10px 8px 14px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid transparent',
  color: 'var(--muted)',
  textDecoration: 'none',
  font: '500 13px/1 var(--font-ui)',
  letterSpacing: '0.01em',
  transition: 'color 160ms ease, background 160ms ease, border-color 160ms ease',
} as any);

globalStyle('.nav-link:hover', {
  color: 'var(--text)',
  background: 'var(--panel-2)',
} as any);

globalStyle('.nav-link.active', {
  color: 'var(--accent)',
  borderColor: 'var(--line)',
  background: 'var(--accent-subtle)',
  borderRadius: 'var(--radius)',
} as any);

globalStyle('.nav-link.active::before', {
  content: '""',
  position: 'absolute',
  left: 0,
  top: '4px',
  bottom: '4px',
  width: '3px',
  borderRadius: '0 2px 2px 0',
  background: 'var(--accent)',
} as any);

globalStyle('.nav-tooltip', {
  position: 'absolute',
  left: '100%',
  top: '50%',
  transform: 'translateY(-50%)',
  marginLeft: '8px',
  padding: '6px 10px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--text-strong)',
  color: 'var(--panel)',
  font: '600 12px/1 var(--font-ui)',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  opacity: 0,
  transition: 'opacity 120ms ease',
  zIndex: 1000,
} as any);

globalStyle('.nav-link-icon-only:hover .nav-tooltip', {
  opacity: 1,
} as any);

/* ============================================================
   MAIN PANEL
   ============================================================ */

globalStyle('.main-panel', {
  position: 'relative',
  isolation: 'isolate',
  height: '100vh',
  overflowY: 'auto',
  padding: '0 24px 40px',
  maxWidth: 'var(--content-max-width)',
  marginLeft: 'auto',
  marginRight: 'auto',
} as any);

/* ============================================================
   GLOBAL TOOLBAR — flat white bar
   ============================================================ */

globalStyle('.global-toolbar', {
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
} as any);

globalStyle('.toolbar-copy', { display: 'grid', gap: '3px' } as any);

globalStyle('.toolbar-kicker', {
  color: 'var(--muted)',
  font: '500 11px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
} as any);

globalStyle('.toolbar-title', {
  font: '700 15px/1 var(--font-data)',
  letterSpacing: '0.01em',
  color: 'var(--text-strong)',
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
  background: 'var(--panel)',
  color: 'var(--muted)',
  font: '600 12px/1 var(--font-data)',
  letterSpacing: '0.06em',
} as any);

globalStyle('.toolbar-pill', {
  minHeight: '38px',
  padding: '0 12px',
  gap: '10px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'border-color 160ms ease, color 160ms ease, background 160ms ease',
} as any);

globalStyle('.toolbar-pill-button', {
  cursor: 'pointer',
  justifyContent: 'space-between',
  minWidth: '156px',
  textAlign: 'left',
} as any);

globalStyle('.toolbar-pill-button:hover', {
  borderColor: 'var(--line-strong)',
  background: 'var(--panel-2)',
} as any);

globalStyle('.toolbar-pill-button:active', {
  transform: 'scale(0.97)',
} as any);

globalStyle('.toolbar-pill-button strong', {
  flex: '0 0 auto',
  paddingLeft: '10px',
  borderLeft: '1px solid var(--line)',
  fontSize: '11px',
  letterSpacing: '0.1em',
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
  borderRadius: '50%',
  background: 'currentColor',
  flex: '0 0 auto',
} as any);

globalStyle('.tone-ok', {
  color: 'var(--buy)',
  borderColor: 'rgba(16, 185, 129, 0.2)',
  background: 'rgba(16, 185, 129, 0.06)',
} as any);

globalStyle('.tone-warn', {
  color: 'var(--hold)',
  borderColor: 'rgba(245, 158, 11, 0.2)',
  background: 'rgba(245, 158, 11, 0.06)',
} as any);

globalStyle('.tone-muted', {
  color: 'var(--muted)',
  borderColor: 'var(--line)',
  background: 'var(--panel-2)',
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
  transition: 'border-color 150ms ease',
} as any);

globalStyle('.locale-trigger:hover', {
  borderColor: 'var(--line-strong)',
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
  border: '1px solid var(--line)',
  background: 'var(--panel)',
  boxShadow: 'var(--shadow)',
  animation: 'fade-up 160ms ease both',
} as any);

globalStyle('.locale-option', {
  width: '100%',
  justifyContent: 'space-between',
  minHeight: '38px',
  padding: '0 12px',
  marginTop: '4px',
  background: 'var(--panel)',
  cursor: 'pointer',
  transition: 'border-color 140ms ease, background 140ms ease',
} as any);

globalStyle('.locale-option:first-of-type', {
  marginTop: 0,
} as any);

globalStyle('.locale-option:hover', {
  borderColor: 'var(--line-strong)',
  background: 'var(--panel-2)',
} as any);

globalStyle('.locale-option span', {
  color: 'var(--text)',
  fontWeight: 700,
} as any);

globalStyle('.locale-option small', {
  color: 'var(--muted)',
  fontSize: '11px',
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
  borderColor: 'var(--accent)',
  background: 'var(--panel-2)',
} as any);

/* ============================================================
   TOPBAR / PAGE HEADER — clean card
   ============================================================ */

globalStyle('.topbar', {
  position: 'relative',
  display: 'flex',
  justifyContent: 'space-between',
  gap: '24px',
  alignItems: 'flex-start',
  marginBottom: '20px',
  padding: '24px 24px 20px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--panel)',
  boxShadow: 'var(--shadow-panel)',
  overflow: 'hidden',
} as any);

globalStyle('h1', {
  margin: '6px 0 10px',
  font: '700 clamp(24px, 3.5vw, 36px)/1.1 var(--font-display)',
  letterSpacing: '-0.01em',
  color: 'var(--text-strong)',
} as any);

globalStyle('.topbar-copy', {
  maxWidth: '720px',
  color: 'var(--muted)',
  margin: 0,
  fontSize: '13px',
  lineHeight: '1.65',
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
  marginTop: '16px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'var(--panel-2)',
  padding: '3px',
  gap: '3px',
} as any);

globalStyle('.mode-pill', {
  border: '1px solid transparent',
  background: 'transparent',
  color: 'var(--muted)',
  borderRadius: 'calc(var(--radius) - 1px)',
  padding: '8px 20px',
  cursor: 'pointer',
  font: '600 12px/1 var(--font-data)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  transition: 'border-color 160ms ease, background 160ms ease, color 160ms ease',
  whiteSpace: 'nowrap',
} as any);

globalStyle('.mode-pill:hover', {
  color: 'var(--text)',
  background: 'var(--panel)',
} as any);

globalStyle('.mode-pill:active', {
  transform: 'scale(0.97)',
} as any);

globalStyle('.mode-pill.active', {
  borderColor: 'var(--line)',
  background: 'var(--panel)',
  color: 'var(--text-strong)',
  boxShadow: 'var(--shadow-panel)',
} as any);

/* ============================================================
   ROUTE & POLICY CARDS
   ============================================================ */

globalStyle('.route-card, .policy-card', {
  marginTop: '10px',
  padding: '14px',
  borderRadius: 'var(--radius)',
  background: 'var(--panel-2)',
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
  background: 'rgba(99, 102, 241, 0.06)',
  color: 'var(--info)',
  borderRadius: 'var(--radius-sm)',
} as any);

globalStyle('.route-status.active', {
  background: 'rgba(99, 102, 241, 0.10)',
  color: 'var(--accent)',
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
      position: 'relative',
      width: 'auto',
      height: 'auto',
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

globalStyle(
  `.hero-grid, .overview-hero-grid, .terminal-strip, .metrics-grid, .panel-grid, .panel-grid-3, .panel-grid-wide, .panel-grid-terminal, .panel-grid-terminal-bottom`,
  {
    '@media': {
      '(max-width: 1180px)': {
        gridTemplateColumns: '1fr',
      },
    },
  } as any
);

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
    '(max-width: 1180px)': {
      height: 'auto',
      overflowY: 'visible',
    },
    '(max-width: 720px)': {
      padding: '0 16px 16px',
      overflowX: 'hidden',
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
