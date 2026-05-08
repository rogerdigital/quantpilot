import type { PropsWithChildren } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../components/toast/Toast.tsx';
import { ThemeProvider } from '../../hooks/ThemeProvider.tsx';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
