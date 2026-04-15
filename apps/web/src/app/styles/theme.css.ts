import { globalStyle } from '@vanilla-extract/css';

/* ============================================================
   DESIGN TOKENS
   ============================================================ */

globalStyle(':root', {
  /* Canvas layers */
  '--bg-canvas': '#05071a',
  '--bg': 'var(--bg-canvas)',
  '--panel': '#0c0f28',
  '--panel-2': '#101430',
  '--panel-3': '#151a3a',
  '--panel-frame': 'rgba(99, 102, 241, 0.10)',

  /* Lines & borders */
  '--line': 'rgba(99, 102, 241, 0.18)',
  '--line-strong': 'rgba(99, 102, 241, 0.35)',
  '--line-vivid': 'rgba(99, 102, 241, 0.55)',

  /* Typography */
  '--text': '#e2e4f3',
  '--text-strong': '#f4f5ff',
  '--muted': 'rgba(160, 162, 210, 0.82)',
  '--muted-strong': 'rgba(190, 192, 235, 0.95)',

  /* Accent palette — indigo primary */
  '--accent-indigo': '#6366f1',
  '--accent-indigo-hover': '#4f46e5',
  '--accent-live': '#6366f1',
  '--accent': 'var(--accent-live)',
  '--accent-2': '#ffb700',
  '--accent-3': '#8b5cf6',

  /* Signal colors */
  '--buy': '#00e89d',
  '--sell': '#ff3358',
  '--hold': '#ffb700',
  '--info': '#6366f1',

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
    '0 2px 0 rgba(255, 255, 255, 0.04) inset, 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 28px rgba(99, 102, 241, 0.10), 0 0 0 1px rgba(0, 0, 0, 0.3)',

  /* Glows */
  '--glow-indigo': '0 0 14px rgba(99, 102, 241, 0.55)',
  '--glow-indigo-strong': '0 0 24px rgba(99, 102, 241, 0.75), 0 0 48px rgba(99, 102, 241, 0.3)',
  /* Keep legacy cyan aliases for gradual migration */
  '--glow-cyan': '0 0 14px rgba(99, 102, 241, 0.55)',
  '--glow-cyan-strong': '0 0 24px rgba(99, 102, 241, 0.75), 0 0 48px rgba(99, 102, 241, 0.3)',
  '--glow-green': '0 0 12px rgba(0, 232, 157, 0.55)',
  '--glow-amber': '0 0 12px rgba(255, 183, 0, 0.55)',
  '--glow-red': '0 0 12px rgba(255, 51, 88, 0.55)',

  /* Geometry */
  '--radius': '6px',
  '--radius-sm': '3px',
  '--radius-lg': '10px',
  '--radius-xl': '14px',
} as any);
