import type { InputHTMLAttributes, ReactNode } from 'react';
import { errorText, input, inputContainer, label, validationState, wrapper } from './Input.css.js';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'suffix'> {
  label?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  validation?: 'default' | 'error' | 'success';
}

export function Input({
  label: labelText,
  error,
  prefix,
  suffix,
  validation = 'default',
  className = '',
  ...props
}: InputProps) {
  return (
    <div className={`${wrapper} ${className}`}>
      {labelText && <span className={label}>{labelText}</span>}
      <div className={`${inputContainer} ${validationState[validation]}`}>
        {prefix}
        <input className={input} {...props} />
        {suffix}
      </div>
      {error && <span className={errorText}>{error}</span>}
    </div>
  );
}
