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
  background: 'rgba(0, 180, 255, 0.18)',
  borderRadius: '3px',
});

globalStyle('::-webkit-scrollbar-thumb:hover', {
  background: 'rgba(0, 212, 255, 0.36)',
});

globalStyle('body', {
  margin: 0,
  color: 'var(--text)',
  background: 'var(--bg-canvas)',
  font: '14px/1.55 var(--font-ui)',
  backgroundImage: [
    'radial-gradient(ellipse 110% 55% at 50% -5%, rgba(0, 80, 180, 0.13) 0%, transparent 65%)',
    'radial-gradient(ellipse 45% 35% at 88% 18%, rgba(0, 200, 255, 0.05) 0%, transparent 55%)',
    'radial-gradient(ellipse 35% 25% at 12% 75%, rgba(139, 92, 246, 0.05) 0%, transparent 55%)',
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
  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0, 180, 255, 0.009) 3px, rgba(0, 180, 255, 0.009) 4px)',
  zIndex: 9999,
});
