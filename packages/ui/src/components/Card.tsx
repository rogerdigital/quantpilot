import type { ReactNode } from 'react';
import { card, cardBody, cardFooter, cardHeader, cardTitle } from './Card.css.js';

interface CardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Card({ title: titleText, action, children, footer, className = '' }: CardProps) {
  return (
    <div className={`${card} ${className}`}>
      {titleText && (
        <div className={cardHeader}>
          <h3 className={cardTitle}>{titleText}</h3>
          {action}
        </div>
      )}
      <div className={cardBody}>{children}</div>
      {footer && <div className={cardFooter}>{footer}</div>}
    </div>
  );
}
