import { globalStyle } from '@vanilla-extract/css';
import { darkTheme } from './themes/dark.css.ts';

/* ============================================================
   DESIGN TOKENS
   ============================================================ */

globalStyle(':root', {
  /* Canvas layers — unified single background (TradingView style) */
  '--bg-canvas': '#ffffff',
  '--bg': 'var(--bg-canvas)',
  '--panel': '#ffffff',
  '--panel-2': '#ffffff',
  '--panel-3': '#ffffff',
  '--panel-frame': 'rgba(79, 70, 229, 0.06)',

  /* Lines & borders */
  '--line': '#e5e7eb',
  '--line-strong': '#d1d5db',
  '--line-vivid': '#9ca3af',
  '--row-stripe': 'rgba(0, 0, 0, 0.02)',

  /* Typography */
  '--text': '#1f2937',
  '--text-strong': '#111827',
  '--muted': '#6b7280',
  '--muted-strong': '#4b5563',

  /* Accent palette — indigo primary */
  '--accent-indigo': '#4f46e5',
  '--accent-indigo-hover': '#4338ca',
  '--accent-live': '#4f46e5',
  '--accent': 'var(--accent-live)',
  '--accent-2': '#0ea5e9',
  '--accent-3': '#8b5cf6',

  /* Signal colors */
  '--buy': '#10b981',
  '--sell': '#ef4444',
  '--hold': '#f59e0b',
  '--info': '#6366f1',

  /* Semantic aliases */
  '--success': 'var(--buy)',
  '--danger': 'var(--sell)',
  '--warning': 'var(--hold)',
  '--success-subtle': 'rgba(16, 185, 129, 0.08)',
  '--danger-subtle': 'rgba(239, 68, 68, 0.08)',
  '--warning-subtle': 'rgba(245, 158, 11, 0.08)',
  '--info-subtle': 'rgba(99, 102, 241, 0.06)',
  '--muted-data': '#6b7280',
  '--on-accent': '#ffffff',
  '--on-buy': '#052e1b',
  '--on-sell': '#ffffff',
  '--on-danger': '#ffffff',
  '--accent-subtle': 'rgba(79, 70, 229, 0.06)',
  '--gradient-hero': 'linear-gradient(135deg, var(--panel) 0%, var(--panel-frame) 100%)',

  /* Fonts */
  '--font-display': '"Sora", "Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  '--font-ui': '"Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  '--font-data': '"JetBrains Mono", "SF Mono", "Consolas", monospace',

  /* Type scale */
  '--text-xs': '11px',
  '--text-sm': '13px',
  '--text-md': '15px',
  '--text-lg': '18px',
  '--text-xl': '22px',
  '--text-2xl': '28px',
  '--text-3xl': '36px',
  '--text-hero': '52px',

  /* Shadows */
  '--shadow': '0 12px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)',
  '--shadow-soft': '0 4px 16px rgba(0, 0, 0, 0.08)',
  '--shadow-md': 'var(--shadow-soft)',
  '--shadow-lg': 'var(--shadow)',
  '--shadow-panel': 'none',
  '--shadow-panel-hover': 'none',
  '--shadow-modal': '0 20px 60px rgba(0, 0, 0, 0.12), 0 0 0 1px var(--line)',
  '--text-shadow-subtle': '0 2px 8px rgba(0, 0, 0, 0.06)',

  /* Glows — disabled */
  '--glow-indigo': 'none',
  '--glow-indigo-strong': 'none',
  '--glow-cyan': 'none',
  '--glow-cyan-strong': 'none',
  '--glow-green': 'none',
  '--glow-amber': 'none',
  '--glow-red': 'none',

  /* Geometry — TradingView-style borderless tiled layout:
     - Layout containers: 0 radius (seamless tiling)
     - Interactive elements (input, button, badge): micro radius */
  '--radius': '4px',
  '--radius-sm': '3px',
  '--radius-lg': '0',
  '--radius-xl': '0',

  /* Panel gap (1px = divider line) */
  '--gap-panel': '1px',

  /* Spacing scale (4px grid) */
  '--space-1': '4px',
  '--space-2': '8px',
  '--space-3': '12px',
  '--space-4': '16px',
  '--space-5': '20px',
  '--space-6': '24px',
  '--space-7': '32px',
  '--space-8': '40px',

  /* Layout */
  '--content-max-width': '1480px',

  /* Z-index layers */
  '--z-dropdown': '100',
  '--z-sticky': '200',
  '--z-overlay': '1000',
  '--z-modal': '5000',
  '--z-toast': '9000',

  /* Overlay */
  '--overlay-dim': 'rgba(0, 0, 0, 0.4)',
  '--overlay-heavy': 'rgba(0, 0, 0, 0.65)',
  '--overlay-blur': 'blur(6px)',
} as any);

/* ============================================================
   DARK MODE OVERRIDES
   ============================================================ */

const darkSelector = `.${darkTheme[0]}`;

globalStyle(darkSelector, {
  '--bg-canvas': '#131722',
  '--bg': '#131722',
  '--panel': '#131722',
  '--panel-2': '#131722',
  '--panel-3': '#131722',
  '--panel-frame': 'rgba(99, 102, 241, 0.08)',

  '--line': '#2a2e39',
  '--line-strong': '#363a45',
  '--line-vivid': '#5b6078',
  '--row-stripe': 'rgba(255, 255, 255, 0.03)',

  '--text': '#e5e7eb',
  '--text-strong': '#f9fafb',
  '--muted': '#a1a8b4',
  '--muted-strong': '#d1d5db',
  '--muted-data': '#8b95a5',

  '--accent-indigo': '#818cf8',
  '--accent-indigo-hover': '#6366f1',
  '--accent-live': '#818cf8',
  '--accent': 'var(--accent-live)',
  '--accent-2': '#38bdf8',
  '--accent-3': '#a78bfa',

  '--buy': '#34d399',
  '--sell': '#f87171',
  '--hold': '#fbbf24',
  '--info': '#818cf8',

  '--success': 'var(--buy)',
  '--danger': 'var(--sell)',
  '--warning': 'var(--hold)',
  '--success-subtle': 'rgba(52, 211, 153, 0.10)',
  '--danger-subtle': 'rgba(248, 113, 113, 0.10)',
  '--warning-subtle': 'rgba(251, 191, 36, 0.10)',
  '--info-subtle': 'rgba(129, 140, 248, 0.08)',
  '--on-accent': '#ffffff',
  '--on-buy': '#052e1b',
  '--on-sell': '#ffffff',
  '--on-danger': '#ffffff',

  '--shadow': '0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
  '--shadow-soft': '0 4px 16px rgba(0, 0, 0, 0.3)',
  '--shadow-md': 'var(--shadow-soft)',
  '--shadow-lg': 'var(--shadow)',
  '--shadow-panel': 'none',
  '--shadow-panel-hover': 'none',
  '--shadow-modal': '0 24px 70px rgba(0, 0, 0, 0.55), 0 0 0 1px var(--line)',
  '--text-shadow-subtle': 'none',

  '--glow-indigo': 'none',
  '--glow-indigo-strong': 'none',
  '--glow-cyan': 'none',
  '--glow-cyan-strong': 'none',
  '--glow-green': 'none',
  '--glow-amber': 'none',
  '--glow-red': 'none',
} as any);
