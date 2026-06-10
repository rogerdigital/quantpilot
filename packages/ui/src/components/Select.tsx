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

function SelectChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : undefined }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
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
        <SelectChevron open={open} />
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
