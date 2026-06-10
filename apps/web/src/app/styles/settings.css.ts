import { globalStyle } from '@vanilla-extract/css';

/* ============================================================
   SETTINGS FORMS
   ============================================================ */

globalStyle('.settings-form-grid', {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 'var(--space-3)',
  marginTop: '16px',
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
} as any);

globalStyle('.settings-field', {
  display: 'grid',
  gap: '6px',
} as any);

globalStyle('.settings-field span', {
  color: 'var(--muted)',
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
} as any);

globalStyle('.settings-field input, .settings-field select', {
  width: '100%',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'var(--panel)',
  color: 'var(--text)',
  padding: '10px 12px',
  font: '14px var(--font-data)',
  outline: 'none',
  transition: 'border-color 150ms ease, box-shadow 150ms ease, background 150ms ease',
} as any);

globalStyle('.settings-field input:focus, .settings-field select:focus', {
  borderColor: 'var(--accent)',
  boxShadow: '0 0 0 3px var(--accent-subtle)',
  background: 'var(--panel)',
} as any);

globalStyle('.settings-field-wide', {
  gridColumn: '1 / -1',
} as any);

globalStyle('.field-label', {
  display: 'block',
  marginTop: '16px',
  marginBottom: '8px',
  color: 'var(--muted)',
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
} as any);

globalStyle('.text-input, .detail-textarea', {
  width: '100%',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'var(--panel)',
  color: 'var(--text)',
  padding: '10px 12px',
  font: '14px var(--font-data)',
  outline: 'none',
  transition: 'border-color 150ms ease, box-shadow 150ms ease, background 150ms ease',
} as any);

globalStyle('.text-input:focus, .detail-textarea:focus', {
  borderColor: 'var(--accent)',
  boxShadow: '0 0 0 3px var(--accent-subtle)',
  background: 'var(--panel)',
} as any);

globalStyle('.detail-textarea', {
  resize: 'vertical',
  minHeight: '96px',
  lineHeight: '1.55',
} as any);

globalStyle('.agent-chat-textarea', {
  minHeight: '120px',
  resize: 'vertical',
} as any);

globalStyle('.settings-actions', {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  marginTop: '16px',
} as any);

globalStyle('.settings-button', {
  position: 'relative',
  overflow: 'hidden',
  border: '1px solid var(--line-strong)',
  borderRadius: 'var(--radius)',
  background: 'var(--panel)',
  color: 'var(--text)',
  padding: '10px 16px',
  cursor: 'pointer',
  font: '700 11px/1 var(--font-data)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  transition:
    'border-color 150ms ease, box-shadow 150ms ease, transform 120ms ease, background 150ms ease',
} as any);

globalStyle('.settings-button:hover', {
  borderColor: 'var(--accent)',
  boxShadow: 'var(--shadow-panel-hover)',
  background: 'var(--panel)',
  transform: 'translateY(-1px)',
} as any);

globalStyle('.settings-button:active', {
  transform: 'translateY(0) scale(0.97)',
  boxShadow: 'none',
} as any);

globalStyle('.settings-button-secondary', {
  borderColor: 'var(--line)',
  background: 'var(--panel)',
} as any);

globalStyle('.settings-button-secondary:hover', {
  borderColor: 'var(--hold)',
  boxShadow: 'var(--shadow-panel-hover)',
  background: 'var(--panel)',
} as any);

globalStyle('.policy-row-split', {
  alignItems: 'center',
  gap: '12px',
} as any);

globalStyle('.policy-row-actions', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '8px',
  flexWrap: 'wrap',
} as any);

globalStyle('.settings-inline-button', {
  position: 'relative',
  overflow: 'hidden',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--panel)',
  color: 'var(--muted)',
  padding: '6px 10px',
  cursor: 'pointer',
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  transition:
    'border-color 140ms ease, box-shadow 140ms ease, color 140ms ease, transform 120ms ease',
} as any);

globalStyle('.settings-inline-button:hover', {
  borderColor: 'var(--line-strong)',
  boxShadow: 'var(--shadow-panel)',
  color: 'var(--text)',
  transform: 'translateY(-1px)',
} as any);

globalStyle('.settings-inline-button:active', {
  transform: 'translateY(0) scale(0.97)',
} as any);

globalStyle('.settings-inline-button-danger', {
  borderColor: 'var(--line)',
  background: 'var(--panel)',
  color: 'var(--sell)',
} as any);

globalStyle('.settings-inline-button-danger:hover', {
  borderColor: 'var(--sell)',
  boxShadow: 'var(--shadow-panel)',
  color: 'var(--sell)',
} as any);

globalStyle('.settings-chip-row', {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px',
  marginTop: '16px',
} as any);

globalStyle('.settings-chip', {
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--panel)',
  color: 'var(--muted)',
  padding: '8px 12px',
  cursor: 'pointer',
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.04em',
  textDecoration: 'none',
  transition:
    'border-color 140ms ease, background 140ms ease, color 140ms ease, box-shadow 140ms ease',
} as any);

globalStyle('.settings-chip:hover', {
  borderColor: 'var(--line-strong)',
  background: 'var(--panel)',
  color: 'var(--text)',
} as any);

globalStyle('.settings-chip.active', {
  borderColor: 'var(--accent)',
  background: 'var(--accent-subtle)',
  color: 'var(--text)',
  boxShadow: 'var(--shadow-panel)',
} as any);

globalStyle('.policy-card', {
  display: 'grid',
  gap: '10px',
} as any);

globalStyle('.policy-card-inline', {
  marginTop: '16px',
  background: 'var(--panel)',
} as any);

/* ============================================================
   AGENT CHAT  — global class names used as plain className strings
   (scoped versions live in AgentPage.css.ts, these are the global
   selectors for backward-compatibility with plain-string classNames)
   ============================================================ */

globalStyle('.agent-chat-shell', {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 0.95fr)',
  gap: '16px',
  marginTop: '8px',
  marginBottom: '18px',
} as any);

globalStyle('.agent-dialogue-section', { marginTop: '28px' } as any);

globalStyle('.agent-dual-view-panel', { overflow: 'hidden' } as any);

globalStyle('.agent-dual-view', {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 1fr)',
  gap: '20px',
  alignItems: 'stretch',
} as any);

globalStyle('.agent-dialogue-stage', {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  height: '680px',
} as any);

globalStyle('.agent-stage-header', {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '18px',
  alignItems: 'flex-start',
  padding: '14px 16px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'var(--panel)',
  transition: 'border-color 160ms ease',
  flexShrink: 0,
  marginBottom: '12px',
} as any);

globalStyle('.agent-stage-header:hover', {
  borderColor: 'var(--line-strong)',
} as any);

globalStyle('.agent-stage-pills', {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
} as any);

globalStyle('.agent-insight-rail', {
  display: 'grid',
  gap: '14px',
  alignContent: 'start',
  overflowY: 'auto',
  maxHeight: '680px',
} as any);

globalStyle('.agent-insight-card', {
  display: 'grid',
  gap: '14px',
  padding: '16px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'var(--panel)',
  transition: 'border-color 160ms ease, box-shadow 160ms ease',
} as any);

globalStyle('.agent-insight-card:hover', {
  borderColor: 'var(--line-strong)',
  boxShadow: 'var(--shadow-panel-hover)',
} as any);

globalStyle('.agent-insight-header', {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '14px',
  alignItems: 'flex-start',
} as any);

globalStyle('.agent-pulse-grid', {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '10px',
} as any);

globalStyle('.agent-pulse-item', {
  display: 'grid',
  gap: '4px',
  padding: '12px 13px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
  background: 'var(--panel)',
  transition: 'border-color 150ms ease',
} as any);

globalStyle('.agent-pulse-item:hover', {
  borderColor: 'var(--line-strong)',
} as any);

globalStyle('.agent-pulse-item span', {
  color: 'var(--muted)',
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
} as any);

globalStyle('.agent-pulse-item strong', {
  font: '600 13px/1 var(--font-data)',
  color: 'var(--text)',
  animation: 'tick-up 200ms ease 100ms both',
} as any);

globalStyle('.agent-step-stack', { display: 'grid', gap: '10px' } as any);

globalStyle('.agent-step-card', {
  display: 'grid',
  gap: '8px',
  padding: '12px 13px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
  background: 'var(--panel)',
  transition: 'border-color 150ms ease, background 150ms ease',
} as any);

globalStyle('.agent-step-card:hover', {
  borderColor: 'var(--line-strong)',
  background: 'var(--panel)',
} as any);

globalStyle('.agent-step-top', {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '10px',
  alignItems: 'flex-start',
} as any);

globalStyle('.agent-step-top span', {
  color: 'var(--muted)',
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
} as any);

globalStyle('.agent-step-copy', {
  color: 'var(--muted-strong)',
  fontSize: '13px',
  lineHeight: '1.6',
} as any);

globalStyle('.agent-handoff-actions', { display: 'grid', gap: '12px' } as any);
globalStyle('.agent-suggestion-list', { display: 'grid', gap: '8px' } as any);

globalStyle('.agent-suggestion-button', {
  width: '100%',
  textAlign: 'left',
  padding: '12px 13px 12px 15px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
  background: 'var(--panel)',
  color: 'var(--text)',
  font: 'inherit',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  transition:
    'border-color 150ms ease, box-shadow 150ms ease, background 150ms ease, transform 120ms ease',
} as any);

globalStyle('.agent-suggestion-button::before', {
  content: '""',
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: '2px',
  background: 'var(--accent)',
  transform: 'scaleY(0)',
  transformOrigin: 'center',
  transition: 'transform 150ms ease',
} as any);

globalStyle('.agent-suggestion-button:hover', {
  borderColor: 'var(--line-strong)',
  boxShadow: 'var(--shadow-panel)',
  background: 'var(--panel)',
  transform: 'translateX(3px)',
} as any);

globalStyle('.agent-suggestion-button:hover::before', {
  transform: 'scaleY(1)',
} as any);

globalStyle('.agent-suggestion-button:active', {
  transform: 'translateX(2px) scale(0.99)',
} as any);

globalStyle('.agent-chat-transcript', {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--panel)',
  padding: 'var(--space-5)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  animation: 'fade-in 200ms ease',
  boxShadow: 'var(--shadow-panel)',
} as any);

globalStyle('.agent-chat-sidecar', {
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'var(--panel)',
  padding: '14px',
} as any);

globalStyle('.agent-chat-message', {
  maxWidth: 'min(92%, 680px)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  padding: '14px 16px',
  animation: 'fade-up 200ms ease both',
  transition: 'border-color 150ms ease',
} as any);

globalStyle('.agent-chat-message:hover', {
  borderColor: 'var(--line-strong)',
} as any);

globalStyle('.agent-chat-user', {
  justifySelf: 'end',
  background: 'var(--accent-subtle)',
  borderColor: 'var(--accent)',
  borderLeft: '2px solid var(--accent)',
} as any);

globalStyle('.agent-chat-assistant', {
  justifySelf: 'start',
  background: 'var(--panel)',
  borderColor: 'var(--line)',
  borderLeft: '2px solid var(--accent-2)',
} as any);

globalStyle('.agent-chat-system', {
  justifySelf: 'center',
  width: '100%',
  maxWidth: 'none',
  background: 'var(--panel)',
  borderLeft: '2px solid var(--muted)',
} as any);

globalStyle('.agent-chat-muted', { borderColor: 'var(--line)' } as any);

globalStyle('.agent-chat-warn', {
  borderColor: 'var(--hold)',
  borderLeft: '2px solid var(--hold)',
} as any);

globalStyle('.agent-chat-meta', {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  marginBottom: '8px',
  color: 'var(--muted)',
  font: '11px/1 var(--font-data)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
} as any);

globalStyle('.agent-chat-body', {
  color: 'var(--text)',
  fontSize: '14px',
  lineHeight: '1.7',
} as any);

globalStyle('.agent-chat-composer', {
  display: 'grid',
  gap: '12px',
  padding: '16px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--panel)',
  flexShrink: 0,
  marginTop: '12px',
} as any);

globalStyle('.agent-chat-composer-actions', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
} as any);

globalStyle('.agent-dialogue-stage > .field-label', {
  flexShrink: 0,
  marginTop: '10px',
  marginBottom: '6px',
} as any);

/* ============================================================
   SETTINGS SWITCH (toggle)
   ============================================================ */

globalStyle('.settings-switch', {
  position: 'relative',
  width: '40px',
  height: '22px',
  borderRadius: '11px',
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  cursor: 'pointer',
  transition: 'background 150ms ease, border-color 150ms ease',
  flexShrink: 0,
} as any);

globalStyle('.settings-switch.active', {
  background: 'var(--buy)',
  borderColor: 'var(--buy)',
} as any);

globalStyle('.settings-switch::after', {
  content: '""',
  position: 'absolute',
  top: '2px',
  left: '2px',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  background: 'var(--panel)',
  transition: 'transform 150ms ease',
} as any);

globalStyle('.settings-switch.active::after', {
  transform: 'translateX(18px)',
} as any);

/* ============================================================
   SETTINGS PROFILE CARD
   ============================================================ */

globalStyle('.settings-profile-card', {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '20px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'var(--panel)',
} as any);

globalStyle('.settings-profile-avatar', {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  background: 'var(--accent-subtle)',
  border: '1px solid var(--line)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  fontWeight: 700,
  color: 'var(--accent)',
  flexShrink: 0,
} as any);

globalStyle('.settings-profile-info', {
  display: 'grid',
  gap: '4px',
} as any);

globalStyle('.settings-profile-name', {
  font: '600 16px/1.2 var(--font-display)',
  color: 'var(--text-strong)',
} as any);

globalStyle('.settings-profile-role', {
  font: '500 12px/1 var(--font-ui)',
  color: 'var(--muted)',
} as any);
