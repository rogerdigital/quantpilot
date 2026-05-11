import { style } from '@vanilla-extract/css';

export const dataPageLayout = style({
  display: 'grid',
  gap: '24px',
  padding: '24px',
  maxWidth: '1400px',
  margin: '0 auto',
});

export const dataPageHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
});

export const dataPageTitle = style({
  font: '700 22px/1 var(--font-display)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text)',
});

export const dataPageSubtitle = style({
  marginTop: '6px',
  color: 'var(--muted-strong)',
  fontSize: '13px',
  lineHeight: '1.6',
});

export const dataPageGrid = style({
  display: 'grid',
  gap: '20px',
});

export const dataPageSection = style({
  padding: '20px',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--line)',
  background: 'rgba(8,10,24,0.85)',
});

export const dataPageLoading = style({
  padding: '48px',
  textAlign: 'center',
  color: 'var(--muted)',
  fontSize: '14px',
});

export const dataPageError = style({
  padding: '24px',
  borderRadius: 'var(--radius)',
  border: '1px solid rgba(239,68,68,0.3)',
  background: 'rgba(239,68,68,0.05)',
  color: '#ef4444',
  fontSize: '13px',
});
