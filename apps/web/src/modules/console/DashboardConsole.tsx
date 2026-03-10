import { Navigate, Route, Routes } from 'react-router-dom';
import { TradingSystemProvider } from '../../store/trading-system/TradingSystemProvider.tsx';
import { Layout } from '../../pages/console/components/ConsoleChrome.tsx';
import { LocaleProvider } from '../../pages/console/i18n.tsx';
import { listConsoleRoutes } from './console.routes.tsx';

export default function DashboardConsole() {
  const routes = listConsoleRoutes();

  return (
    <LocaleProvider>
      <TradingSystemProvider>
        <Routes>
          <Route element={<Layout />}>
            {routes.flatMap((route) => {
              const canonicalRoute = <Route key={route.path} path={route.path} element={route.element} />;
              const aliasRoutes = (route.aliases || []).map((aliasPath) => {
                if (aliasPath === '/') {
                  return <Route key={aliasPath} path={aliasPath} element={<Navigate to={route.path} replace />} />;
                }

                return <Route key={aliasPath} path={aliasPath} element={<Navigate to={route.path} replace />} />;
              });

              return [canonicalRoute, ...aliasRoutes];
            })}
          </Route>
        </Routes>
      </TradingSystemProvider>
    </LocaleProvider>
  );
}
