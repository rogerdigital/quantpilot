export const shadows = {
  /** No shadow */
  none: 'none',
  /** Subtle elevation */
  sm: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
  /** Default card shadow */
  md: '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
  /** Panel shadow */
  lg: '0 8px 28px rgba(0, 0, 0, 0.5)',
  /** Modal / overlay shadow */
  xl: '0 24px 64px rgba(0, 0, 0, 0.75), 0 4px 16px rgba(0, 0, 0, 0.55)',
  /** Inset highlight for glass effect */
  panel:
    '0 2px 0 rgba(255, 255, 255, 0.025) inset, 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.3)',
  /** Panel hover state */
  panelHover:
    '0 2px 0 rgba(255, 255, 255, 0.04) inset, 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 28px rgba(99, 102, 241, 0.10), 0 0 0 1px rgba(0, 0, 0, 0.3)',
} as const;

export const glows = {
  indigo: '0 0 14px rgba(99, 102, 241, 0.55)',
  indigoStrong: '0 0 24px rgba(99, 102, 241, 0.75), 0 0 48px rgba(99, 102, 241, 0.3)',
  green: '0 0 12px rgba(0, 232, 157, 0.55)',
  amber: '0 0 12px rgba(255, 183, 0, 0.55)',
  red: '0 0 12px rgba(255, 51, 88, 0.55)',
} as const;

export type ShadowToken = keyof typeof shadows;
