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
  canvas: '#0f1117',
  surface: '#1a1d2e',
  surfaceRaised: '#22263a',
  surfaceOverlay: '#2a2f45',
  surfaceBorder: 'rgba(99, 102, 241, 0.08)',

  border: '#2e3348',
  borderStrong: '#3d4260',
  borderVivid: '#5b6078',

  text: '#e5e7eb',
  textStrong: '#f9fafb',
  textMuted: '#9ca3af',
  textMutedStrong: '#d1d5db',

  accent: '#818cf8',
  accentHover: '#6366f1',
  accentSubtle: 'rgba(129, 140, 248, 0.10)',
  accentSecondary: '#38bdf8',
  accentTertiary: '#a78bfa',

  success: '#34d399',
  successSubtle: 'rgba(52, 211, 153, 0.10)',
  warning: '#fbbf24',
  warningSubtle: 'rgba(251, 191, 36, 0.10)',
  danger: '#f87171',
  dangerSubtle: 'rgba(248, 113, 113, 0.10)',
  info: '#818cf8',
  infoSubtle: 'rgba(129, 140, 248, 0.08)',

  buy: '#34d399',
  sell: '#f87171',
  hold: '#fbbf24',
};

export const lightColors = {
  canvas: '#f8f9fc',
  surface: '#ffffff',
  surfaceRaised: '#f3f4f8',
  surfaceOverlay: '#eceef5',
  surfaceBorder: 'rgba(79, 70, 229, 0.06)',

  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  borderVivid: '#9ca3af',

  text: '#1f2937',
  textStrong: '#111827',
  textMuted: '#6b7280',
  textMutedStrong: '#4b5563',

  accent: '#4f46e5',
  accentHover: '#4338ca',
  accentSubtle: 'rgba(79, 70, 229, 0.06)',
  accentSecondary: '#0ea5e9',
  accentTertiary: '#8b5cf6',

  success: '#10b981',
  successSubtle: 'rgba(16, 185, 129, 0.08)',
  warning: '#f59e0b',
  warningSubtle: 'rgba(245, 158, 11, 0.08)',
  danger: '#ef4444',
  dangerSubtle: 'rgba(239, 68, 68, 0.08)',
  info: '#6366f1',
  infoSubtle: 'rgba(99, 102, 241, 0.06)',

  buy: '#10b981',
  sell: '#ef4444',
  hold: '#f59e0b',
};
