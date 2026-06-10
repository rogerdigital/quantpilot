import {
  darkThemeClass as uiDarkThemeClass,
  lightThemeClass as uiLightThemeClass,
} from '@quantpilot/ui';
import { createContext, type PropsWithChildren, useContext, useLayoutEffect, useMemo } from 'react';
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

  useLayoutEffect(() => {
    const root = document.documentElement;
    const appClass = theme.resolved === 'dark' ? darkClass : lightClass;
    const uiClass = theme.resolved === 'dark' ? uiDarkThemeClass : uiLightThemeClass;
    root.classList.add('theme-switching');
    root.classList.remove(darkClass, lightClass, uiDarkThemeClass, uiLightThemeClass);
    root.classList.add(appClass, uiClass);

    const frame = window.requestAnimationFrame(() => {
      root.classList.remove('theme-switching');
    });

    return () => {
      window.cancelAnimationFrame(frame);
      root.classList.remove('theme-switching');
    };
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
