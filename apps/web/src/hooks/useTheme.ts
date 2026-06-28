import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'qp-theme';

function getSystemPreference(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStored(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
  return 'system';
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(getStored);
  // Track the system preference as state so a change re-renders the tree when
  // mode === 'system'. Deriving `resolved` purely during render does not work:
  // the matchMedia listener called setMode('system') but the value was already
  // 'system', so React bailed out and `resolved` was never recomputed.
  const [systemPref, setSystemPref] = useState<'dark' | 'light'>(getSystemPreference);

  const resolved = mode === 'system' ? systemPref : mode;

  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const toggle = useCallback(() => {
    const next = resolved === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [resolved, setTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPref(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  return { mode, resolved, setTheme, toggle };
}
