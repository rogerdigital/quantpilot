import { createContext, type PropsWithChildren, useContext, useEffect, useMemo } from 'react';
import { darkTheme } from '../app/styles/themes/dark.css.ts';
import { lightTheme } from '../app/styles/themes/light.css.ts';
import { type ThemeMode, useTheme } from './useTheme.ts';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: 'dark' | 'light';
  setTheme: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const [darkClass] = darkTheme;
const [lightClass] = lightTheme;

export function ThemeProvider({ children }: PropsWithChildren) {
  const theme = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(darkClass, lightClass);
    root.classList.add(theme.resolved === 'dark' ? darkClass : lightClass);
  }, [theme.resolved]);

  const value = useMemo(
    () => ({
      mode: theme.mode,
      resolved: theme.resolved,
      setTheme: theme.setTheme,
      toggle: theme.toggle,
    }),
    [theme.mode, theme.resolved, theme.setTheme, theme.toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
}
