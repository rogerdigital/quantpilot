import { keyframes, globalStyle } from '@vanilla-extract/css';

/* ============================================================
   KEYFRAMES
   ============================================================ */

export const panelEnter = keyframes({
  from: {
    opacity: 0,
    transform: 'translateY(12px) scale(0.996)',
    filter: 'blur(4px)',
  },
  to: {
    opacity: 1,
    transform: 'translateY(0) scale(1)',
    filter: 'blur(0)',
  },
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
  from: { opacity: 0, transform: 'translateY(16px)', filter: 'blur(3px)' },
  to: { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
});

export const tickUp = keyframes({
  from: { opacity: 0, transform: 'translateY(6px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

export const pulseGlow = keyframes({
  '0%, 100%': { boxShadow: '0 0 5px currentColor', opacity: 1 },
  '50%': { boxShadow: '0 0 16px currentColor, 0 0 28px currentColor', opacity: 0.75 },
});

export const ringPulse = keyframes({
  '0%': { transform: 'scale(1)', opacity: 0.6 },
  '100%': { transform: 'scale(2.6)', opacity: 0 },
});

export const gradientFlow = keyframes({
  '0%': { backgroundPosition: '0% 0%' },
  '100%': { backgroundPosition: '200% 0%' },
});

export const scanSweep = keyframes({
  '0%': { top: '-80px', opacity: 0 },
  '5%': { opacity: 1 },
  '95%': { opacity: 1 },
  '100%': { top: '100vh', opacity: 0 },
});

export const diamondSpin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

export const shimmerSweep = keyframes({
  '0%': { transform: 'translateX(-100%)' },
  '100%': { transform: 'translateX(100%)' },
});

export const float = keyframes({
  '0%, 100%': { transform: 'translateY(0px)' },
  '50%': { transform: 'translateY(-3px)' },
});

export const cursorBlink = keyframes({
  '0%, 49%': { opacity: 1 },
  '50%, 100%': { opacity: 0 },
});

export const typingBounce = keyframes({
  '0%, 60%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
  '30%': { transform: 'translateY(-5px)', opacity: 1 },
});

export const navReveal = keyframes({
  from: { clipPath: 'inset(0 100% 0 0)' },
  to: { clipPath: 'inset(0 0% 0 0)' },
});

/* Register keyframe names as CSS custom properties so they can be referenced
   by string name in globalStyle animation properties throughout other files. */
globalStyle(':root', {
  '--kf-panel-enter': panelEnter,
  '--kf-fade-up': fadeUp,
  '--kf-fade-in': fadeIn,
  '--kf-slide-right': slideRight,
  '--kf-stagger-enter': staggerEnter,
  '--kf-tick-up': tickUp,
  '--kf-pulse-glow': pulseGlow,
  '--kf-ring-pulse': ringPulse,
  '--kf-gradient-flow': gradientFlow,
  '--kf-scan-sweep': scanSweep,
  '--kf-diamond-spin': diamondSpin,
  '--kf-shimmer-sweep': shimmerSweep,
  '--kf-float': float,
  '--kf-cursor-blink': cursorBlink,
  '--kf-typing-bounce': typingBounce,
  '--kf-nav-reveal': navReveal,
} as any);
