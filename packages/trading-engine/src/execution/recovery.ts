import type { BrokerAdapter } from './broker-adapter.js';
import type { AlgoOrder } from './order-lifecycle.js';
import { createRetryState, shouldRetry } from './retry-handler.js';

export type RecoveryCase =
  | 'submit_failed'
  | 'ack_lost'
  | 'partial_fill'
  | 'cancel_rejected'
  | 'position_mismatch'
  | 'gateway_restart';

export interface RecoveryAction {
  case: RecoveryCase;
  orderId: string;
  action: 'retry_submit' | 'query_status' | 'force_cancel' | 'reconcile' | 'escalate' | 'resume';
  detail: string;
  timestamp: string;
}

export interface RecoveryPlan {
  orderId: string;
  cases: RecoveryCase[];
  actions: RecoveryAction[];
  resolved: boolean;
  escalated: boolean;
}

export function diagnoseRecoveryCase(order: AlgoOrder, brokerReachable: boolean): RecoveryCase[] {
  const cases: RecoveryCase[] = [];

  if (order.status === 'pending' && !brokerReachable) {
    cases.push('submit_failed');
  }
  if (order.status === 'submitted' && order.lifecycleEvents.length <= 2) {
    cases.push('ack_lost');
  }
  if (order.status === 'partial_fill' && order.filledQty < order.totalQty) {
    cases.push('partial_fill');
  }
  if (order.cancelReason && order.status !== 'cancelled') {
    cases.push('cancel_rejected');
  }
  if (order.reconciliationStatus === 'mismatch') {
    cases.push('position_mismatch');
  }

  return cases;
}

export function buildRecoveryPlan(order: AlgoOrder, cases: RecoveryCase[]): RecoveryPlan {
  const now = new Date().toISOString();
  const actions: RecoveryAction[] = [];

  for (const c of cases) {
    switch (c) {
      case 'submit_failed':
        actions.push({
          case: c,
          orderId: order.id,
          action: 'retry_submit',
          detail: 'Retry order submission with backoff',
          timestamp: now,
        });
        break;
      case 'ack_lost':
        actions.push({
          case: c,
          orderId: order.id,
          action: 'query_status',
          detail: 'Query broker for order status',
          timestamp: now,
        });
        break;
      case 'partial_fill':
        actions.push({
          case: c,
          orderId: order.id,
          action: 'query_status',
          detail: 'Check for additional fills',
          timestamp: now,
        });
        break;
      case 'cancel_rejected':
        actions.push({
          case: c,
          orderId: order.id,
          action: 'force_cancel',
          detail: 'Attempt force cancel with broker',
          timestamp: now,
        });
        break;
      case 'position_mismatch':
        actions.push({
          case: c,
          orderId: order.id,
          action: 'reconcile',
          detail: 'Run full position reconciliation',
          timestamp: now,
        });
        break;
      case 'gateway_restart':
        actions.push({
          case: c,
          orderId: order.id,
          action: 'resume',
          detail: 'Resume from last known state after gateway restart',
          timestamp: now,
        });
        break;
    }
  }

  return { orderId: order.id, cases, actions, resolved: false, escalated: false };
}

export async function executeRecoveryAction(
  action: RecoveryAction,
  order: AlgoOrder,
  adapter: BrokerAdapter
): Promise<{ success: boolean; detail: string }> {
  const retryState = createRetryState();

  switch (action.action) {
    case 'retry_submit': {
      const { retry } = shouldRetry(retryState, 'submit_failed');
      if (!retry) {
        return { success: false, detail: 'Max retries exhausted for submit' };
      }
      try {
        const status = await adapter.submitOrder({
          clientOrderId: order.clientOrderId,
          symbol: order.symbol,
          side: order.side,
          qty: order.totalQty - order.filledQty,
          price: order.legs[0]?.price,
          orderType: 'limit',
          timeInForce: 'day',
        });
        return { success: status.status !== 'rejected', detail: `Resubmitted: ${status.status}` };
      } catch (e) {
        return {
          success: false,
          detail: `Submit failed: ${e instanceof Error ? e.message : 'unknown'}`,
        };
      }
    }
    case 'query_status': {
      const status = await adapter.fetchOrderStatus(order.clientOrderId);
      if (!status) {
        return { success: false, detail: 'Order not found at broker' };
      }
      return {
        success: true,
        detail: `Broker status: ${status.status}, filled: ${status.filledQty}`,
      };
    }
    case 'force_cancel': {
      const result = await adapter.cancelOrder(order.clientOrderId);
      return { success: result.success, detail: result.reason || 'Cancel successful' };
    }
    case 'reconcile': {
      const result = await adapter.reconcileFills([
        {
          clientOrderId: order.clientOrderId,
          filledQty: order.filledQty,
          avgFillPrice: order.avgFillPrice,
        },
      ]);
      return {
        success: result.aligned,
        detail: result.aligned
          ? 'Positions aligned'
          : `${result.mismatches.length} mismatches found`,
      };
    }
    case 'resume': {
      const status = await adapter.fetchOrderStatus(order.clientOrderId);
      if (status) {
        return { success: true, detail: `Resumed: broker says ${status.status}` };
      }
      return { success: true, detail: 'No broker state found, order may need resubmission' };
    }
    case 'escalate': {
      return { success: false, detail: 'Escalated to operator for manual intervention' };
    }
  }
}
