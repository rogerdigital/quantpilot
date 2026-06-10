import { useState } from 'react';
import {
  DEFAULT_SHORTCUTS,
  type Shortcut,
  type ShortcutCategory,
} from '../../hooks/useKeyboardShortcuts.ts';
import { useLocale } from '../../modules/console/console.i18n.tsx';
import { CloseIcon } from '../common/AppIcons.tsx';

interface ShortcutHelpProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<ShortcutCategory, { zh: string; en: string }> = {
  navigation: { zh: '导航', en: 'Navigation' },
  trading: { zh: '交易', en: 'Trading' },
  search: { zh: '搜索', en: 'Search' },
  general: { zh: '通用', en: 'General' },
};

function formatKey(shortcut: Omit<Shortcut, 'action'>): string {
  const parts: string[] = [];
  if (shortcut.meta) parts.push('⌘');
  if (shortcut.shift) parts.push('⇧');
  parts.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key);
  return parts.join('');
}

export function ShortcutHelp({ open, onClose }: ShortcutHelpProps) {
  const { locale } = useLocale();
  const [filter, setFilter] = useState('');

  if (!open) return null;

  const filtered = DEFAULT_SHORTCUTS.filter(
    (s) =>
      !filter ||
      s.label.toLowerCase().includes(filter.toLowerCase()) ||
      s.category.includes(filter.toLowerCase())
  );

  const grouped = filtered.reduce(
    (acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    },
    {} as Record<ShortcutCategory, typeof DEFAULT_SHORTCUTS>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-heavy)',
        backdropFilter: 'var(--overlay-blur)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        style={{
          background: 'var(--panel-2)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          width: '480px',
          maxHeight: '70vh',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h2
            style={{ margin: 0, font: '700 18px/1 var(--font-display)', letterSpacing: '0.04em' }}
          >
            {locale === 'zh' ? '快捷键' : 'Keyboard Shortcuts'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={locale === 'zh' ? '关闭快捷键帮助' : 'Close keyboard shortcuts'}
            style={{
              width: '32px',
              height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <CloseIcon style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        <input
          type="text"
          placeholder={locale === 'zh' ? '搜索快捷键...' : 'Search shortcuts...'}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            fontSize: '13px',
            marginBottom: '16px',
            outline: 'none',
          }}
        />

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} style={{ marginBottom: '16px' }}>
            <div
              style={{
                color: 'var(--muted)',
                fontSize: '11px',
                fontFamily: 'var(--font-data)',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                marginBottom: '8px',
              }}
            >
              {CATEGORY_LABELS[category as ShortcutCategory]?.[locale] ?? category}
            </div>
            {items.map((s) => (
              <div
                key={s.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 0',
                }}
              >
                <span style={{ color: 'var(--text)', fontSize: '13px' }}>{s.label}</span>
                <kbd
                  style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--line-strong)',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-data)',
                    color: 'var(--muted-strong)',
                  }}
                >
                  {formatKey(s)}
                </kbd>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
