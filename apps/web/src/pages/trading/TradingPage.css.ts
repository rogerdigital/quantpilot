import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

/* ── TRADING PAGE SHELL ─────────────────────────────────── */

export const tradingShell = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

export const tradingHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  padding: '16px 20px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-xl)',
  background:
    'linear-gradient(140deg, rgba(8, 18, 40, 0.97) 0%, rgba(5, 10, 26, 0.98) 60%, rgba(8, 5, 28, 0.97) 100%)',
  boxShadow: 'var(--shadow-panel)',
  flexWrap: 'wrap',
});

export const tradingHeaderSymbol = style({
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
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
  gap: '24px',
  flexWrap: 'wrap',
});

export const tradingHeaderStat = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
});

globalStyle(`${tradingHeaderStat} span`, {
  color: 'var(--muted)',
  fontSize: '10px',
  fontFamily: 'var(--font-data)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
});

globalStyle(`${tradingHeaderStat} strong`, {
  color: 'var(--text-strong)',
  fontSize: '13px',
  fontFamily: 'var(--font-data)',
  fontWeight: 600,
});

/* ── THREE-COLUMN GRID ──────────────────────────────────── */

export const tradingGrid = style({
  display: 'grid',
  gridTemplateColumns: '220px 1fr 280px',
  gap: '12px',
  minHeight: '520px',
  '@media': {
    '(max-width: 1180px)': {
      gridTemplateColumns: '1fr 280px',
    },
    '(max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

/* ── WATCHLIST PANEL ────────────────────────────────────── */

export const watchlistPanel = style({
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
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
  padding: '12px 14px',
  borderBottom: '1px solid var(--line)',
  fontSize: '10px',
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
  padding: '10px 14px',
  borderBottom: '1px solid var(--line)',
  cursor: 'pointer',
  transition: 'background 150ms ease',
  ':hover': {
    background: 'rgba(0, 212, 255, 0.04)',
  },
  ':last-child': {
    borderBottom: 'none',
  },
});

export const watchlistItemActive = style({
  background: 'rgba(0, 212, 255, 0.07)',
  borderLeft: '2px solid var(--accent-live)',
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

/* ── CHART PANEL ────────────────────────────────────────── */

export const chartPanel = style({
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
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
});

export const chartTimeframeBtn = style({
  padding: '4px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--line)',
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
  borderColor: 'rgba(0, 212, 255, 0.4)',
  background: 'rgba(0, 212, 255, 0.08)',
  color: 'var(--accent-live)',
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
});

export const chartSignalCard = style({
  padding: '12px 14px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  background: 'rgba(0, 212, 255, 0.02)',
  textAlign: 'center',
});

globalStyle(`${chartSignalCard} .sig-label`, {
  fontSize: '10px',
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

/* ── TRADE PANEL ────────────────────────────────────────── */

export const tradePanel = style({
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--panel)',
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  gap: '14px',
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
  background: 'rgba(2, 6, 18, 0.8)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--line)',
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
    background: 'rgba(0, 212, 255, 0.05)',
  },
});

export const orderTypeTabActive = style({
  borderColor: 'rgba(0, 212, 255, 0.28)',
  background: 'rgba(0, 212, 255, 0.1)',
  color: 'var(--text-strong)',
});

export const tradeInputGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

export const tradeInputLabel = style({
  fontSize: '10px',
  fontFamily: 'var(--font-data)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--muted)',
});

export const tradeInput = style({
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(2, 6, 18, 0.8)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  color: 'var(--text-strong)',
  fontFamily: 'var(--font-data)',
  fontSize: '14px',
  fontWeight: 600,
  outline: 'none',
  transition: 'border-color 150ms ease',
  boxSizing: 'border-box',
  ':focus': {
    borderColor: 'var(--accent-live)',
    boxShadow: '0 0 0 2px rgba(0, 212, 255, 0.12)',
  },
});

export const tradeBuyBtn = style({
  width: '100%',
  padding: '14px',
  background: 'var(--buy)',
  border: 'none',
  borderRadius: 'var(--radius)',
  color: '#01030c',
  fontFamily: 'var(--font-display)',
  fontSize: '15px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  ':hover': {
    background: '#0dd889',
    boxShadow: '0 0 20px rgba(0, 232, 157, 0.4)',
  },
  ':active': {
    transform: 'scale(0.98)',
  },
});

export const tradeSellBtn = style({
  width: '100%',
  padding: '14px',
  background: 'var(--sell)',
  border: 'none',
  borderRadius: 'var(--radius)',
  color: '#fff',
  fontFamily: 'var(--font-display)',
  fontSize: '15px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  ':hover': {
    background: '#f75c6e',
    boxShadow: '0 0 20px rgba(255, 51, 88, 0.4)',
  },
  ':active': {
    transform: 'scale(0.98)',
  },
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

/* ── BOTTOM BLOTTER ─────────────────────────────────────── */

export const blotterPanel = style({
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--panel)',
  overflow: 'hidden',
});
