// @ts-nocheck
import { applyBrokerSnapshot, applyRemoteOrderSubmissions } from '../execution/index.js';
import { applyQuotePatch, updateTicker } from '../market/index.js';
import { riskOffIfNeeded } from '../risk/index.js';
import {
  chinaNow,
  cloneState,
  computeAccount,
  logEvent,
} from '../core/shared.js';
import { executeStrategy } from '../strategy/index.js';

export function applyControlPlaneResolution(state, resolution) {
  const previousCycleId = state.controlPlane.lastCycleId;
  state.controlPlane = {
    ...resolution.controlPlane,
  };
  state.integrationStatus.broker.connected = resolution.brokerHealth.connected;
  state.integrationStatus.broker.message = resolution.brokerExecution.message || resolution.controlPlane.routeHint;
  if (resolution.controlPlane.routeHint) {
    state.routeCopy = resolution.controlPlane.routeHint;
  }
  applyRemoteOrderSubmissions(state, resolution.brokerExecution.submittedOrders || []);
  (resolution.brokerExecution.rejectedOrders || []).forEach((order) => {
    logEvent(state, 'info', `Remote order rejected ${order.symbol}`, `${order.side} ${order.qty} shares were rejected by broker.`);
  });
  applyBrokerSnapshot(state, resolution.brokerExecution.snapshot);
  computeAccount(state.accounts.paper, state.stockStates);
  computeAccount(state.accounts.live, state.stockStates);
  if (resolution.cycle?.id && resolution.cycle.id !== previousCycleId) {
    logEvent(
      state,
      'info',
      `Control plane synced cycle ${resolution.cycle.cycle}`,
      resolution.controlPlane.routeHint || `Control plane status ${resolution.controlPlane.lastStatus}.`
    );
  }
}

export function buildCyclePayload(state) {
  return {
    cycle: state.cycle,
    mode: state.mode,
    riskLevel: state.riskLevel,
    decisionSummary: state.decisionSummary,
    marketClock: state.marketClock,
    pendingApprovals: state.approvalQueue.length,
    liveIntentCount: state.pendingLiveIntents.length,
    brokerConnected: state.integrationStatus.broker.connected,
    marketConnected: state.integrationStatus.marketData.connected,
    liveTradeEnabled: state.toggles.liveTrade,
    pendingLiveIntents: state.pendingLiveIntents,
  };
}

function reconcileLiveIntents(state, riskIntents, strategyIntents) {
  const nextPendingMap = new Map();
  const nextApprovalMap = new Map();

  state.pendingLiveIntents.forEach((order) => {
    if (order.clientOrderId) {
      nextPendingMap.set(order.clientOrderId, order);
    }
  });
  state.approvalQueue.forEach((order) => {
    if (order.clientOrderId) {
      nextApprovalMap.set(order.clientOrderId, order);
    }
  });

  const newlyCreatedIntents = [...riskIntents, ...strategyIntents];
  if (state.toggles.manualApproval) {
    newlyCreatedIntents.forEach((order) => {
      if (order.clientOrderId) {
        nextApprovalMap.set(order.clientOrderId, order);
      }
    });
  } else {
    newlyCreatedIntents.forEach((order) => {
      if (order.clientOrderId) {
        nextPendingMap.set(order.clientOrderId, order);
      }
    });
    state.approvalQueue.forEach((order) => {
      if (order.clientOrderId) {
        nextPendingMap.set(order.clientOrderId, order);
      }
    });
    nextApprovalMap.clear();
  }

  state.pendingLiveIntents = Array.from(nextPendingMap.values());
  state.approvalQueue = Array.from(nextApprovalMap.values());
}

export function advanceLocalState(previousState, { marketSnapshot, brokerSupportsRemoteExecution }) {
  const state = cloneState(previousState);
  state.cycle += 1;
  const now = chinaNow();
  state.marketClock = `${now.date} ${now.time}`;
  state.engineStatus = state.mode === 'manual' ? 'MANUAL READY' : 'LIVE EXECUTION';
  state.stockStates.forEach((stock, index) => updateTicker(stock, index, state.cycle, state.toggles.riskGuard, state.stockStates.length, state.config));
  state.integrationStatus.marketData = {
    provider: state.integrationStatus.marketData.provider,
    label: marketSnapshot.label || state.integrationStatus.marketData.label,
    connected: marketSnapshot.connected,
    message: marketSnapshot.message,
  };
  applyQuotePatch(state.stockStates, marketSnapshot.quotes || [], state.config);

  const riskIntents = riskOffIfNeeded(state, brokerSupportsRemoteExecution);
  const { liveIntents } = executeStrategy(state, brokerSupportsRemoteExecution);
  reconcileLiveIntents(state, riskIntents, liveIntents);
  computeAccount(state.accounts.paper, state.stockStates);
  computeAccount(state.accounts.live, state.stockStates);
  return state;
}
