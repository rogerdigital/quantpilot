import { Suspense, lazy } from 'react';

const DashboardConsole = lazy(() => import('../../modules/console/DashboardConsole.tsx'));

export function AppRouter() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f6efe6' }} />}>
      <DashboardConsole />
    </Suspense>
  );
}
