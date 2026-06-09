import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

/* -- TRADING PAGE SHELL --------------------------------- */

export const tradingShell = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1px',

  overflow: 'hidden',
  height: '100vh',
  width: '100%',
});

export const tradingHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  padding: '16px 20px',
  border: 'none',
  borderBottom: '1px solid var(--line)',
  borderRadius: 0,
  background: 'var(--panel)',
  boxShadow: 'none',
  flexWrap: 'wrap',
});

export const tradingHeaderSymbol = style({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
});

export const tradingHeaderPrice = style({
  fontFamily: 'var(--font-data)',
  fontSize: '28px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: 'var(--text-strong)',
  lineHeight: 1,
});

export const tradingHeaderChange = styleVariants({
  up: {
    fontFamily: 'var(--font-data)',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--buy)',
  },
  down: {
    fontFamily: 'var(--font-data)',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--sell)',
  },
  neutral: {
    fontFamily: 'var(--font-data)',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--muted)',
  },
});

export const tradingHeaderStats = style({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
});

export const tradingHeaderStat = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
});

globalStyle(`${tradingHeaderStat} span`, {
  color: 'var(--muted)',
  fontSize: '11px',
  fontFamily: 'var(--font-data)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
});

globalStyle(`${tradingHeaderStat} strong`, {
  color: 'var(--text-strong)',
  fontSize: '12px',
  fontFamily: 'var(--font-data)',
  fontWeight: 600,
});

/* -- THREE-COLUMN GRID ---------------------------------- */

export const tradingGrid = style({
  display: 'grid',
  gridTemplateColumns: '220px 1fr 280px',
  gap: '1px',

  flex: 1,
  minHeight: 0,
  '@media': {
    '(max-width: 1180px)': {
      gridTemplateColumns: '1fr 280px',
    },
    '(max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

/* -- WATCHLIST PANEL ------------------------------------ */

export const watchlistPanel = style({
  border: 'none',
  borderRadius: 0,
  background: 'var(--panel)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  '@media': {
    '(max-width: 1180px)': {
      display: 'none',
    },
  },
});

export const watchlistHead = style({
  padding: '12px 16px',
  borderBottom: '1px solid var(--line)',
  fontSize: '11px',
  fontFamily: 'var(--font-data)',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'var(--muted)',
});

export const watchlistList = style({
  flex: 1,
  overflowY: 'auto',
});

export const watchlistItem = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 16px',
  borderBottom: '1px solid var(--line)',
  cursor: 'pointer',
  transition: 'background 150ms ease, box-shadow 150ms ease',
  ':hover': {
    background: 'var(--panel-2)',
  },
  ':last-child': {
    borderBottom: 'none',
  },
});

export const watchlistItemActive = style({
  boxShadow: 'inset 3px 0 0 var(--accent)',
});

globalStyle(`${watchlistItem} .wl-symbol`, {
  fontFamily: 'var(--font-data)',
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--text-strong)',
});

globalStyle(`${watchlistItem} .wl-name`, {
  fontFamily: 'var(--font-data)',
  fontSize: '11px',
  color: 'var(--muted)',
  marginTop: '2px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '100px',
});

globalStyle(`${watchlistItem} .wl-price`, {
  fontFamily: 'var(--font-data)',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-strong)',
  textAlign: 'right',
});

globalStyle(`${watchlistItem} .wl-change`, {
  fontFamily: 'var(--font-data)',
  fontSize: '11px',
  textAlign: 'right',
  marginTop: '2px',
});

/* -- CHART PANEL ---------------------------------------- */

export const chartPanel = style({
  border: 'none',
  borderRadius: 0,
  background: 'var(--panel)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

export const chartPanelHead = style({
  padding: '12px 16px',
  borderBottom: '1px solid var(--line)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  flexShrink: 0,
});

export const chartToolbar = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flexWrap: 'wrap',
});

export const chartTimeframeBtn = style({
  padding: '4px 10px',
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  background: 'transparent',
  color: 'var(--muted)',
  fontSize: '11px',
  fontFamily: 'var(--font-data)',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 140ms ease',
  ':hover': {
    borderColor: 'var(--line-strong)',
    color: 'var(--text)',
  },
});

export const chartTimeframeBtnActive = style({
  borderColor: 'var(--accent)',
  background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
  color: 'var(--accent)',
});

export const chartBody = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  gap: '12px',
  minHeight: '320px',
});

export const chartSignalStrip = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '10px',
  flexShrink: 0,
  '@media': {
    '(max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const chartSignalCard = style({
  padding: '12px 14px',
  border: 'none',
  borderRadius: 'var(--radius)',
  background: 'var(--panel-2)',
  textAlign: 'center',
});

globalStyle(`${chartSignalCard} .sig-label`, {
  fontSize: '11px',
  fontFamily: 'var(--font-data)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--muted)',
  marginBottom: '6px',
});

globalStyle(`${chartSignalCard} .sig-value`, {
  fontFamily: 'var(--font-data)',
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--text-strong)',
});

/* -- TRADE PANEL ---------------------------------------- */

export const tradePanel = style({
  border: 'none',
  borderRadius: 0,
  background: 'var(--panel)',
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  gap: '16px',
  overflow: 'auto',
});

export const tradePanelTitle = style({
  fontSize: '11px',
  fontFamily: 'var(--font-data)',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'var(--muted)',
  paddingBottom: '12px',
  borderBottom: '1px solid var(--line)',
});

export const orderTypeTabs = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  padding: '3px',
  background: 'var(--panel-3)',
  borderRadius: 'var(--radius)',
  border: 'none',
  gap: '3px',
});

export const orderTypeTab = style({
  padding: '7px 4px',
  textAlign: 'center',
  fontSize: '11px',
  fontFamily: 'var(--font-data)',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  borderRadius: 'calc(var(--radius) - 1px)',
  color: 'var(--muted)',
  cursor: 'pointer',
  border: '1px solid transparent',
  background: 'transparent',
  transition: 'all 140ms ease',
  ':hover': {
    color: 'var(--text)',
    background: 'var(--panel-2)',
  },
});

export const orderTypeTabActive = style({
  borderColor: 'var(--line-strong)',
  background: 'var(--panel)',
  color: 'var(--text-strong)',
  boxShadow: 'var(--shadow-panel)',
});

export const tradeInputGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

export const tradeInputLabel = style({
  fontSize: '11px',
  fontFamily: 'var(--font-data)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--muted)',
});

export const tradeInput = style({
  width: '100%',
  padding: '10px 12px',
  background: 'var(--panel-2)',
  border: 'none',
  borderRadius: 'var(--radius)',
  color: 'var(--text-strong)',
  fontFamily: 'var(--font-data)',
  fontSize: '14px',
  fontWeight: 600,
  outline: 'none',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  boxSizing: 'border-box',
  ':focus': {
    borderColor: 'var(--accent)',
    boxShadow: '0 0 0 2px color-mix(in srgb, var(--accent) 12%, transparent)',
  },
});

export const tradeBuyBtn = style({
  width: '100%',
  padding: '16px',
  background: 'var(--buy)',
  border: 'none',
  borderRadius: 'var(--radius)',
  color: '#fff',
  fontFamily: 'var(--font-ui)',
  fontSize: '15px',
  fontWeight: 700,
  letterSpacing: '0.5px',
  cursor: 'pointer',
  transition: 'opacity 150ms ease, transform 100ms ease',
  ':hover': {
    opacity: 0.9,
  },
  ':active': {
    transform: 'scale(0.98)',
  },
});

export const tradeSellBtn = style({
  width: '100%',
  padding: '16px',
  background: 'var(--sell)',
  border: 'none',
  borderRadius: 'var(--radius)',
  color: '#fff',
  fontFamily: 'var(--font-ui)',
  fontSize: '15px',
  fontWeight: 700,
  letterSpacing: '0.5px',
  cursor: 'pointer',
  transition: 'opacity 150ms ease, transform 100ms ease',
  ':hover': {
    opacity: 0.9,
  },
  ':active': {
    transform: 'scale(0.98)',
  },
});

export const tradeBuyBtnDisabled = style({
  width: '100%',
  padding: '16px',
  background: 'var(--buy)',
  border: 'none',
  borderRadius: 'var(--radius)',
  color: '#fff',
  fontFamily: 'var(--font-ui)',
  fontSize: '15px',
  fontWeight: 700,
  letterSpacing: '0.5px',
  cursor: 'not-allowed',
  opacity: 0.45,
});

export const tradeSellBtnDisabled = style({
  width: '100%',
  padding: '16px',
  background: 'var(--sell)',
  border: 'none',
  borderRadius: 'var(--radius)',
  color: '#fff',
  fontFamily: 'var(--font-ui)',
  fontSize: '15px',
  fontWeight: 700,
  letterSpacing: '0.5px',
  cursor: 'not-allowed',
  opacity: 0.45,
});

export const tradeBtnRow = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
});

export const tradeInfoRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid var(--line)',
  ':last-child': {
    borderBottom: 'none',
  },
  selectors: {
    '&:last-child': {
      borderBottom: 'none',
    },
  },
});

globalStyle(`${tradeInfoRow} span`, {
  fontSize: '11px',
  fontFamily: 'var(--font-data)',
  color: 'var(--muted)',
});

globalStyle(`${tradeInfoRow} strong`, {
  fontSize: '12px',
  fontFamily: 'var(--font-data)',
  fontWeight: 600,
  color: 'var(--text-strong)',
});

/* -- BOTTOM BLOTTER ------------------------------------- */

export const blotterPanel = style({
  border: 'none',
  borderRadius: 0,
  background: 'var(--panel)',
  overflow: 'hidden',
});

export const quickOrderBarWrap = style({
  '@media': {
    '(max-width: 640px)': {
      display: 'none',
    },
  },
});
