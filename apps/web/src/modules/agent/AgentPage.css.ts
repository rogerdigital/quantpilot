import { globalStyle, keyframes, style } from '@vanilla-extract/css';

/* -- AGENT PAGE LAYOUT ---------------------------------- */

export const agentPageHero = style({
  display: 'grid',
  gap: '12px',
  padding: '24px 0 4px',
});

export const agentHeroTitle = style({
  font: '700 22px/1.2 var(--font-ui)',
  color: 'var(--text)',
  letterSpacing: '-0.02em',
});

export const agentHeroSub = style({
  font: '400 14px/1.5 var(--font-ui)',
  color: 'var(--muted-strong)',
  marginTop: '2px',
});

/* -- QUICK CHIPS ---------------------------------------- */

export const agentQuickChips = style({
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  marginBottom: '4px',
});

export const agentQuickChip = style({
  padding: '6px 14px',
  borderRadius: '999px',
  border: '1px solid var(--line)',
  background: 'var(--panel)',
  color: 'var(--muted-strong)',
  font: '13px/1 var(--font-ui)',
  cursor: 'pointer',
  transition: 'border-color 140ms ease, background 140ms ease, color 140ms ease',
  whiteSpace: 'nowrap',
  ':hover': {
    borderColor: 'var(--accent)',
    background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
    color: 'var(--text)',
  },
  ':active': { transform: 'scale(0.97)' },
});

/* -- ANALYSIS STEPPER ----------------------------------- */

const pulse = keyframes({
  '0%,100%': { opacity: 1 },
  '50%': { opacity: 0.35 },
});

export const agentStepper = style({
  display: 'flex',
  alignItems: 'center',
  gap: 0,
  padding: '14px 20px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
  background: 'var(--panel-2)',
  marginBottom: '16px',
  overflow: 'hidden',
});

export const agentStepperItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flex: 1,
  minWidth: 0,
});

export const agentStepperDot = style({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: 'var(--muted)',
  flexShrink: 0,
  transition: 'background 200ms ease',
});

export const agentStepperDotActive = style({
  background: 'var(--accent)',
  animationName: pulse,
  animationDuration: '1.2s',
  animationIterationCount: 'infinite',
});

export const agentStepperDotDone = style({
  background: 'var(--buy)',
});

export const agentStepperLabel = style({
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  transition: 'color 200ms ease',
});

export const agentStepperLabelActive = style({
  color: 'var(--accent)',
});

export const agentStepperLabelDone = style({
  color: 'var(--buy)',
});

export const agentStepperConnector = style({
  width: '32px',
  height: '1px',
  background: 'var(--line)',
  flexShrink: 0,
  margin: '0 8px',
});

/* -- MAIN DUAL VIEW ------------------------------------- */

export const agentDialogueSection = style({ marginTop: '0' });

export const agentDualViewPanel = style({ overflow: 'hidden' });

export const agentDualView = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.55fr) minmax(300px, 1fr)',
  gap: '20px',
  alignItems: 'stretch',
});

export const agentDialogueStage = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  height: 'calc(100vh - 180px)',
  minHeight: '480px',
});

/* -- CHAT TRANSCRIPT ------------------------------------ */

export const agentChatTranscript = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--panel)',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
});

export const agentChatMessage = style({
  maxWidth: 'min(88%, 660px)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  padding: '12px 15px',
});

export const agentChatUser = style({
  justifySelf: 'end',
  background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
  borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
  borderLeft: '2px solid var(--accent)',
});

export const agentChatAssistant = style({
  justifySelf: 'start',
  background: 'var(--panel-2)',
  borderColor: 'var(--line)',
  borderLeft: '2px solid var(--line-strong)',
});

export const agentChatSystem = style({
  justifySelf: 'center',
  width: '100%',
  maxWidth: 'none',
  background: 'var(--panel-3)',
  borderLeft: '2px solid var(--muted)',
  borderColor: 'var(--line)',
});

export const agentChatMuted = style({
  opacity: 0.65,
});

export const agentChatWarn = style({
  borderColor: 'color-mix(in srgb, var(--accent-2) 30%, transparent)',
  borderLeft: '2px solid var(--accent-2)',
  background: 'color-mix(in srgb, var(--accent-2) 4%, transparent)',
});

export const agentChatMeta = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  marginBottom: '6px',
  color: 'var(--muted)',
  font: '11px/1 var(--font-data)',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
});

export const agentChatBody = style({
  color: 'var(--text)',
  fontSize: '14px',
  lineHeight: '1.7',
});

/* -- STICKY COMPOSER (viewport bottom) ----------------- */

export const agentStickyComposer = style({
  position: 'fixed',
  bottom: 0,
  left: '260px',
  right: 0,
  zIndex: 100,
  display: 'grid',
  gap: '10px',
  padding: '14px 24px 16px',
  borderTop: '1px solid var(--line)',
  background: 'var(--panel)',
  boxShadow: '0 -4px 12px color-mix(in srgb, var(--text) 4%, transparent)',
  '@media': {
    '(max-width: 1180px)': {
      left: 0,
    },
  },
});

/* -- COMPOSER (legacy, inside dialogue stage) ----------- */

export const agentChatComposer = style({
  display: 'grid',
  gap: '10px',
  padding: '14px 16px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--panel-2)',
  flexShrink: 0,
  marginTop: '10px',
  transition: 'border-color 160ms ease',
  ':focus-within': {
    borderColor: 'var(--accent)',
  },
});

export const agentChatComposerActions = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
});

export const agentChatTextarea = style({
  width: '100%',
  minHeight: '52px',
  padding: '10px 13px',
  border: '1px solid transparent',
  borderRadius: 'var(--radius)',
  background: 'transparent',
  color: 'var(--text)',
  font: '14px/1.6 var(--font-ui)',
  resize: 'none',
  outline: 'none',
  '::placeholder': { color: 'var(--muted)' },
});

export const agentSendButton = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '9px 20px',
  borderRadius: 'var(--radius)',
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  font: '600 13px/1 var(--font-ui)',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'opacity 150ms ease, transform 120ms ease',
  ':hover': { opacity: 0.9 },
  ':active': { transform: 'scale(0.97)' },
  ':disabled': { opacity: 0.45, cursor: 'not-allowed', transform: 'none' },
});

/* -- INSIGHT RAIL --------------------------------------- */

export const agentInsightRail = style({
  display: 'grid',
  gap: '14px',
  alignContent: 'start',
  overflowY: 'auto',
  maxHeight: '640px',
});

export const agentInsightCard = style({
  display: 'grid',
  gap: '14px',
  padding: '18px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'var(--panel)',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  ':hover': {
    borderColor: 'var(--line-strong)',
    boxShadow: 'var(--shadow-panel)',
  },
});

export const agentInsightHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'flex-start',
});

/* -- INSIGHT ANALYSIS RESULT ---------------------------- */

export const agentThesis = style({
  font: '600 15px/1.5 var(--font-ui)',
  color: 'var(--text)',
  letterSpacing: '-0.01em',
});

export const agentRationaleList = style({
  display: 'grid',
  gap: '6px',
  paddingLeft: '0',
  listStyle: 'none',
});

export const agentRationaleItem = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  font: '13px/1.5 var(--font-ui)',
  color: 'var(--muted-strong)',
  '::before': {
    content: '"·"',
    color: 'var(--accent)',
    fontWeight: 700,
    flexShrink: 0,
    marginTop: '1px',
  },
});

export const agentWarningItem = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  padding: '8px 10px',
  borderRadius: 'var(--radius)',
  background: 'color-mix(in srgb, var(--accent-2) 6%, transparent)',
  border: '1px solid color-mix(in srgb, var(--accent-2) 15%, transparent)',
  font: '13px/1.5 var(--font-ui)',
  color: 'var(--accent-2)',
  '::before': {
    content: '"⚠"',
    flexShrink: 0,
    fontSize: '11px',
    marginTop: '1px',
  },
});

export const agentNextStep = style({
  padding: '10px 12px',
  borderRadius: 'var(--radius)',
  background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
  border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
  font: '13px/1.5 var(--font-ui)',
  color: 'var(--accent)',
});

/* -- ACTION BUTTONS ------------------------------------- */

export const agentActionButtons = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '8px',
});

export const agentActionBtn = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  padding: '12px 8px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
  background: 'var(--panel)',
  cursor: 'pointer',
  transition: 'border-color 140ms ease, box-shadow 140ms ease, transform 120ms ease',
  ':hover': {
    borderColor: 'var(--line-strong)',
    boxShadow: 'var(--shadow-panel)',
    transform: 'translateY(-1px)',
  },
  ':active': { transform: 'translateY(0) scale(0.98)' },
  ':disabled': { opacity: 0.4, cursor: 'not-allowed', transform: 'none' },
});

export const agentActionBtnLabel = style({
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted-strong)',
});

export const agentActionBtnSub = style({
  font: '11px/1 var(--font-data)',
  color: 'var(--muted)',
  textAlign: 'center',
});

export const agentActionBtnIcon = style({
  fontSize: '16px',
  lineHeight: 1,
  marginBottom: '2px',
});

/* -- PULSE GRID ----------------------------------------- */

export const agentPulseGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '8px',
});

export const agentPulseItem = style({
  display: 'grid',
  gap: '4px',
  padding: '10px 12px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
  background: 'var(--panel-2)',
  transition: 'border-color 140ms ease',
  ':hover': { borderColor: 'var(--line-strong)' },
});

globalStyle(`${agentPulseItem} span`, {
  color: 'var(--muted)',
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
});

globalStyle(`${agentPulseItem} strong`, {
  font: '600 12px/1.2 var(--font-data)',
  color: 'var(--text)',
  wordBreak: 'break-all',
});

/* -- PLAN STEPS ----------------------------------------- */

export const agentStepStack = style({ display: 'grid', gap: '8px' });

export const agentStepCard = style({
  display: 'grid',
  gap: '6px',
  padding: '10px 12px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
  background: 'var(--panel-2)',
  transition: 'border-color 140ms ease',
  ':hover': { borderColor: 'var(--line-strong)' },
});

export const agentStepTop = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '8px',
  alignItems: 'flex-start',
});

globalStyle(`${agentStepTop} strong`, {
  font: '600 12px/1.4 var(--font-ui)',
  color: 'var(--text)',
  flex: 1,
});

globalStyle(`${agentStepTop} span`, {
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  flexShrink: 0,
  paddingTop: '1px',
});

export const agentStepCopy = style({
  color: 'var(--muted-strong)',
  fontSize: '12px',
  lineHeight: '1.5',
});

/* -- HANDOFF SECTION ------------------------------------ */

export const agentHandoffActions = style({ display: 'grid', gap: '10px' });

export const agentRequestApprovalBtn = style({
  width: '100%',
  padding: '11px',
  borderRadius: 'var(--radius)',
  border: '1px solid color-mix(in srgb, var(--accent-2) 30%, transparent)',
  background: 'color-mix(in srgb, var(--accent-2) 6%, transparent)',
  color: 'var(--accent-2)',
  font: '600 13px/1 var(--font-ui)',
  cursor: 'pointer',
  transition: 'border-color 140ms ease, background 140ms ease',
  ':hover': {
    borderColor: 'color-mix(in srgb, var(--accent-2) 50%, transparent)',
    background: 'color-mix(in srgb, var(--accent-2) 10%, transparent)',
  },
  ':disabled': { opacity: 0.4, cursor: 'not-allowed' },
});

/* -- SUGGESTION LIST ------------------------------------ */

export const agentSuggestionList = style({ display: 'grid', gap: '6px' });

export const agentSuggestionButton = style({
  width: '100%',
  textAlign: 'left',
  padding: '10px 12px 10px 14px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
  background: 'var(--panel-2)',
  color: 'var(--muted-strong)',
  font: '13px/1.4 var(--font-ui)',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  transition: 'border-color 130ms ease, background 130ms ease, color 130ms ease',
  ':hover': {
    borderColor: 'var(--accent)',
    background: 'color-mix(in srgb, var(--accent) 4%, transparent)',
    color: 'var(--text)',
  },
  ':active': { transform: 'scale(0.99)' },
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
  transition: 'transform 130ms ease',
});

globalStyle(`${agentSuggestionButton}:hover::before`, {
  transform: 'scaleY(1)',
});

/* -- SESSION STAGE HEADER ------------------------------- */

export const agentStageHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  alignItems: 'flex-start',
  padding: '12px 14px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'var(--panel-2)',
  flexShrink: 0,
  marginBottom: '10px',
});

export const agentStagePills = style({
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  alignItems: 'center',
});

/* -- KEEP LEGACY EXPORTS for compatibility -------------- */
// (used in governance / other panels that reference old names)
export const agentInsightRailLegacy = agentInsightRail;
