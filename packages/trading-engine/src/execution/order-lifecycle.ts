export type OrderStatus =
  | 'pending'
  | 'submitted'
  | 'partial_fill'
  | 'filled'
  | 'cancelled'
  | 'rejected'
  | 'expired';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';
export type TimeInForce = 'day' | 'gtc' | 'ioc' | 'fok';

export type LifecycleEventType =
  | 'created'
  | 'submitted'
  | 'acknowledged'
  | 'partial_fill'
  | 'filled'
  | 'cancelled'
  | 'rejected'
  | 'expired'
  | 'reconciled'
  | 'mismatch';

export interface LifecycleEvent {
  type: LifecycleEventType;
  timestamp: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}

export interface OrderLeg {
  symbol: string;
  side: OrderSide;
  qty: number;
  price?: number;
  filledQty: number;
  filledAvgPrice: number;
  status: OrderStatus;
  rejectReason?: string;
  submittedAt: string;
  updatedAt: string;
}

export interface AlgoOrder {
  id: string;
  clientOrderId: string;
  strategy: 'twap' | 'vwap' | 'iceberg';
  symbol: string;
  side: OrderSide;
  totalQty: number;
  filledQty: number;
  avgFillPrice: number;
  status: OrderStatus;
  legs: OrderLeg[];
  params: Record<string, number | string>;
  lifecycleEvents: LifecycleEvent[];
  strategyVersion?: string;
  promotionRequestId?: string;
  riskAssessmentId?: string;
  brokerAccountId?: string;
  reconciliationStatus?: 'aligned' | 'mismatch' | 'pending';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelReason?: string;
  rejectReason?: string;
  timeout?: number;
}

export interface TransitionResult {
  success: boolean;
  previousStatus: OrderStatus;
  currentStatus: OrderStatus;
  error?: string;
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['submitted', 'cancelled', 'rejected'],
  submitted: ['partial_fill', 'filled', 'cancelled', 'rejected', 'expired'],
  partial_fill: ['partial_fill', 'filled', 'cancelled', 'rejected', 'expired'],
  filled: [],
  cancelled: [],
  rejected: [],
  expired: [],
};

export function validateTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionOrder(
  order: AlgoOrder,
  newStatus: OrderStatus,
  reason?: string
): TransitionResult {
  const previousStatus = order.status;
  if (!validateTransition(previousStatus, newStatus)) {
    return {
      success: false,
      previousStatus,
      currentStatus: previousStatus,
      error: `Invalid transition: ${previousStatus} -> ${newStatus}`,
    };
  }

  order.status = newStatus;
  order.updatedAt = new Date().toISOString();

  order.lifecycleEvents.push({
    type: newStatus as LifecycleEventType,
    timestamp: order.updatedAt,
    detail: reason,
  });

  if (newStatus === 'cancelled') {
    order.cancelReason = reason;
  }
  if (newStatus === 'rejected') {
    order.rejectReason = reason;
  }
  if (
    newStatus === 'filled' ||
    newStatus === 'cancelled' ||
    newStatus === 'rejected' ||
    newStatus === 'expired'
  ) {
    order.completedAt = order.updatedAt;
  }

  return { success: true, previousStatus, currentStatus: newStatus };
}

export function updateLegFill(leg: OrderLeg, filledQty: number, fillPrice: number): void {
  const prevFilled = leg.filledQty;
  const totalFilled = prevFilled + filledQty;

  leg.filledAvgPrice =
    prevFilled === 0
      ? fillPrice
      : (leg.filledAvgPrice * prevFilled + fillPrice * filledQty) / totalFilled;
  leg.filledQty = totalFilled;
  leg.updatedAt = new Date().toISOString();

  if (totalFilled >= leg.qty) {
    leg.status = 'filled';
  } else if (totalFilled > 0) {
    leg.status = 'partial_fill';
  }
}

export function updateAlgoFill(
  order: AlgoOrder,
  legIndex: number,
  filledQty: number,
  fillPrice: number
): TransitionResult {
  const leg = order.legs[legIndex];
  if (!leg) {
    return {
      success: false,
      previousStatus: order.status,
      currentStatus: order.status,
      error: `Leg index ${legIndex} out of bounds`,
    };
  }

  updateLegFill(leg, filledQty, fillPrice);

  const totalFilled = order.legs.reduce((sum, l) => sum + l.filledQty, 0);
  const totalCost = order.legs.reduce((sum, l) => sum + l.filledQty * l.filledAvgPrice, 0);

  order.filledQty = totalFilled;
  order.avgFillPrice = totalFilled > 0 ? totalCost / totalFilled : 0;

  if (totalFilled >= order.totalQty) {
    return transitionOrder(order, 'filled');
  }
  if (totalFilled > 0) {
    return transitionOrder(order, 'partial_fill');
  }

  return { success: true, previousStatus: order.status, currentStatus: order.status };
}

export function checkTimeout(order: AlgoOrder): boolean {
  if (
    !order.timeout ||
    order.status === 'filled' ||
    order.status === 'cancelled' ||
    order.status === 'rejected'
  ) {
    return false;
  }

  const createdAt = new Date(order.createdAt).getTime();
  const now = Date.now();
  return now - createdAt > order.timeout;
}

export function isTerminal(status: OrderStatus): boolean {
  return (
    status === 'filled' || status === 'cancelled' || status === 'rejected' || status === 'expired'
  );
}

export function isActive(status: OrderStatus): boolean {
  return status === 'pending' || status === 'submitted' || status === 'partial_fill';
}

export function createAlgoOrder(
  id: string,
  strategy: AlgoOrder['strategy'],
  symbol: string,
  side: OrderSide,
  totalQty: number,
  params: Record<string, number | string>,
  timeout?: number,
  evidence?: {
    strategyVersion?: string;
    promotionRequestId?: string;
    riskAssessmentId?: string;
    brokerAccountId?: string;
  }
): AlgoOrder {
  const now = new Date().toISOString();
  return {
    id,
    clientOrderId: `algo-${strategy}-${symbol}-${id}`,
    strategy,
    symbol,
    side,
    totalQty,
    filledQty: 0,
    avgFillPrice: 0,
    status: 'pending',
    legs: [],
    params,
    lifecycleEvents: [{ type: 'created', timestamp: now }],
    strategyVersion: evidence?.strategyVersion,
    promotionRequestId: evidence?.promotionRequestId,
    riskAssessmentId: evidence?.riskAssessmentId,
    brokerAccountId: evidence?.brokerAccountId,
    reconciliationStatus: 'pending',
    createdAt: now,
    updatedAt: now,
    timeout,
  };
}

export function reconcileOrder(
  order: AlgoOrder,
  brokerFilledQty: number,
  brokerAvgPrice: number
): { aligned: boolean; detail: string } {
  const localFilled = order.filledQty;
  const qtyMatch = localFilled === brokerFilledQty;
  const priceMatch =
    order.avgFillPrice === 0 ||
    brokerAvgPrice === 0 ||
    Math.abs(order.avgFillPrice - brokerAvgPrice) < 0.01;
  const aligned = qtyMatch && priceMatch;

  order.reconciliationStatus = aligned ? 'aligned' : 'mismatch';
  const eventType = aligned ? 'reconciled' : 'mismatch';
  const detail = aligned
    ? `Reconciled: ${brokerFilledQty} @ ${brokerAvgPrice}`
    : `Mismatch: local ${localFilled} @ ${order.avgFillPrice}, broker ${brokerFilledQty} @ ${brokerAvgPrice}`;

  order.lifecycleEvents.push({
    type: eventType,
    timestamp: new Date().toISOString(),
    detail,
  });

  return { aligned, detail };
}
