import type { PropsWithChildren } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../components/toast/Toast.tsx';
import { ThemeProvider } from '../../hooks/ThemeProvider.tsx';
import { LocaleProvider } from '../../modules/console/console.i18n.tsx';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LocaleProvider>
          <ToastProvider>{children}</ToastProvider>
        </LocaleProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
