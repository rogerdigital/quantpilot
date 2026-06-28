import {
  type AlgoOrder,
  createAlgoOrder,
  type OrderLeg,
  type OrderSide,
  transitionOrder,
} from './order-lifecycle.js';

export interface TwapParams {
  symbol: string;
  side: OrderSide;
  totalQty: number;
  durationMinutes: number;
  numSlices: number;
  priceLimit?: number;
  timeout?: number;
}

export interface VwapParams {
  symbol: string;
  side: OrderSide;
  totalQty: number;
  volumeProfile: number[];
  participationRate: number;
  priceLimit?: number;
  timeout?: number;
}

export interface IcebergParams {
  symbol: string;
  side: OrderSide;
  totalQty: number;
  displayQty: number;
  priceLimit?: number;
  variancePct?: number;
  timeout?: number;
}

export function createTwapOrder(params: TwapParams): AlgoOrder {
  const { symbol, side, totalQty, durationMinutes, numSlices, priceLimit, timeout } = params;
  const order = createAlgoOrder(
    `twap-${Date.now()}`,
    'twap',
    symbol,
    side,
    totalQty,
    { durationMinutes, numSlices, priceLimit: priceLimit ?? 0 },
    timeout
  );

  // Never produce more slices than shares: otherwise floor(totalQty/numSlices)
  // is 0 and the order would be littered with zero-quantity legs.
  const effectiveSlices = Math.max(1, Math.min(numSlices, totalQty));
  const sliceQty = Math.floor(totalQty / effectiveSlices);
  const remainder = totalQty - sliceQty * effectiveSlices;
  const intervalMs = (durationMinutes * 60 * 1000) / effectiveSlices;

  for (let i = 0; i < effectiveSlices; i++) {
    const qty = i === effectiveSlices - 1 ? sliceQty + remainder : sliceQty;
    order.legs.push({
      symbol,
      side,
      qty,
      price: priceLimit,
      filledQty: 0,
      filledAvgPrice: 0,
      status: 'pending',
      submittedAt: new Date(Date.now() + i * intervalMs).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return order;
}

export function createVwapOrder(params: VwapParams): AlgoOrder {
  const { symbol, side, totalQty, volumeProfile, participationRate, priceLimit, timeout } = params;
  const order = createAlgoOrder(
    `vwap-${Date.now()}`,
    'vwap',
    symbol,
    side,
    totalQty,
    { participationRate, priceLimit: priceLimit ?? 0 },
    timeout
  );

  const totalVolume = volumeProfile.reduce((s, v) => s + v, 0);
  if (totalVolume <= 0) {
    order.legs.push({
      symbol,
      side,
      qty: totalQty,
      price: priceLimit,
      filledQty: 0,
      filledAvgPrice: 0,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return order;
  }

  let allocated = 0;
  for (let i = 0; i < volumeProfile.length; i++) {
    const share = volumeProfile[i] / totalVolume;
    const targetQty = Math.round(totalQty * share * participationRate);
    const qty = i === volumeProfile.length - 1 ? totalQty - allocated : Math.max(1, targetQty);
    allocated += qty;

    order.legs.push({
      symbol,
      side,
      qty,
      price: priceLimit,
      filledQty: 0,
      filledAvgPrice: 0,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return order;
}

export function createIcebergOrder(params: IcebergParams): AlgoOrder {
  const { symbol, side, totalQty, displayQty, priceLimit, variancePct, timeout } = params;
  const order = createAlgoOrder(
    `iceberg-${Date.now()}`,
    'iceberg',
    symbol,
    side,
    totalQty,
    { displayQty, priceLimit: priceLimit ?? 0, variancePct: variancePct ?? 0 },
    timeout
  );

  const numLegs = Math.ceil(totalQty / displayQty);
  let allocated = 0;

  for (let i = 0; i < numLegs; i++) {
    const remaining = totalQty - allocated;
    const baseQty = Math.min(displayQty, remaining);

    let qty = baseQty;
    if (variancePct && variancePct > 0 && i < numLegs - 1) {
      const variance = baseQty * (variancePct / 100);
      qty = Math.max(1, Math.round(baseQty + (Math.random() - 0.5) * 2 * variance));
      qty = Math.min(qty, remaining);
    } else {
      // Final leg absorbs whatever remains so the legs always sum to totalQty
      // (otherwise order-lifecycle can never reach 'filled').
      qty = remaining;
    }

    allocated += qty;

    order.legs.push({
      symbol,
      side,
      qty,
      price: priceLimit,
      filledQty: 0,
      filledAvgPrice: 0,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return order;
}

export function getNextExecutableLeg(order: AlgoOrder): { leg: OrderLeg; index: number } | null {
  for (let i = 0; i < order.legs.length; i++) {
    const leg = order.legs[i];
    if (leg.status === 'pending') {
      return { leg, index: i };
    }
  }
  return null;
}

export function cancelRemainingLegs(order: AlgoOrder, reason: string): void {
  for (const leg of order.legs) {
    if (leg.status === 'pending') {
      leg.status = 'cancelled';
      leg.rejectReason = reason;
      leg.updatedAt = new Date().toISOString();
    }
  }
  transitionOrder(order, 'cancelled', reason);
}

export function getExecutionProgress(order: AlgoOrder): {
  totalQty: number;
  filledQty: number;
  remainingQty: number;
  fillPct: number;
  legsSubmitted: number;
  legsFilled: number;
  legsPending: number;
} {
  const filledQty = order.legs.reduce((s, l) => s + l.filledQty, 0);
  const legsSubmitted = order.legs.filter((l) => l.status !== 'pending').length;
  const legsFilled = order.legs.filter((l) => l.status === 'filled').length;
  const legsPending = order.legs.filter((l) => l.status === 'pending').length;

  return {
    totalQty: order.totalQty,
    filledQty,
    remainingQty: order.totalQty - filledQty,
    fillPct: order.totalQty > 0 ? (filledQty / order.totalQty) * 100 : 0,
    legsSubmitted,
    legsFilled,
    legsPending,
  };
}

export type AlgoStrategy = 'twap' | 'vwap' | 'iceberg';
