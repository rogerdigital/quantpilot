import { useEffect, useRef } from 'react';

export type ShortcutCategory = 'navigation' | 'trading' | 'search' | 'general';

export interface Shortcut {
  key: string;
  meta?: boolean;
  shift?: boolean;
  category: ShortcutCategory;
  label: string;
  action: () => void;
}

const shortcuts: Shortcut[] = [];
let cmdPaletteCallback: (() => void) | null = null;

export function registerShortcut(shortcut: Shortcut): () => void {
  shortcuts.push(shortcut);
  return () => {
    const idx = shortcuts.indexOf(shortcut);
    if (idx >= 0) shortcuts.splice(idx, 1);
  };
}

export function getRegisteredShortcuts(): Shortcut[] {
  return [...shortcuts];
}

export function setCommandPaletteCallback(cb: () => void) {
  cmdPaletteCallback = cb;
}

function matchesShortcut(e: KeyboardEvent, s: Shortcut): boolean {
  const metaKey = e.metaKey || e.ctrlKey;
  if (s.meta && !metaKey) return false;
  if (!s.meta && metaKey) return false;
  if (s.shift && !e.shiftKey) return false;
  if (!s.shift && e.shiftKey) return false;
  return e.key.toLowerCase() === s.key.toLowerCase();
}

export function useKeyboardShortcuts() {
  const shortcutsRef = useRef<Shortcut[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K is always command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        cmdPaletteCallback?.();
        return;
      }

      for (const s of shortcutsRef.current) {
        if (matchesShortcut(e, s)) {
          e.preventDefault();
          s.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    register: (shortcut: Shortcut) => {
      shortcutsRef.current.push(shortcut);
      return () => {
        const idx = shortcutsRef.current.indexOf(shortcut);
        if (idx >= 0) shortcutsRef.current.splice(idx, 1);
      };
    },
  };
}

/** Default shortcuts for the app shell */
export const DEFAULT_SHORTCUTS: Omit<Shortcut, 'action'>[] = [
  { key: '/', meta: true, category: 'general', label: 'Show shortcuts' },
  { key: '1', meta: true, category: 'navigation', label: 'Go to Dashboard' },
  { key: '2', meta: true, category: 'navigation', label: 'Go to Market' },
  { key: '3', meta: true, category: 'navigation', label: 'Go to Strategies' },
  { key: '4', meta: true, category: 'navigation', label: 'Go to Backtest' },
  { key: '5', meta: true, category: 'navigation', label: 'Go to Execution' },
  { key: '6', meta: true, category: 'navigation', label: 'Go to Risk' },
  { key: '7', meta: true, category: 'navigation', label: 'Go to Agent' },
  { key: '8', meta: true, category: 'navigation', label: 'Go to Notifications' },
  { key: '9', meta: true, category: 'navigation', label: 'Go to Settings' },
  { key: 'b', meta: true, category: 'trading', label: 'Quick buy' },
  { key: 's', meta: true, category: 'trading', label: 'Quick sell' },
  { key: 'e', meta: true, category: 'trading', label: 'Toggle watchlist' },
  { key: '.', meta: true, category: 'general', label: 'Toggle notifications' },
  { key: 'Escape', category: 'general', label: 'Close modal/drawer' },
];
