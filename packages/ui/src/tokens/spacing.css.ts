/** 4px grid scale */
export const spacing = {
  /** 2px */
  xxs: '2px',
  /** 4px */
  xs: '4px',
  /** 8px */
  sm: '8px',
  /** 12px */
  md: '12px',
  /** 16px */
  lg: '16px',
  /** 20px */
  xl: '20px',
  /** 24px */
  xxl: '24px',
  /** 32px */
  xxxl: '32px',
  /** 40px */
  xxxxl: '40px',
  /** 48px */
  huge: '48px',
  /** 64px */
  massive: '64px',
} as const;

export type SpacingToken = keyof typeof spacing;
