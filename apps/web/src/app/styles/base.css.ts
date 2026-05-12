import { globalStyle } from '@vanilla-extract/css';

/* ============================================================
   BASE — Reset, body, scrollbar
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
  background: 'transparent',
});

globalStyle('::-webkit-scrollbar-thumb', {
  background: 'var(--line-strong)',
  borderRadius: '3px',
});

globalStyle('::-webkit-scrollbar-thumb:hover', {
  background: 'var(--line-vivid)',
});

globalStyle('body', {
  margin: 0,
  color: 'var(--text)',
  background: 'var(--bg-canvas)',
  font: '14px/1.6 var(--font-ui)',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
} as any);

/* Reduce motion for users who prefer it */
globalStyle('@media (prefers-reduced-motion: reduce)', {
  '@media': {
    '(prefers-reduced-motion: reduce)': {},
  },
} as any);

globalStyle('*, *::before, *::after', {
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animationDuration: '0.01ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.01ms !important',
    },
  },
} as any);

/* Global focus-visible ring */
globalStyle(':focus-visible', {
  outline: '2px solid var(--accent)',
  outlineOffset: '2px',
} as any);
