// @ts-nocheck
import { style, globalStyle } from '@vanilla-extract/css';

/* ── AGENT LAYOUT ───────────────────────────────────────── */

export const agentDialogueSection = style({ marginTop: '28px' });

export const agentDualViewPanel = style({ overflow: 'hidden' });

export const agentDualView = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 1fr)',
  gap: '20px',
  alignItems: 'stretch',
});

export const agentDialogueStage = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  height: '680px',
});

/* ── AGENT STAGE HEADER ─────────────────────────────────── */

export const agentStageHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '18px',
  alignItems: 'flex-start',
  padding: '14px 16px',
  border: '1px solid rgba(0, 212, 255, 0.12)',
  borderRadius: 'var(--radius)',
  background: 'rgba(0, 212, 255, 0.03)',
  transition: 'border-color 160ms ease',
  flexShrink: 0,
  marginBottom: '12px',
  ':hover': { borderColor: 'rgba(40, 120, 220, 0.2)' },
});

export const agentStagePills = style({
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
});

/* ── AGENT INSIGHT RAIL ─────────────────────────────────── */

export const agentInsightRail = style({
  display: 'grid',
  gap: '14px',
  alignContent: 'start',
  overflowY: 'auto',
  maxHeight: '680px',
});

export const agentInsightCard = style({
  display: 'grid',
  gap: '14px',
  padding: '16px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'rgba(8, 18, 38, 0.85)',
  transition: 'border-color 160ms ease, box-shadow 160ms ease',
  ':hover': {
    borderColor: 'rgba(40, 120, 220, 0.2)',
    boxShadow: '0 0 16px rgba(0, 212, 255, 0.05)',
  },
});

export const agentInsightHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '14px',
  alignItems: 'flex-start',
});

/* ── AGENT PULSE GRID ───────────────────────────────────── */

export const agentPulseGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '10px',
});

export const agentPulseItem = style({
  display: 'grid',
  gap: '4px',
  padding: '12px 13px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
  background: 'rgba(2, 6, 18, 0.75)',
  transition: 'border-color 150ms ease',
  ':hover': { borderColor: 'rgba(40, 120, 220, 0.22)' },
});

globalStyle(`${agentPulseItem} span`, {
  color: 'var(--muted)',
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

globalStyle(`${agentPulseItem} strong`, {
  font: '600 13px/1 var(--font-data)',
  color: 'var(--text)',
  animation: 'tick-up 200ms ease 100ms both',
});

/* ── AGENT STEP STACK ───────────────────────────────────── */

export const agentStepStack = style({ display: 'grid', gap: '10px' });

export const agentStepCard = style({
  display: 'grid',
  gap: '8px',
  padding: '12px 13px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
  background: 'rgba(2, 6, 18, 0.75)',
  transition: 'border-color 150ms ease, background 150ms ease',
  ':hover': {
    borderColor: 'rgba(40, 120, 220, 0.22)',
    background: 'rgba(0, 212, 255, 0.02)',
  },
});

export const agentStepTop = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '10px',
  alignItems: 'flex-start',
});

globalStyle(`${agentStepTop} span`, {
  color: 'var(--muted)',
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

export const agentStepCopy = style({
  color: 'var(--muted-strong)',
  fontSize: '13px',
  lineHeight: '1.6',
});

/* ── AGENT HANDOFF & SUGGESTIONS ────────────────────────── */

export const agentHandoffActions = style({ display: 'grid', gap: '12px' });
export const agentSuggestionList = style({ display: 'grid', gap: '8px' });

export const agentSuggestionButton = style({
  width: '100%',
  textAlign: 'left',
  padding: '12px 13px 12px 15px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
  background: 'rgba(2, 6, 18, 0.75)',
  color: 'var(--text)',
  font: 'inherit',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  transition: 'border-color 150ms ease, box-shadow 150ms ease, background 150ms ease, transform 120ms ease',
  ':hover': {
    borderColor: 'rgba(0, 212, 255, 0.22)',
    boxShadow: '0 0 14px rgba(0, 212, 255, 0.08)',
    background: 'rgba(0, 212, 255, 0.03)',
    transform: 'translateX(3px)',
  },
  ':active': { transform: 'translateX(2px) scale(0.99)' },
});

globalStyle(`${agentSuggestionButton}::before`, {
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
});

globalStyle(`${agentSuggestionButton}:hover::before`, {
  transform: 'scaleY(1)',
});

/* ── AGENT CHAT TRANSCRIPT ──────────────────────────────── */

export const agentChatTranscript = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  border: '1px solid rgba(0, 212, 255, 0.16)',
  borderRadius: 'var(--radius-lg)',
  background: 'rgba(1, 3, 10, 0.92)',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  animation: 'fade-in 200ms ease',
  boxShadow: 'inset 0 0 60px rgba(0,0,0,.5), 0 0 28px rgba(0,212,255,.06), 0 0 0 1px rgba(0,212,255,.04)',
});

export const agentChatMessage = style({
  maxWidth: 'min(92%, 680px)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  padding: '14px 16px',
  animation: 'fade-up 200ms ease both',
  transition: 'border-color 150ms ease',
  ':hover': { borderColor: 'rgba(40, 120, 220, 0.22)' },
});

export const agentChatUser = style({
  justifySelf: 'end',
  background: 'rgba(0, 212, 255, 0.06)',
  borderColor: 'rgba(0, 212, 255, 0.18)',
  borderLeft: '2px solid var(--accent)',
  boxShadow: 'inset -4px 0 20px rgba(0,212,255,.05), 0 2px 8px rgba(0,0,0,.3)',
});

export const agentChatAssistant = style({
  justifySelf: 'start',
  background: 'rgba(255, 183, 0, 0.04)',
  borderColor: 'rgba(255, 183, 0, 0.12)',
  borderLeft: '2px solid var(--accent-2)',
  boxShadow: '0 2px 8px rgba(0,0,0,.3)',
});

export const agentChatSystem = style({
  justifySelf: 'center',
  width: '100%',
  maxWidth: 'none',
  background: 'rgba(8, 18, 38, 0.8)',
  borderLeft: '2px solid var(--muted)',
});

export const agentChatMuted = style({ borderColor: 'var(--line)' });

export const agentChatWarn = style({
  borderColor: 'rgba(255, 183, 0, 0.2)',
  borderLeft: '2px solid var(--hold)',
});

export const agentChatMeta = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  marginBottom: '8px',
  color: 'var(--muted)',
  font: '11px/1 var(--font-data)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
});

export const agentChatBody = style({
  color: 'var(--text)',
  fontSize: '14px',
  lineHeight: '1.7',
});

export const agentChatComposer = style({
  display: 'grid',
  gap: '12px',
  padding: '16px',
  border: '1px solid rgba(0, 212, 255, 0.1)',
  borderRadius: 'var(--radius-lg)',
  background: 'rgba(4, 10, 24, 0.8)',
  flexShrink: 0,
  marginTop: '12px',
});

export const agentChatComposerActions = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
});

export const agentChatTextarea = style({
  width: '100%',
  minHeight: '56px',
  padding: '10px 13px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'rgba(2, 6, 18, 0.85)',
  color: 'var(--text)',
  font: '14px/1.6 var(--font-ui)',
  resize: 'vertical',
  outline: 'none',
  transition: 'border-color 160ms ease, box-shadow 160ms ease',
  ':focus': {
    borderColor: 'rgba(0, 212, 255, 0.32)',
    boxShadow: '0 0 0 2px rgba(0, 212, 255, 0.06)',
  },
});
