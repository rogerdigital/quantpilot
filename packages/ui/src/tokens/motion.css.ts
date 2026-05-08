export const duration = {
  /** 75ms — micro-interactions (hover, focus) */
  fast: '75ms',
  /** 150ms — standard transitions */
  normal: '150ms',
  /** 250ms — expanding panels, modals */
  slow: '250ms',
  /** 400ms — page transitions */
  slower: '400ms',
} as const;

export const easing = {
  /** Standard ease-out */
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** Ease-in for exit animations */
  in: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  /** Ease-in-out for continuous */
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  /** Spring-like overshoot */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
