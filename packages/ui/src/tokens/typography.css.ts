export const fontFamily = {
  display: '"Rajdhani", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  ui: '"Plus Jakarta Sans", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  data: '"JetBrains Mono", "SF Mono", "Consolas", monospace',
} as const;

export const fontSize = {
  /** 11px */
  xxs: '11px',
  /** 12px */
  xs: '12px',
  /** 13px */
  sm: '13px',
  /** 14px */
  md: '14px',
  /** 15px */
  lg: '15px',
  /** 16px */
  xl: '16px',
  /** 18px */
  xxl: '18px',
  /** 20px */
  h4: '20px',
  /** 24px */
  h3: '24px',
  /** 28px */
  h2: '28px',
  /** 32px */
  h1: '32px',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = {
  tight: '1.2',
  snug: '1.35',
  normal: '1.5',
  relaxed: '1.65',
} as const;
