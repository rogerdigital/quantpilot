import { style } from '@vanilla-extract/css';

export const pageLayout = style({
  padding: 'var(--space-6)',
  maxWidth: 'var(--content-max-width)',
  margin: '0 auto',
});

export const pageHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 'var(--space-6)',
});

export const pageTitle = style({
  font: '700 clamp(24px, 3.5vw, 36px)/1.1 var(--font-display)',
  color: 'var(--text)',
  marginBottom: 'var(--space-2)',
});

export const pageSubtitle = style({
  font: '400 13px/1.65 var(--font-ui)',
  color: 'var(--muted)',
});

export const timeRangeGroup = style({
  display: 'flex',
  gap: '4px',
});

export const timeRangeBtn = style({
  padding: '6px 12px',
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  color: 'var(--muted)',
  font: '600 12px/1 var(--font-data)',
  cursor: 'pointer',
  transition: 'all 150ms ease',
});

export const timeRangeBtnActive = style({
  background: 'var(--accent)',
  borderColor: 'var(--accent)',
  color: '#fff',
});

export const metricsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 'var(--space-3)',
  marginBottom: 'var(--space-6)',
});

export const metricCard = style({
  padding: 'var(--space-4)',
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  textAlign: 'center',
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
  selectors: {
    '&:hover': {
      borderColor: 'var(--line-strong)',
      boxShadow: 'var(--shadow-panel-hover)',
    },
  },
});

export const metricLabel = style({
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: 'var(--space-2)',
});

export const metricValue = style({
  font: '700 20px/1 var(--font-data)',
  letterSpacing: '-0.02em',
});

export const chartsGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 'var(--space-4)',
  marginBottom: 'var(--space-6)',
});

export const chartPanel = style({
  padding: 'var(--space-5)',
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  minHeight: '300px',
  boxShadow: 'var(--shadow-panel)',
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
  selectors: {
    '&:hover': {
      borderColor: 'var(--line-strong)',
      boxShadow: 'var(--shadow-panel-hover)',
    },
  },
});

export const chartTitle = style({
  font: '600 14px/1.3 var(--font-ui)',
  color: 'var(--text)',
  marginBottom: 'var(--space-4)',
});

export const chartPlaceholder = style({
  height: '250px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--muted)',
  font: '400 13px/1 var(--font-ui)',
});

export const heatmapPanel = style({
  padding: 'var(--space-5)',
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  marginBottom: 'var(--space-6)',
  boxShadow: 'var(--shadow-panel)',
});

export const heatmapTable = style({
  width: '100%',
  borderCollapse: 'collapse',
  font: '400 12px/1.4 var(--font-data)',
});

export const heatmapTh = style({
  padding: 'var(--space-2)',
  textAlign: 'center',
  color: 'var(--muted)',
  borderBottom: '1px solid var(--line)',
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
});

export const heatmapThLeft = style({
  textAlign: 'left',
});

export const heatmapTd = style({
  padding: 'var(--space-2)',
  textAlign: 'center',
  borderBottom: '1px solid var(--line)',
});

export const distributionSection = style({
  padding: 'var(--space-5)',
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-panel)',
});

export const distributionGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
  gap: 'var(--space-2)',
});

export const distributionItem = style({
  padding: 'var(--space-3)',
  background: 'var(--panel-2)',
  borderRadius: 'var(--radius)',
  textAlign: 'center',
});

export const distributionLabel = style({
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: '4px',
});

export const distributionValue = style({
  font: '600 16px/1 var(--font-data)',
  color: 'var(--text)',
});

export const loadingState = style({
  padding: 'var(--space-8)',
  textAlign: 'center',
  color: 'var(--muted)',
});
