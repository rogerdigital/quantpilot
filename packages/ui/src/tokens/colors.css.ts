import { createThemeContract } from '@vanilla-extract/css';

export const colors = createThemeContract({
  /* Canvas layers */
  canvas: null,
  surface: null,
  surfaceRaised: null,
  surfaceOverlay: null,
  surfaceBorder: null,

  /* Lines & borders */
  border: null,
  borderStrong: null,
  borderVivid: null,

  /* Text */
  text: null,
  textStrong: null,
  textMuted: null,
  textMutedStrong: null,

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
});

export const darkColors = {
  canvas: '#05071a',
  surface: '#0c0f28',
  surfaceRaised: '#101430',
  surfaceOverlay: '#151a3a',
  surfaceBorder: 'rgba(99, 102, 241, 0.10)',

  border: 'rgba(99, 102, 241, 0.18)',
  borderStrong: 'rgba(99, 102, 241, 0.35)',
  borderVivid: 'rgba(99, 102, 241, 0.55)',

  text: '#e2e4f3',
  textStrong: '#f4f5ff',
  textMuted: 'rgba(160, 162, 210, 0.82)',
  textMutedStrong: 'rgba(190, 192, 235, 0.95)',

  accent: '#6366f1',
  accentHover: '#4f46e5',
  accentSubtle: 'rgba(99, 102, 241, 0.12)',
  accentSecondary: '#ffb700',
  accentTertiary: '#8b5cf6',

  success: '#00e89d',
  successSubtle: 'rgba(0, 232, 157, 0.12)',
  warning: '#ffb700',
  warningSubtle: 'rgba(255, 183, 0, 0.12)',
  danger: '#ff3358',
  dangerSubtle: 'rgba(255, 51, 88, 0.12)',
  info: '#6366f1',
  infoSubtle: 'rgba(99, 102, 241, 0.12)',

  buy: '#00e89d',
  sell: '#ff3358',
  hold: '#ffb700',
};

export const lightColors = {
  canvas: '#f8f9fc',
  surface: '#ffffff',
  surfaceRaised: '#f1f3f9',
  surfaceOverlay: '#e8ebf4',
  surfaceBorder: 'rgba(99, 102, 241, 0.15)',

  border: 'rgba(99, 102, 241, 0.15)',
  borderStrong: 'rgba(99, 102, 241, 0.30)',
  borderVivid: 'rgba(99, 102, 241, 0.50)',

  text: '#1e1e2e',
  textStrong: '#0f0f1a',
  textMuted: 'rgba(60, 60, 90, 0.72)',
  textMutedStrong: 'rgba(40, 40, 70, 0.88)',

  accent: '#4f46e5',
  accentHover: '#4338ca',
  accentSubtle: 'rgba(79, 70, 229, 0.08)',
  accentSecondary: '#d97706',
  accentTertiary: '#7c3aed',

  success: '#059669',
  successSubtle: 'rgba(5, 150, 105, 0.08)',
  warning: '#d97706',
  warningSubtle: 'rgba(217, 119, 6, 0.08)',
  danger: '#dc2626',
  dangerSubtle: 'rgba(220, 38, 38, 0.08)',
  info: '#4f46e5',
  infoSubtle: 'rgba(79, 70, 229, 0.08)',

  buy: '#059669',
  sell: '#dc2626',
  hold: '#d97706',
};
