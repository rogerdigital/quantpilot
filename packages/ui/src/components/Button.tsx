import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { loading, sizes, variants } from './Button.css.js';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = [
    variants[variant],
    sizes[size],
    isLoading ? loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || isLoading} {...props}>
      {icon && !isLoading ? icon : null}
      {children}
    </button>
  );
}
