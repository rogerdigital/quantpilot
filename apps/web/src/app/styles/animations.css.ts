import { globalStyle, keyframes } from '@vanilla-extract/css';

/* ============================================================
   KEYFRAMES — clean, subtle animations only
   ============================================================ */

export const panelEnter = keyframes({
  from: { opacity: 0, transform: 'translateY(8px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

export const fadeUp = keyframes({
  from: { opacity: 0, transform: 'translateY(8px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

export const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

export const slideRight = keyframes({
  from: { opacity: 0, transform: 'translateX(-10px)' },
  to: { opacity: 1, transform: 'translateX(0)' },
});

export const staggerEnter = keyframes({
  from: { opacity: 0, transform: 'translateY(10px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

export const tickUp = keyframes({
  from: { opacity: 0, transform: 'translateY(6px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

export const ringPulse = keyframes({
  '0%': { transform: 'scale(1)', opacity: 0.6 },
  '100%': { transform: 'scale(2.2)', opacity: 0 },
});

export const float = keyframes({
  '0%, 100%': { transform: 'translateY(0px)' },
  '50%': { transform: 'translateY(-2px)' },
});

export const navReveal = keyframes({
  from: { clipPath: 'inset(0 100% 0 0)' },
  to: { clipPath: 'inset(0 0% 0 0)' },
});

export const skeletonPulse = keyframes({
  '0%, 100%': { opacity: 0.4 },
  '50%': { opacity: 0.15 },
});

export const skeletonSweep = keyframes({
  from: { backgroundPosition: '200% 0' },
  to: { backgroundPosition: '-200% 0' },
});

/* Register keyframe names as CSS custom properties */
globalStyle(':root', {
  '--kf-panel-enter': panelEnter,
  '--kf-fade-up': fadeUp,
  '--kf-fade-in': fadeIn,
  '--kf-slide-right': slideRight,
  '--kf-stagger-enter': staggerEnter,
  '--kf-tick-up': tickUp,
  '--kf-ring-pulse': ringPulse,
  '--kf-float': float,
  '--kf-nav-reveal': navReveal,
  '--kf-skeleton-pulse': skeletonPulse,
  '--kf-skeleton-sweep': skeletonSweep,
} as any);

/* Skeleton loading bar */
globalStyle('.skeleton', {
  background: 'linear-gradient(90deg, var(--panel-2) 25%, var(--panel-3) 50%, var(--panel-2) 75%)',
  backgroundSize: '200% 100%',
  animation: `${skeletonSweep} 1.5s ease infinite`,
  borderRadius: 'var(--radius-sm)',
} as any);

/* Empty panel state */
globalStyle('.panel-empty', {
  borderStyle: 'dashed',
  opacity: 0.6,
} as any);
