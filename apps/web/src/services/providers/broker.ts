import type { BrokerOrder, BrokerProvider, BrokerSnapshot, RuntimeConfig } from '@shared-types/trading.ts';

function resolveBrowserBrokerBase(config: RuntimeConfig): string {
  if (config.brokerHttpUrl) return config.brokerHttpUrl.replace(/\/$/, '');
  return new URL('/api/broker', window.location.origin).toString();
}

function simulatedBroker(): BrokerProvider {
  return {
    id: 'simulated',
    label: 'Local Simulated Broker',
    supportsRemoteExecution: false,
    async submitOrders(): Promise<{ connected: boolean; message: string; orders: BrokerOrder[]; rejectedOrders?: BrokerOrder[] }> {
      return {
        connected: true,
        message: 'Using the local simulated broker to execute orders.',
        orders: [],
        rejectedOrders: [],
      };
    },
    async syncState(): Promise<BrokerSnapshot> {
      return {
        connected: true,
        message: 'Using the local simulated broker for execution and fills.',
      };
    },
    async cancelOrder(): Promise<{ connected: boolean; message: string }> {
      return {
        connected: true,
        message: 'The local simulated broker has no remote cancel action.',
      };
    },
  };
}

function customHttpBroker(config: RuntimeConfig): BrokerProvider {
  const baseUrl = resolveBrowserBrokerBase(config);
  return {
    id: 'custom-http',
    label: 'HTTP Broker Gateway',
    supportsRemoteExecution: true,
    async submitOrders({ orders }: { orders: BrokerOrder[] }): Promise<{ connected: boolean; message: string; orders: BrokerOrder[]; rejectedOrders?: BrokerOrder[] }> {
      try {
        const response = await fetch(`${baseUrl}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            orders,
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        return {
          connected: true,
          message: payload?.message || `Broker gateway synced ${orders.length} orders.`,
          orders: Array.isArray(payload?.orders) ? payload.orders : [],
          rejectedOrders: Array.isArray(payload?.rejectedOrders) ? payload.rejectedOrders : [],
        };
      } catch (error) {
        return {
          connected: false,
          message: `Broker gateway unavailable. Keeping local mirrored execution. ${error instanceof Error ? error.message : 'unknown error'}`,
          orders: [],
          rejectedOrders: [],
        };
      }
    },
    async syncState(): Promise<BrokerSnapshot> {
      try {
        const response = await fetch(`${baseUrl}/state`, {
          headers: {
            Accept: 'application/json',
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        return {
          connected: true,
          message: payload?.message || 'Broker gateway state sync succeeded.',
          account: payload?.account || null,
          positions: Array.isArray(payload?.positions) ? payload.positions : [],
          orders: Array.isArray(payload?.orders) ? payload.orders : [],
        };
      } catch (error) {
        return {
          connected: false,
          message: `Broker state sync failed. ${error instanceof Error ? error.message : 'unknown error'}`,
        };
      }
    },
    async cancelOrder(orderId: string): Promise<{ connected: boolean; message: string }> {
      try {
        const response = await fetch(`${baseUrl}/orders/${orderId}`, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return {
          connected: true,
          message: `Broker gateway submitted a cancel request for ${orderId}.`,
        };
      } catch (error) {
        return {
          connected: false,
          message: `Broker cancel failed. ${error instanceof Error ? error.message : 'unknown error'}`,
        };
      }
    },
  };
}

function normalizeAlpacaOrder(order: any): BrokerOrder {
  return {
    id: order.id,
    clientOrderId: order.client_order_id,
    side: String(order.side || '').toUpperCase(),
    symbol: order.symbol,
    qty: Number(order.qty || 0),
    filledQty: Number(order.filled_qty || 0),
    filledAvgPrice: Number(order.filled_avg_price || 0),
    status: order.status || 'unknown',
    submittedAt: order.submitted_at || '',
    updatedAt: order.updated_at || order.submitted_at || '',
    cancelable: ['new', 'accepted', 'pending_new', 'partially_filled'].includes(order.status),
    source: 'alpaca',
  };
}

function normalizeAlpacaPosition(position: any) {
  return {
    symbol: position.symbol,
    qty: Number(position.qty || 0),
    avgCost: Number(position.avg_entry_price || 0),
    marketValue: Number(position.market_value || 0),
  };
}

function alpacaBroker(config: RuntimeConfig): BrokerProvider {
  const baseUrl = `${config.alpacaProxyBase}/broker`;
  return {
    id: 'alpaca',
    label: 'Alpaca Trading API via Gateway',
    supportsRemoteExecution: true,
    async submitOrders({ orders }: { orders: BrokerOrder[] }): Promise<{ connected: boolean; message: string; orders: BrokerOrder[]; rejectedOrders?: BrokerOrder[] }> {
      if (!orders.length) {
        return {
          connected: true,
          message: 'No new remote orders in this cycle.',
          orders: [],
          rejectedOrders: [],
        };
      }
      try {
        const response = await fetch(`${baseUrl}/orders`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orders }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const results = Array.isArray(payload?.orders) ? payload.orders.map(normalizeAlpacaOrder) : [];
        return {
          connected: true,
          message: payload?.message || `Alpaca accepted ${results.length} orders.`,
          orders: results,
          rejectedOrders: Array.isArray(payload?.rejectedOrders) ? payload.rejectedOrders : [],
        };
      } catch (error) {
        return {
          connected: false,
          message: `Alpaca order submission failed. ${error instanceof Error ? error.message : 'unknown error'}`,
          orders: [],
          rejectedOrders: [],
        };
      }
    },
    async syncState(): Promise<BrokerSnapshot> {
      try {
        const response = await fetch(`${baseUrl}/state`, {
          headers: {
            Accept: 'application/json',
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        return {
          connected: true,
          message: payload?.message || 'Alpaca account, positions, and order state sync succeeded.',
          account: {
            cash: Number(payload?.account?.cash || 0),
            buyingPower: Number(payload?.account?.buyingPower || 0),
            equity: Number(payload?.account?.equity || 0),
          },
          positions: Array.isArray(payload?.positions) ? payload.positions.map(normalizeAlpacaPosition) : [],
          orders: Array.isArray(payload?.orders) ? payload.orders.map(normalizeAlpacaOrder) : [],
        };
      } catch (error) {
        return {
          connected: false,
          message: `Alpaca state sync failed. ${error instanceof Error ? error.message : 'unknown error'}`,
        };
      }
    },
    async cancelOrder(orderId: string): Promise<{ connected: boolean; message: string }> {
      try {
        const response = await fetch(`${baseUrl}/orders/${orderId}`, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        return {
          connected: true,
          message: payload?.message || `Alpaca submitted a cancel request for ${orderId}.`,
        };
      } catch (error) {
        return {
          connected: false,
          message: `Alpaca cancel failed. ${error instanceof Error ? error.message : 'unknown error'}`,
        };
      }
    },
  };
}

export function createBrokerProvider(config: RuntimeConfig): BrokerProvider {
  if (config.brokerProvider === 'alpaca') return alpacaBroker(config);
  if (config.brokerProvider === 'custom-http') return customHttpBroker(config);
  return simulatedBroker();
}
