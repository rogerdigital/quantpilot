import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary.tsx';

const DashboardConsole = lazy(() => import('../../modules/console/DashboardConsole.tsx'));

export function AppRouter() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f6efe6' }} />}>
        <DashboardConsole />
      </Suspense>
    </ErrorBoundary>
  );
}
