import { globalStyle } from '@vanilla-extract/css';

/* ============================================================
   BASE — Reset, body, scrollbar, app background
   ============================================================ */

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
});

globalStyle('html', {
  scrollBehavior: 'smooth',
});

/* Custom scrollbar */
globalStyle('::-webkit-scrollbar', {
  width: '5px',
  height: '5px',
} as any);

globalStyle('::-webkit-scrollbar-track', {
  background: 'rgba(0, 0, 0, 0.3)',
});

globalStyle('::-webkit-scrollbar-thumb', {
  background: 'rgba(0, 180, 255, 0.28)',
  borderRadius: '3px',
});

globalStyle('::-webkit-scrollbar-thumb:hover', {
  background: 'rgba(99, 102, 241, 0.50)',
});

globalStyle('body', {
  margin: 0,
  color: 'var(--text)',
  background: 'var(--bg-canvas)',
  font: '14px/1.65 var(--font-ui)',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  backgroundImage: [
    'radial-gradient(ellipse 130% 65% at 50% -5%, rgba(0, 100, 220, 0.20) 0%, transparent 65%)',
    'radial-gradient(ellipse 55% 45% at 90% 20%, rgba(99, 102, 241, 0.10) 0%, transparent 55%)',
    'radial-gradient(ellipse 45% 35% at 10% 80%, rgba(139, 92, 246, 0.10) 0%, transparent 55%)',
  ].join(', '),
  backgroundAttachment: 'fixed',
} as any);

/* Dot-grid substrate texture */
globalStyle('body::before', {
  content: '""',
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage: 'radial-gradient(rgba(0, 160, 255, 0.055) 1px, transparent 1px)',
  backgroundSize: '38px 38px',
  zIndex: -1,
});

/* CRT scan-line overlay */
globalStyle('body::after', {
  content: '""',
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage:
    'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0, 180, 255, 0.009) 3px, rgba(0, 180, 255, 0.009) 4px)',
  zIndex: 9999,
});
