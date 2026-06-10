import { useState } from 'react';
import { CloseIcon, WarningIcon } from './AppIcons.tsx';
import {
  actions,
  banner,
  btn,
  content,
  detail,
  dismissBtn,
  icon,
  message,
} from './ErrorBanner.css.js';

interface ErrorBannerProps {
  title: string;
  detail?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorBanner({
  title,
  detail: detailText,
  onRetry,
  onDismiss,
  retryLabel = 'Retry',
  className = '',
}: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={`${banner} ${className}`} role="alert">
      <span className={icon}>
        <WarningIcon />
      </span>
      <div className={content}>
        <div className={message}>{title}</div>
        {detailText ? <div className={detail}>{detailText}</div> : null}
      </div>
      <div className={actions}>
        {onRetry ? (
          <button type="button" className={btn} onClick={onRetry}>
            {retryLabel}
          </button>
        ) : null}
        <button type="button" className={dismissBtn} onClick={handleDismiss} aria-label="Dismiss">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
