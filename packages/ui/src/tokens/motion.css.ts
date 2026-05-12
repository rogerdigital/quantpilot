export const duration = {
  fast: '100ms',
  normal: '180ms',
  slow: '280ms',
  slower: '400ms',
} as const;

export const easing = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  in: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  inOut: 'cubic-bezier(0.45, 0, 0.55, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
