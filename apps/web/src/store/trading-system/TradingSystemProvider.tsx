import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { runtimeConfig } from '../../app/config/runtime.ts';
import { fetchOperatorSession, reportOperatorAction, runStateCycle } from '../../app/api/controlPlane.ts';
import { createBrokerProvider } from '../../app/providers/broker.ts';
import { createMarketDataProvider } from '../../app/providers/marketData.ts';
import type { OperatorSession, TradingState, TradingSystemContextValue } from '@shared-types/trading.ts';
import { APP_CONFIG, applyBrokerSnapshot, cloneState, computeAccount, createInitialState, logEvent } from './core.ts';

const TradingSystemContext = createContext<TradingSystemContextValue | null>(null);

export function TradingSystemProvider({ children }: { children: React.ReactNode }) {
  const providersRef = useRef({
    marketData: createMarketDataProvider(runtimeConfig),
    broker: createBrokerProvider(runtimeConfig),
  });
  const [state, setState] = useState(() => createInitialState(providersRef.current));
  const [session, setSession] = useState<OperatorSession | null>(null);
  const stateRef = useRef(state);
  const busyRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    fetchOperatorSession().then(setSession).catch(() => null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runCycle = async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const result = await runStateCycle(stateRef.current).catch(() => null);
        if (!cancelled) {
          const nextState = result?.state || stateRef.current;
          stateRef.current = nextState;
          setState(nextState);
        }
      } finally {
        busyRef.current = false;
      }
    };

    runCycle();
    timerRef.current = window.setInterval(runCycle, APP_CONFIG.refreshMs);
    return () => {
      cancelled = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const hasPermission = (permission: string) => Boolean(session?.user.permissions.includes(permission));
  const togglePermissionMap: Record<keyof TradingState['toggles'], string> = {
    autoTrade: 'strategy:write',
    liveTrade: 'execution:approve',
    riskGuard: 'risk:review',
    manualApproval: 'execution:approve',
  };

  const setMode = (mode: TradingState['mode']) => {
    if (!hasPermission('strategy:write')) return;
    setState((current) => {
      const next = { ...current, mode, engineStatus: mode === 'manual' ? 'MANUAL READY' : 'LIVE EXECUTION' };
      stateRef.current = next;
      return next;
    });
  };

  const updateToggle = (key: keyof TradingState['toggles'], value: boolean) => {
    if (!hasPermission(togglePermissionMap[key])) return;
    setState((current) => {
      const next = {
        ...current,
        toggles: { ...current.toggles, [key]: value },
      };
      stateRef.current = next;
      return next;
    });
  };

  const cancelLiveOrder = async (orderId: string) => {
    if (!hasPermission('execution:approve')) return;
    if (!providersRef.current.broker.supportsRemoteExecution || !orderId || busyRef.current) return;
    busyRef.current = true;
    try {
      const cancelSnapshot = await providersRef.current.broker.cancelOrder(orderId);
      const synced = await providersRef.current.broker.syncState({ state: stateRef.current });
      const nextState = cloneState(stateRef.current);
      nextState.integrationStatus.broker = {
        provider: providersRef.current.broker.id,
        label: providersRef.current.broker.label,
        connected: synced.connected,
        message: `${cancelSnapshot.message} ${synced.message}`.trim(),
      };
      logEvent(nextState, 'info', `Cancel request ${orderId}`, cancelSnapshot.message);
      reportOperatorAction({
        type: 'cancel-order',
        title: `Cancel request ${orderId}`,
        detail: cancelSnapshot.message,
      }).catch(() => null);
      applyBrokerSnapshot(nextState, synced);
      computeAccount(nextState.accounts.paper, nextState.stockStates);
      computeAccount(nextState.accounts.live, nextState.stockStates);
      stateRef.current = nextState;
      setState(nextState);
    } finally {
      busyRef.current = false;
    }
  };

  const approveLiveIntent = (clientOrderId: string) => {
    if (!hasPermission('execution:approve')) return;
    if (!clientOrderId) return;
    setState((current) => {
      const next = cloneState(current);
      const order = next.approvalQueue.find((item) => item.clientOrderId === clientOrderId);
      if (!order) return current;
      next.approvalQueue = next.approvalQueue.filter((item) => item.clientOrderId !== clientOrderId);
      next.pendingLiveIntents = [...next.pendingLiveIntents, order];
      logEvent(next, 'info', `Approval granted ${order.symbol}`, `${order.side} ${order.qty} shares moved to broker submission queue.`);
      reportOperatorAction({
        type: 'approve-intent',
        title: `Approval granted ${order.symbol}`,
        detail: `${order.side} ${order.qty} shares moved to broker submission queue.`,
        symbol: order.symbol,
      }).catch(() => null);
      stateRef.current = next;
      return next;
    });
  };

  const rejectLiveIntent = (clientOrderId: string) => {
    if (!hasPermission('execution:approve')) return;
    if (!clientOrderId) return;
    setState((current) => {
      const next = cloneState(current);
      const order = next.approvalQueue.find((item) => item.clientOrderId === clientOrderId);
      if (!order) return current;
      next.approvalQueue = next.approvalQueue.filter((item) => item.clientOrderId !== clientOrderId);
      logEvent(next, 'info', `Approval rejected ${order.symbol}`, `${order.side} ${order.qty} shares were rejected before broker submission.`);
      reportOperatorAction({
        type: 'reject-intent',
        title: `Approval rejected ${order.symbol}`,
        detail: `${order.side} ${order.qty} shares were rejected before broker submission.`,
        symbol: order.symbol,
        level: 'warn',
      }).catch(() => null);
      stateRef.current = next;
      return next;
    });
  };

  return (
    <TradingSystemContext.Provider value={{ state, session, hasPermission, setMode, updateToggle, cancelLiveOrder, approveLiveIntent, rejectLiveIntent }}>
      {children}
    </TradingSystemContext.Provider>
  );
}

export function useTradingSystem() {
  const context = useContext(TradingSystemContext);
  if (!context) throw new Error('useTradingSystem must be used inside TradingSystemProvider');
  return context;
}
