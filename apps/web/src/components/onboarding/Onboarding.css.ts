import { keyframes, style } from '@vanilla-extract/css';

const fadeIn = keyframes({
  from: { opacity: 0, transform: 'translateY(8px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 9500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'color-mix(in srgb, var(--panel) 85%, transparent)',
  backdropFilter: 'blur(8px)',
  animation: `${fadeIn} 200ms ease both`,
});

export const wizard = style({
  width: '100%',
  maxWidth: '520px',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--line)',
  background: 'var(--panel)',
  boxShadow: 'var(--shadow-panel-hover)',
  overflow: 'hidden',
  animation: `${fadeIn} 250ms cubic-bezier(0.16, 1, 0.3, 1) both`,
});

export const header = style({
  padding: '24px 28px 0',
});

export const progress = style({
  display: 'flex',
  gap: '4px',
  marginBottom: '20px',
});

export const progressBar = style({
  flex: 1,
  height: '3px',
  borderRadius: '2px',
  background: 'var(--panel-3)',
  transition: 'background 200ms ease',
});

export const progressBarActive = style({
  background: 'var(--accent)',
});

export const title = style({
  font: '700 20px/1.2 var(--font-ui)',
  color: 'var(--text)',
  marginBottom: '8px',
});

export const subtitle = style({
  font: '400 13px/1.5 var(--font-ui)',
  color: 'var(--muted)',
});

export const body = style({
  padding: '24px 28px',
  minHeight: '200px',
});

export const stepContent = style({
  animation: `${fadeIn} 200ms ease both`,
});

export const footer = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 28px',
  borderTop: '1px solid var(--line)',
  background: 'var(--panel-2)',
});

export const btn = style({
  padding: '8px 20px',
  borderRadius: 'var(--radius)',
  font: '600 13px/1 var(--font-ui)',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  border: 'none',
});

export const btnPrimary = style({
  background: 'var(--accent)',
  color: '#fff',
  selectors: {
    '&:hover': {
      background: 'var(--accent-hover)',
    },
  },
});

export const btnSecondary = style({
  background: 'transparent',
  border: '1px solid var(--line)',
  color: 'var(--muted)',
  selectors: {
    '&:hover': {
      borderColor: 'var(--accent)',
      color: 'var(--text)',
    },
  },
});

export const btnSkip = style({
  background: 'transparent',
  border: 'none',
  color: 'var(--muted)',
  opacity: 0.6,
  font: '400 12px/1 var(--font-ui)',
  cursor: 'pointer',
  transition: 'opacity 150ms ease',
  selectors: {
    '&:hover': {
      opacity: 1,
    },
  },
});

export const featureList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginTop: '16px',
});

export const featureItem = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  padding: '12px',
  borderRadius: 'var(--radius)',
  background: 'var(--panel-2)',
  border: '1px solid var(--line)',
});

export const featureIcon = style({
  flexShrink: 0,
  width: '32px',
  height: '32px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--panel-3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
});

export const featureText = style({
  flex: 1,
});

export const featureTitle = style({
  font: '600 13px/1.4 var(--font-ui)',
  color: 'var(--text)',
  marginBottom: '2px',
});

export const featureDesc = style({
  font: '400 12px/1.4 var(--font-ui)',
  color: 'var(--muted)',
});
