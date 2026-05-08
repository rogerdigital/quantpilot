export const radii = {
  /** 0px */
  none: '0px',
  /** 3px */
  sm: '3px',
  /** 6px */
  md: '6px',
  /** 10px */
  lg: '10px',
  /** 14px */
  xl: '14px',
  /** 20px */
  xxl: '20px',
  /** 9999px (pill) */
  full: '9999px',
} as const;

export type RadiusToken = keyof typeof radii;
