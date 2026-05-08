import { error, icon } from './FormValidationError.css.js';

interface FormValidationErrorProps {
  message: string;
  className?: string;
}

export function FormValidationError({ message, className = '' }: FormValidationErrorProps) {
  return (
    <span className={`${error} ${className}`} role="alert">
      <span className={icon}>!</span>
      {message}
    </span>
  );
}
