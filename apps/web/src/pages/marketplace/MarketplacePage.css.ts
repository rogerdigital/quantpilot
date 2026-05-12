import { style } from '@vanilla-extract/css';

export const pageLayout = style({
  padding: 'var(--space-6)',
  maxWidth: 'var(--content-max-width)',
  margin: '0 auto',
});

export const pageHeader = style({
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

export const filterRow = style({
  display: 'flex',
  gap: 'var(--space-3)',
  marginBottom: 'var(--space-6)',
  flexWrap: 'wrap',
});

export const searchInput = style({
  flex: 1,
  minWidth: '200px',
  padding: '10px 12px',
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  color: 'var(--text)',
  font: '400 13px/1 var(--font-ui)',
  outline: 'none',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  selectors: {
    '&:focus': {
      borderColor: 'var(--accent)',
      boxShadow: '0 0 0 3px var(--accent-subtle)',
    },
  },
});

export const selectInput = style({
  padding: '10px 12px',
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  color: 'var(--text)',
  font: '400 13px/1 var(--font-ui)',
  outline: 'none',
  transition: 'border-color 150ms ease',
  selectors: {
    '&:focus': {
      borderColor: 'var(--accent)',
    },
  },
});

export const strategyGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: 'var(--space-4)',
});

export const strategyCard = style({
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-5)',
  cursor: 'pointer',
  transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 160ms ease',
  selectors: {
    '&:hover': {
      borderColor: 'var(--line-strong)',
      boxShadow: 'var(--shadow-panel-hover)',
      transform: 'translateY(-2px)',
    },
  },
});

export const cardHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 'var(--space-3)',
});

export const cardTitle = style({
  font: '600 16px/1.3 var(--font-ui)',
  color: 'var(--text)',
  marginBottom: '4px',
});

export const cardAuthor = style({
  font: '400 12px/1 var(--font-ui)',
  color: 'var(--muted)',
});

export const ratingBadge = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 8px',
  background: 'rgba(99, 102, 241, 0.06)',
  borderRadius: 'var(--radius-sm)',
  font: '600 12px/1 var(--font-data)',
  color: 'var(--accent)',
});

export const cardDescription = style({
  font: '400 13px/1.5 var(--font-ui)',
  color: 'var(--muted)',
  marginBottom: 'var(--space-4)',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
} as any);

export const cardMetrics = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 'var(--space-2)',
  marginBottom: 'var(--space-4)',
  textAlign: 'center',
});

export const cardMetricValue = style({
  font: '600 14px/1 var(--font-data)',
});

export const cardMetricLabel = style({
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginTop: '2px',
});

export const tagList = style({
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
  marginBottom: 'var(--space-3)',
});

export const tag = style({
  padding: '2px 8px',
  background: 'var(--panel-2)',
  borderRadius: 'var(--radius-sm)',
  font: '400 11px/1 var(--font-ui)',
  color: 'var(--muted)',
});

export const cardFooter = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: 'var(--space-3)',
  borderTop: '1px solid var(--line)',
});

export const cardFooterMeta = style({
  font: '400 12px/1 var(--font-ui)',
  color: 'var(--muted)',
});

export const modalOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 'var(--z-modal)' as any,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--overlay-heavy)',
  backdropFilter: 'var(--overlay-blur)',
});

export const modalPanel = style({
  width: '90%',
  maxWidth: '600px',
  maxHeight: '80vh',
  overflow: 'auto',
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  padding: '28px',
  boxShadow: 'var(--shadow)',
});

export const modalTitle = style({
  font: '700 20px/1.2 var(--font-display)',
  color: 'var(--text)',
  marginBottom: 'var(--space-2)',
});

export const modalDescription = style({
  font: '400 13px/1.5 var(--font-ui)',
  color: 'var(--muted)',
  marginBottom: 'var(--space-5)',
});

export const modalSection = style({
  marginBottom: 'var(--space-5)',
});

export const modalSectionTitle = style({
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text)',
  marginBottom: 'var(--space-2)',
});

export const modalMetricsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 'var(--space-3)',
});

export const modalMetricLabel = style({
  font: '600 10px/1 var(--font-data)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
});

export const modalMetricValue = style({
  font: '600 16px/1 var(--font-data)',
});

export const modalActions = style({
  display: 'flex',
  gap: 'var(--space-3)',
  justifyContent: 'flex-end',
});

export const starBtn = style({
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  padding: 0,
  transition: 'transform 120ms ease',
  selectors: {
    '&:hover': {
      transform: 'scale(1.2)',
    },
  },
});

export const loadingState = style({
  textAlign: 'center',
  padding: 'var(--space-8)',
  color: 'var(--muted)',
});
