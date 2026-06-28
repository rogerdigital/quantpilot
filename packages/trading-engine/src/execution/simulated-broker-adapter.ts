import type {
  BrokerAccount,
  BrokerAdapter,
  BrokerOrderRequest,
  BrokerOrderStatus,
  BrokerPosition,
  ReconciliationResult,
} from './broker-adapter.js';

export function createSimulatedBrokerAdapter(opts?: {
  latencyMs?: number;
  failRate?: number;
  seed?: number;
}): BrokerAdapter {
  const latencyMs = opts?.latencyMs ?? 0;
  const failRate = opts?.failRate ?? 0;
  let seqNum = opts?.seed ?? 1;

  const orders = new Map<string, BrokerOrderStatus>();
  const positions = new Map<string, { qty: number; avgCost: number; side: 'long' | 'short' }>();
  let cash = 1_000_000;

  function nextId(): string {
    return `sim-${seqNum++}`;
  }

  function shouldFail(): boolean {
    return failRate > 0 && Math.random() < failRate;
  }

  async function delay(): Promise<void> {
    if (latencyMs > 0) {
      await new Promise((r) => setTimeout(r, latencyMs));
    }
  }

  return {
    name: 'simulated',
    requiresServerEnv: false,

    async submitOrder(request: BrokerOrderRequest): Promise<BrokerOrderStatus> {
      await delay();
      if (shouldFail()) {
        const status: BrokerOrderStatus = {
          clientOrderId: request.clientOrderId,
          brokerId: nextId(),
          status: 'rejected',
          filledQty: 0,
          avgFillPrice: 0,
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rejectReason: 'Simulated rejection',
        };
        orders.set(request.clientOrderId, status);
        return status;
      }

      const fillPrice = request.price ?? 100;
      const status: BrokerOrderStatus = {
        clientOrderId: request.clientOrderId,
        brokerId: nextId(),
        status: 'filled',
        filledQty: request.qty,
        avgFillPrice: fillPrice,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      orders.set(request.clientOrderId, status);

      const existing = positions.get(request.symbol);
      if (request.side === 'BUY') {
        const prevQty = existing?.qty ?? 0;
        const prevCost = existing?.avgCost ?? 0;
        const newQty = prevQty + request.qty;
        const newAvgCost =
          newQty > 0 ? (prevCost * prevQty + fillPrice * request.qty) / newQty : fillPrice;
        positions.set(request.symbol, { qty: newQty, avgCost: newAvgCost, side: 'long' });
        cash -= fillPrice * request.qty;
      } else {
        const prevQty = existing?.qty ?? 0;
        const newQty = prevQty - request.qty;
        if (newQty <= 0) {
          positions.delete(request.symbol);
        } else {
          positions.set(request.symbol, {
            qty: newQty,
            avgCost: existing?.avgCost ?? 0,
            side: 'long',
          });
        }
        cash += fillPrice * request.qty;
      }

      return status;
    },

    async cancelOrder(clientOrderId: string): Promise<{ success: boolean; reason?: string }> {
      await delay();
      const order = orders.get(clientOrderId);
      if (!order) {
        return { success: false, reason: 'Order not found' };
      }
      if (order.status === 'filled' || order.status === 'cancelled') {
        return { success: false, reason: `Cannot cancel order in status ${order.status}` };
      }
      order.status = 'cancelled';
      order.updatedAt = new Date().toISOString();
      return { success: true };
    },

    async fetchOrderStatus(clientOrderId: string): Promise<BrokerOrderStatus | null> {
      await delay();
      return orders.get(clientOrderId) ?? null;
    },

    async fetchPositions(): Promise<BrokerPosition[]> {
      await delay();
      const result: BrokerPosition[] = [];
      for (const [symbol, pos] of positions.entries()) {
        result.push({
          symbol,
          qty: pos.qty,
          avgCost: pos.avgCost,
          // This simulated adapter has no live price feed, so marketValue is
          // reported as cost basis (qty * avgCost). Callers needing true mark-
          // to-market exposure should not rely on this field from the simulator.
          marketValue: pos.qty * pos.avgCost,
          side: pos.side,
        });
      }
      return result;
    },

    async fetchAccount(): Promise<BrokerAccount> {
      await delay();
      let equity = cash;
      for (const pos of positions.values()) {
        equity += pos.qty * pos.avgCost;
      }
      return { cash, buyingPower: cash, equity, currency: 'USD' };
    },

    async reconcileFills(
      localOrders: Array<{ clientOrderId: string; filledQty: number; avgFillPrice: number }>
    ): Promise<ReconciliationResult> {
      await delay();
      const mismatches: ReconciliationResult['mismatches'] = [];
      for (const local of localOrders) {
        const broker = orders.get(local.clientOrderId);
        if (!broker) continue;
        if (broker.filledQty !== local.filledQty) {
          mismatches.push({
            clientOrderId: local.clientOrderId,
            field: 'filledQty',
            local: local.filledQty,
            broker: broker.filledQty,
          });
        }
        if (Math.abs(broker.avgFillPrice - local.avgFillPrice) > 0.01) {
          mismatches.push({
            clientOrderId: local.clientOrderId,
            field: 'avgFillPrice',
            local: local.avgFillPrice,
            broker: broker.avgFillPrice,
          });
        }
      }
      return { aligned: mismatches.length === 0, mismatches };
    },
  };
}
