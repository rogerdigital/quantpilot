import { createTheme } from '@vanilla-extract/css';
import { themeVars } from './dark.css.js';

export const lightTheme = createTheme(themeVars, {
  /* Canvas layers */
  bgCanvas: '#f8f9fc',
  bgPanel: '#ffffff',
  bgPanel2: '#f3f4f8',
  bgPanel3: '#eceef5',
  bgPanelFrame: 'rgba(79, 70, 229, 0.06)',

  /* Lines & borders */
  line: '#e5e7eb',
  lineStrong: '#d1d5db',
  lineVivid: '#9ca3af',

  /* Typography */
  text: '#1f2937',
  textStrong: '#111827',
  muted: '#6b7280',
  mutedStrong: '#4b5563',

  /* Accent */
  accent: '#4f46e5',
  accentHover: '#4338ca',
  accentSubtle: 'rgba(79, 70, 229, 0.06)',
  accentSecondary: '#0ea5e9',
  accentTertiary: '#8b5cf6',

  /* Semantic */
  success: '#10b981',
  successSubtle: 'rgba(16, 185, 129, 0.08)',
  warning: '#f59e0b',
  warningSubtle: 'rgba(245, 158, 11, 0.08)',
  danger: '#ef4444',
  dangerSubtle: 'rgba(239, 68, 68, 0.08)',
  info: '#6366f1',
  infoSubtle: 'rgba(99, 102, 241, 0.06)',

  /* Trading signals */
  buy: '#10b981',
  sell: '#ef4444',
  hold: '#f59e0b',

  /* Shadows */
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.03)',
  shadowMd: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
  shadowLg: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
  shadowXl: '0 12px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)',

  /* Glows — disabled in clean design */
  glowAccent: 'none',
  glowGreen: 'none',
  glowAmber: 'none',
  glowRed: 'none',

  /* Background overlay — minimal */
  bgOverlay: 'none',
});
