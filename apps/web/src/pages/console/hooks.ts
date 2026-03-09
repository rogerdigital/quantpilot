import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { rowsForPositions } from './utils.ts';

export type SettingsSection = 'system-mode' | 'switches' | 'policy' | 'integrations';

export function useSettingsNavigation() {
  const navigate = useNavigate();
  return (section: SettingsSection) => navigate(`/settings#${section}`);
}

export function onShortcutKeyDown(event: ReactKeyboardEvent<HTMLElement>, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
}

export function useSummary() {
  const { state } = useTradingSystem();
  const paper = state.accounts.paper;
  const live = state.accounts.live;
  const totalNav = paper.nav + live.nav;
  const totalBase = (paper.equitySeries[0]?.value || paper.nav) + (live.equitySeries[0]?.value || live.nav);
  const totalPnlPct = totalBase ? (totalNav / totalBase - 1) * 100 : 0;
  const positionCount = rowsForPositions(paper, state.stockStates).length + rowsForPositions(live, state.stockStates).length;
  return { paper, live, totalNav, totalPnlPct, positionCount };
}
