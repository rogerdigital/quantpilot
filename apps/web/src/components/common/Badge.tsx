import type { ReactNode } from 'react';
import * as css from './Badge.css.ts';

/* -- STATUS DOT ------------------------------------------ */

type DotTone = 'ok' | 'warn' | 'danger' | 'muted';

interface StatusDotProps {
  tone?: DotTone;
  children?: ReactNode;
}

export function StatusDot({ tone = 'ok', children }: StatusDotProps) {
  return (
    <span className={css.statusDotWrap}>
      <span className={`${css.statusDot} ${css.statusDotColor[tone]}`} aria-hidden="true" />
      {children && <span className={css.statusDotText}>{children}</span>}
    </span>
  );
}

/* -- LABEL BADGE ----------------------------------------- */

interface LabelBadgeProps {
  children: ReactNode;
  className?: string;
}

export function LabelBadge({ children, className }: LabelBadgeProps) {
  return (
    <span className={className ? `${css.labelBadge} ${className}` : css.labelBadge}>
      {children}
    </span>
  );
}

/* -- VALUE BADGE ----------------------------------------- */

type ValueTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

interface ValueBadgeProps {
  tone?: ValueTone;
  children: ReactNode;
  className?: string;
}

export function ValueBadge({ tone = 'neutral', children, className }: ValueBadgeProps) {
  return (
    <span className={className ? `${css.valueBadge[tone]} ${className}` : css.valueBadge[tone]}>
      {children}
    </span>
  );
}
