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
  bgCanvas: '#05071a',
  bgPanel: '#0c0f28',
  bgPanel2: '#101430',
  bgPanel3: '#151a3a',
  bgPanelFrame: 'rgba(99, 102, 241, 0.10)',

  /* Lines & borders */
  line: 'rgba(99, 102, 241, 0.18)',
  lineStrong: 'rgba(99, 102, 241, 0.35)',
  lineVivid: 'rgba(99, 102, 241, 0.55)',

  /* Typography */
  text: '#e2e4f3',
  textStrong: '#f4f5ff',
  muted: 'rgba(160, 162, 210, 0.82)',
  mutedStrong: 'rgba(190, 192, 235, 0.95)',

  /* Accent */
  accent: '#6366f1',
  accentHover: '#4f46e5',
  accentSubtle: 'rgba(99, 102, 241, 0.12)',
  accentSecondary: '#ffb700',
  accentTertiary: '#8b5cf6',

  /* Semantic */
  success: '#00e89d',
  successSubtle: 'rgba(0, 232, 157, 0.12)',
  warning: '#ffb700',
  warningSubtle: 'rgba(255, 183, 0, 0.12)',
  danger: '#ff3358',
  dangerSubtle: 'rgba(255, 51, 88, 0.12)',
  info: '#6366f1',
  infoSubtle: 'rgba(99, 102, 241, 0.12)',

  /* Trading signals */
  buy: '#00e89d',
  sell: '#ff3358',
  hold: '#ffb700',

  /* Shadows */
  shadowSm: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
  shadowMd: '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
  shadowLg: '0 8px 28px rgba(0, 0, 0, 0.5)',
  shadowXl: '0 24px 64px rgba(0, 0, 0, 0.75), 0 4px 16px rgba(0, 0, 0, 0.55)',

  /* Glows */
  glowAccent: '0 0 14px rgba(99, 102, 241, 0.55)',
  glowGreen: '0 0 12px rgba(0, 232, 157, 0.55)',
  glowAmber: '0 0 12px rgba(255, 183, 0, 0.55)',
  glowRed: '0 0 12px rgba(255, 51, 88, 0.55)',

  /* Background image (dark-specific overlay) */
  bgOverlay:
    'radial-gradient(ellipse 130% 65% at 50% -5%, rgba(0, 100, 220, 0.20) 0%, transparent 65%), radial-gradient(ellipse 55% 45% at 90% 20%, rgba(99, 102, 241, 0.10) 0%, transparent 55%), radial-gradient(ellipse 45% 35% at 10% 80%, rgba(139, 92, 246, 0.10) 0%, transparent 55%)',
});
