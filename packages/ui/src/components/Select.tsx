import { useCallback, useEffect, useRef, useState } from 'react';
import { dropdown, option, optionSelected, placeholder, trigger } from './Select.css.js';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder: ph = 'Select...',
  className = '',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const handleSelect = useCallback(
    (val: string) => {
      onChange?.(val);
      setOpen(false);
    },
    [onChange],
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }} className={className}>
      <button
        type="button"
        className={trigger}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className={selected ? '' : placeholder}>{selected?.label ?? ph}</span>
        <span style={{ fontSize: '10px', opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className={dropdown}>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`${option} ${o.value === value ? optionSelected : ''}`}
              disabled={o.disabled}
              onClick={() => handleSelect(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
