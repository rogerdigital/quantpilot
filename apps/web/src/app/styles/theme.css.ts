import { globalStyle } from '@vanilla-extract/css';

/* ============================================================
   DESIGN TOKENS
   ============================================================ */

globalStyle(':root', {
  /* Canvas layers */
  '--bg-canvas': '#030818',
  '--bg': 'var(--bg-canvas)',
  '--panel': '#091224',
  '--panel-2': '#0d192e',
  '--panel-3': '#122038',
  '--panel-frame': 'rgba(0, 200, 255, 0.10)',

  /* Lines & borders */
  '--line': 'rgba(60, 140, 240, 0.22)',
  '--line-strong': 'rgba(60, 140, 240, 0.40)',
  '--line-vivid': 'rgba(0, 210, 255, 0.55)',

  /* Typography */
  '--text': '#d8eaf8',
  '--text-strong': '#f0f8ff',
  '--muted': 'rgba(160, 195, 230, 0.82)',
  '--muted-strong': 'rgba(190, 215, 245, 0.95)',

  /* Accent palette */
  '--accent-live': '#00d4ff',
  '--accent': 'var(--accent-live)',
  '--accent-2': '#ffb700',
  '--accent-3': '#8b5cf6',

  /* Signal colors */
  '--buy': '#00e89d',
  '--sell': '#ff3358',
  '--hold': '#ffb700',
  '--info': '#4da6ff',

  /* Fonts */
  '--font-display': '"Rajdhani", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  '--font-ui': '"Plus Jakarta Sans", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  '--font-data': '"JetBrains Mono", "SF Mono", "Consolas", monospace',

  /* Shadows */
  '--shadow': '0 24px 64px rgba(0, 0, 0, 0.75), 0 4px 16px rgba(0, 0, 0, 0.55)',
  '--shadow-soft': '0 8px 28px rgba(0, 0, 0, 0.5)',
  '--shadow-panel':
    '0 2px 0 rgba(255, 255, 255, 0.025) inset, 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.3)',
  '--shadow-panel-hover':
    '0 2px 0 rgba(255, 255, 255, 0.04) inset, 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 28px rgba(0, 212, 255, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.3)',

  /* Glows */
  '--glow-cyan': '0 0 14px rgba(0, 212, 255, 0.55)',
  '--glow-cyan-strong': '0 0 24px rgba(0, 212, 255, 0.75), 0 0 48px rgba(0, 212, 255, 0.3)',
  '--glow-green': '0 0 12px rgba(0, 232, 157, 0.55)',
  '--glow-amber': '0 0 12px rgba(255, 183, 0, 0.55)',
  '--glow-red': '0 0 12px rgba(255, 51, 88, 0.55)',

  /* Geometry */
  '--radius': '6px',
  '--radius-sm': '3px',
  '--radius-lg': '10px',
  '--radius-xl': '14px',
} as any);
