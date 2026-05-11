import type { OrderSide } from './order-lifecycle.ts';

export interface BrokerOrderRequest {
  clientOrderId: string;
  symbol: string;
  side: OrderSide;
  qty: number;
  price?: number;
  orderType: 'market' | 'limit' | 'stop';
  timeInForce: 'day' | 'gtc' | 'ioc';
}

export interface BrokerOrderStatus {
  clientOrderId: string;
  brokerId: string;
  status: 'new' | 'partially_filled' | 'filled' | 'cancelled' | 'rejected' | 'expired';
  filledQty: number;
  avgFillPrice: number;
  submittedAt: string;
  updatedAt: string;
  rejectReason?: string;
}

export interface BrokerPosition {
  symbol: string;
  qty: number;
  avgCost: number;
  marketValue: number;
  side: 'long' | 'short';
}

export interface BrokerAccount {
  cash: number;
  buyingPower: number;
  equity: number;
  currency: string;
}

export interface ReconciliationResult {
  aligned: boolean;
  mismatches: Array<{
    clientOrderId: string;
    field: string;
    local: string | number;
    broker: string | number;
  }>;
}

export interface BrokerAdapter {
  readonly name: string;
  readonly requiresServerEnv: boolean;

  submitOrder(request: BrokerOrderRequest): Promise<BrokerOrderStatus>;
  cancelOrder(clientOrderId: string): Promise<{ success: boolean; reason?: string }>;
  fetchOrderStatus(clientOrderId: string): Promise<BrokerOrderStatus | null>;
  fetchPositions(): Promise<BrokerPosition[]>;
  fetchAccount(): Promise<BrokerAccount>;
  reconcileFills(
    localOrders: Array<{ clientOrderId: string; filledQty: number; avgFillPrice: number }>
  ): Promise<ReconciliationResult>;
}

export function validateBrokerEnv(env: Record<string, string | undefined>, required: string[]): { valid: boolean; missing: string[] } {
  const missing = required.filter((key) => !env[key]);
  return { valid: missing.length === 0, missing };
}
