import { createTheme, createThemeContract } from '@vanilla-extract/css';

export const themeVars = createThemeContract({
  /* Canvas layers */
  bgCanvas: null,
  bgPanel: null,
  bgPanel2: null,
  bgPanel3: null,
  bgPanelFrame: null,

  /* Lines & borders */
  line: null,
  lineStrong: null,
  lineVivid: null,

  /* Typography */
  text: null,
  textStrong: null,
  muted: null,
  mutedStrong: null,

  /* Accent */
  accent: null,
  accentHover: null,
  accentSubtle: null,
  accentSecondary: null,
  accentTertiary: null,

  /* Semantic */
  success: null,
  successSubtle: null,
  warning: null,
  warningSubtle: null,
  danger: null,
  dangerSubtle: null,
  info: null,
  infoSubtle: null,

  /* Trading signals */
  buy: null,
  sell: null,
  hold: null,

  /* Shadows */
  shadowSm: null,
  shadowMd: null,
  shadowLg: null,
  shadowXl: null,

  /* Glows */
  glowAccent: null,
  glowGreen: null,
  glowAmber: null,
  glowRed: null,

  /* Background image */
  bgOverlay: null,
});

export const darkTheme = createTheme(themeVars, {
  /* Canvas layers */
  bgCanvas: '#0f1117',
  bgPanel: '#1a1d2e',
  bgPanel2: '#22263a',
  bgPanel3: '#2a2f45',
  bgPanelFrame: 'rgba(99, 102, 241, 0.08)',

  /* Lines & borders */
  line: '#2e3348',
  lineStrong: '#3d4260',
  lineVivid: '#5b6078',

  /* Typography */
  text: '#e5e7eb',
  textStrong: '#f9fafb',
  muted: '#9ca3af',
  mutedStrong: '#d1d5db',

  /* Accent */
  accent: '#818cf8',
  accentHover: '#6366f1',
  accentSubtle: 'rgba(129, 140, 248, 0.10)',
  accentSecondary: '#38bdf8',
  accentTertiary: '#a78bfa',

  /* Semantic */
  success: '#34d399',
  successSubtle: 'rgba(52, 211, 153, 0.10)',
  warning: '#fbbf24',
  warningSubtle: 'rgba(251, 191, 36, 0.10)',
  danger: '#f87171',
  dangerSubtle: 'rgba(248, 113, 113, 0.10)',
  info: '#818cf8',
  infoSubtle: 'rgba(129, 140, 248, 0.08)',

  /* Trading signals */
  buy: '#34d399',
  sell: '#f87171',
  hold: '#fbbf24',

  /* Shadows */
  shadowSm: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
  shadowMd: '0 4px 12px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.25)',
  shadowLg: '0 8px 24px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)',
  shadowXl: '0 20px 50px rgba(0, 0, 0, 0.5), 0 8px 20px rgba(0, 0, 0, 0.35)',

  /* Glows — disabled in clean design */
  glowAccent: 'none',
  glowGreen: 'none',
  glowAmber: 'none',
  glowRed: 'none',

  /* Background overlay — none */
  bgOverlay: 'none',
});
