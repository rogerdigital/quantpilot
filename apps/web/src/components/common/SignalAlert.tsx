import { useEffect, useState } from 'react';
import {
  badge,
  dot,
  dotBuy,
  dotSell,
  dotWarning,
  pulsing,
  ringBuy,
  ringEffect,
  ringSell,
  ringWarning,
} from './SignalAlert.css.js';

interface SignalAlertProps {
  variant?: 'buy' | 'sell' | 'warning';
  size?: number;
  label?: string;
  pulse?: boolean;
  className?: string;
}

export function SignalAlert({
  variant = 'buy',
  size = 8,
  label,
  pulse = true,
  className = '',
}: SignalAlertProps) {
  const [animate, setAnimate] = useState(pulse);

  useEffect(() => {
    if (pulse) {
      setAnimate(true);
      const t = setTimeout(() => setAnimate(false), 1800);
      return () => clearTimeout(t);
    }
  }, [pulse]);

  const dotColor = variant === 'buy' ? dotBuy : variant === 'sell' ? dotSell : dotWarning;
  const ringColor = variant === 'buy' ? ringBuy : variant === 'sell' ? ringSell : ringWarning;

  return (
    <span className={`${badge} ${className}`} title={label}>
      <span
        className={`${dot} ${dotColor} ${animate ? pulsing : ''}`}
        style={{ width: size, height: size }}
      />
      {animate && <span className={`${ringEffect} ${ringColor}`} />}
    </span>
  );
}
