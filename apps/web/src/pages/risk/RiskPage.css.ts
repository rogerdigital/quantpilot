import { globalStyle, style } from '@vanilla-extract/css';

export const riskCommandSummary = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.4fr) repeat(3, minmax(120px, 0.45fr))',
  gap: '1px',
  background: 'var(--line)',
  borderTop: '1px solid var(--line)',
  borderBottom: '1px solid var(--line)',
  '@media': {
    '(max-width: 960px)': {
      gridTemplateColumns: '1fr 1fr',
    },
    '(max-width: 560px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const riskCommandPrimary = style({
  display: 'grid',
  gap: '10px',
  padding: '18px 20px',
  background: 'var(--panel)',
  borderLeft: '3px solid var(--buy)',
});

export const riskCommandPrimaryWarn = style({
  borderLeftColor: 'var(--hold)',
});

export const riskCommandPrimaryDanger = style({
  borderLeftColor: 'var(--sell)',
});

export const riskCommandKpi = style({
  display: 'grid',
  gap: '7px',
  padding: '18px 16px',
  background: 'var(--panel)',
  alignContent: 'center',
});

globalStyle(`${riskCommandPrimary} span, ${riskCommandKpi} span`, {
  color: 'var(--muted)',
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

globalStyle(`${riskCommandPrimary} strong`, {
  color: 'var(--text-strong)',
  font: '700 clamp(24px, 3vw, 36px)/1.05 var(--font-display)',
  letterSpacing: '-0.02em',
});

globalStyle(`${riskCommandPrimary} p`, {
  margin: 0,
  color: 'var(--muted-strong)',
  fontSize: '13px',
  lineHeight: '1.6',
  maxWidth: '620px',
});

globalStyle(`${riskCommandKpi} strong`, {
  color: 'var(--text-strong)',
  font: '700 24px/1 var(--font-data)',
});

globalStyle(`${riskCommandKpi} p`, {
  margin: 0,
  color: 'var(--muted-strong)',
  fontSize: '12px',
  lineHeight: '1.45',
});
