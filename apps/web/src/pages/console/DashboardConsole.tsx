import { Navigate, Route, Routes } from 'react-router-dom';
import { TradingSystemProvider } from '../../store/trading-system/TradingSystemProvider.tsx';
import { Layout } from './components/ConsoleChrome.tsx';
import { LocaleProvider } from './i18n.tsx';
import AgentPage from '../agent/AgentPage.tsx';
import BacktestPage from '../backtest/BacktestPage.tsx';
import DashboardPage from '../dashboard/DashboardPage.tsx';
import ExecutionPage from '../execution/ExecutionPage.tsx';
import MarketPage from '../market/MarketPage.tsx';
import NotificationsPage from '../notifications/NotificationsPage.tsx';
import RiskPage from '../risk/RiskPage.tsx';
import SettingsPage from '../settings/SettingsPage.tsx';
import StrategiesPage from '../strategies/StrategiesPage.tsx';

export default function DashboardConsole() {
  return (
    <LocaleProvider>
      <TradingSystemProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/strategies" element={<StrategiesPage />} />
            <Route path="/backtest" element={<BacktestPage />} />
            <Route path="/risk" element={<RiskPage />} />
            <Route path="/execution" element={<ExecutionPage />} />
            <Route path="/agent" element={<AgentPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/overview" element={<Navigate to="/dashboard" replace />} />
            <Route path="/signals" element={<Navigate to="/strategies" replace />} />
            <Route path="/portfolio" element={<Navigate to="/risk" replace />} />
            <Route path="/accounts" element={<Navigate to="/risk" replace />} />
            <Route path="/orders" element={<Navigate to="/execution" replace />} />
            <Route path="/strategy" element={<Navigate to="/strategies" replace />} />
            <Route path="/analysis" element={<Navigate to="/agent" replace />} />
          </Route>
        </Routes>
      </TradingSystemProvider>
    </LocaleProvider>
  );
}
