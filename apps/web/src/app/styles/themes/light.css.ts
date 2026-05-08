import { createTheme } from '@vanilla-extract/css';
import { themeVars } from './dark.css.js';

export const lightTheme = createTheme(themeVars, {
  /* Canvas layers */
  bgCanvas: '#f8f9fc',
  bgPanel: '#ffffff',
  bgPanel2: '#f1f3f9',
  bgPanel3: '#e8ebf4',
  bgPanelFrame: 'rgba(99, 102, 241, 0.15)',

  /* Lines & borders */
  line: 'rgba(99, 102, 241, 0.15)',
  lineStrong: 'rgba(99, 102, 241, 0.30)',
  lineVivid: 'rgba(99, 102, 241, 0.50)',

  /* Typography */
  text: '#1e1e2e',
  textStrong: '#0f0f1a',
  muted: 'rgba(60, 60, 90, 0.72)',
  mutedStrong: 'rgba(40, 40, 70, 0.88)',

  /* Accent */
  accent: '#4f46e5',
  accentHover: '#4338ca',
  accentSubtle: 'rgba(79, 70, 229, 0.08)',
  accentSecondary: '#d97706',
  accentTertiary: '#7c3aed',

  /* Semantic */
  success: '#059669',
  successSubtle: 'rgba(5, 150, 105, 0.08)',
  warning: '#d97706',
  warningSubtle: 'rgba(217, 119, 6, 0.08)',
  danger: '#dc2626',
  dangerSubtle: 'rgba(220, 38, 38, 0.08)',
  info: '#4f46e5',
  infoSubtle: 'rgba(79, 70, 229, 0.08)',

  /* Trading signals */
  buy: '#059669',
  sell: '#dc2626',
  hold: '#d97706',

  /* Shadows */
  shadowSm: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
  shadowMd: '0 4px 12px rgba(0, 0, 0, 0.10), 0 2px 4px rgba(0, 0, 0, 0.06)',
  shadowLg: '0 8px 28px rgba(0, 0, 0, 0.12)',
  shadowXl: '0 24px 64px rgba(0, 0, 0, 0.18), 0 4px 16px rgba(0, 0, 0, 0.10)',

  /* Glows */
  glowAccent: '0 0 14px rgba(79, 70, 229, 0.30)',
  glowGreen: '0 0 12px rgba(5, 150, 105, 0.30)',
  glowAmber: '0 0 12px rgba(217, 119, 6, 0.30)',
  glowRed: '0 0 12px rgba(220, 38, 38, 0.30)',

  /* Background image (light: minimal) */
  bgOverlay:
    'radial-gradient(ellipse 130% 65% at 50% -5%, rgba(79, 70, 229, 0.06) 0%, transparent 65%)',
});
