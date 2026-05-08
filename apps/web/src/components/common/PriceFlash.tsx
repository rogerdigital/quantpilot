import { useEffect, useRef, useState } from 'react';
import {
  flashDownStyle,
  flashUpStyle,
  priceDown,
  priceFlat,
  priceUp,
  wrapper,
} from './PriceFlash.css.js';

interface PriceFlashProps {
  value: number;
  precision?: number;
  prefix?: string;
  className?: string;
}

export function PriceFlash({ value, precision = 2, prefix = '', className = '' }: PriceFlashProps) {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [colorClass, setColorClass] = useState(priceFlat);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const prev = prevRef.current;
    if (value > prev) {
      setFlash('up');
      setColorClass(priceUp);
    } else if (value < prev) {
      setFlash('down');
      setColorClass(priceDown);
    }
    prevRef.current = value;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setFlash(null);
      setColorClass(priceFlat);
    }, 600);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value]);

  const flashClass = flash === 'up' ? flashUpStyle : flash === 'down' ? flashDownStyle : '';

  return (
    <span className={`${wrapper} ${colorClass} ${flashClass} ${className}`}>
      {prefix}
      {value.toFixed(precision)}
    </span>
  );
}
