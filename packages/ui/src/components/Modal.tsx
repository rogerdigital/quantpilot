import type { MouseEvent, ReactNode } from 'react';
import { body, closeBtn, footer, header, overlay, panel, sizes, title } from './Modal.css.js';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: keyof typeof sizes;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title: titleText,
  size = 'md',
  children,
  footer: footerContent,
}: ModalProps) {
  if (!open) return null;

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={overlay} onClick={handleOverlayClick}>
      <div className={`${panel} ${sizes[size]}`}>
        {titleText && (
          <div className={header}>
            <h2 className={title}>{titleText}</h2>
            <button type="button" className={closeBtn} onClick={onClose}>
              {'✕'}
            </button>
          </div>
        )}
        <div className={body}>{children}</div>
        {footerContent && <div className={footer}>{footerContent}</div>}
      </div>
    </div>
  );
}
