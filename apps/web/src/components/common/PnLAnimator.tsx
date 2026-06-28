import { useEffect, useRef, useState } from 'react';
import { negative, positive, value, zero } from './PnLAnimator.css.js';

interface PnLAnimatorProps {
  target: number;
  precision?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function PnLAnimator({
  target,
  precision = 2,
  prefix = '',
  suffix = '',
  duration = 400,
  className = '',
}: PnLAnimatorProps) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>();
  // Track the value currently shown so a new animation can start from the
  // visible midpoint rather than a stale completed target.
  const displayRef = useRef(target);
  const fromRef = useRef(target);
  const startTimeRef = useRef(0);

  useEffect(() => {
    fromRef.current = displayRef.current;
    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - (1 - progress) ** 3;
      const current = fromRef.current + (target - fromRef.current) * eased;
      displayRef.current = current;
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  const colorClass = display > 0 ? positive : display < 0 ? negative : zero;
  const sign = display > 0 ? '+' : '';

  return (
    <span className={`${value} ${colorClass} ${className}`}>
      {prefix}
      {sign}
      {display.toFixed(precision)}
      {suffix}
    </span>
  );
}
