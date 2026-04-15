import { createContext, useCallback, useContext, useState } from 'react';
import {
  toast,
  toastBody,
  toastClose,
  toastContainer,
  toastDetail,
  toastError,
  toastExiting,
  toastIcon,
  toastInfo,
  toastSuccess,
  toastTitle,
  toastWarn,
} from './Toast.css.ts';

/* ── Types ────────────────────────────────────────────── */

export type ToastKind = 'success' | 'error' | 'info' | 'warn';

export type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  detail?: string;
  durationMs?: number;
};

type ToastContextValue = {
  push: (item: Omit<ToastItem, 'id'>) => void;
};

/* ── Context ──────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

/* ── Icons ────────────────────────────────────────────── */

const ICONS: Record<ToastKind, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warn: '⚠',
};

const KIND_CLASS: Record<ToastKind, string> = {
  success: toastSuccess,
  error: toastError,
  info: toastInfo,
  warn: toastWarn,
};

/* ── ToastItem component ──────────────────────────────── */

function ToastEntry({
  item,
  onRemove,
}: {
  item: ToastItem & { exiting?: boolean };
  onRemove: (id: string) => void;
}) {
  return (
    <div className={`${toast} ${KIND_CLASS[item.kind]}${item.exiting ? ` ${toastExiting}` : ''}`}>
      <span className={toastIcon}>{ICONS[item.kind]}</span>
      <div className={toastBody}>
        <div className={toastTitle}>{item.title}</div>
        {item.detail && <div className={toastDetail}>{item.detail}</div>}
      </div>
      <button type="button" className={toastClose} onClick={() => onRemove(item.id)}>
        ×
      </button>
    </div>
  );
}

/* ── Provider ─────────────────────────────────────────── */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Array<ToastItem & { exiting?: boolean }>>([]);

  const remove = useCallback((id: string) => {
    // Mark as exiting first, then remove after animation
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 200);
  }, []);

  const push = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const duration = item.durationMs ?? 4000;
      setItems((prev) => [...prev, { ...item, id }]);
      setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      {items.length > 0 && (
        <div className={toastContainer}>
          {items.map((item) => (
            <ToastEntry key={item.id} item={item} onRemove={remove} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
