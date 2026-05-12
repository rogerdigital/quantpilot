export const radii = {
  none: '0px',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  xxl: '24px',
  full: '9999px',
} as const;

export type RadiusToken = keyof typeof radii;
