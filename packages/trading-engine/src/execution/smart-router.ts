export type Venue = 'alpaca' | 'arca' | 'nasdaq' | 'nyse' | 'bats' | 'iex';

export interface VenueConfig {
  venue: Venue;
  priority: number;
  makerFee: number;
  takerFee: number;
  fillRate: number;
  avgLatencyMs: number;
  enabled: boolean;
}

export interface RoutingDecision {
  venue: Venue;
  reason: string;
  estimatedCost: number;
  estimatedLatency: number;
}

export interface RouteRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price?: number;
  orderType: 'market' | 'limit';
  urgency: 'low' | 'medium' | 'high';
}

const VENUE_CONFIGS: VenueConfig[] = [
  {
    venue: 'alpaca',
    priority: 1,
    makerFee: 0,
    takerFee: 0,
    fillRate: 0.98,
    avgLatencyMs: 50,
    enabled: true,
  },
  {
    venue: 'arca',
    priority: 2,
    makerFee: -0.0015,
    takerFee: 0.003,
    fillRate: 0.95,
    avgLatencyMs: 30,
    enabled: true,
  },
  {
    venue: 'nasdaq',
    priority: 3,
    makerFee: -0.002,
    takerFee: 0.003,
    fillRate: 0.96,
    avgLatencyMs: 25,
    enabled: true,
  },
  {
    venue: 'nyse',
    priority: 4,
    makerFee: -0.0015,
    takerFee: 0.003,
    fillRate: 0.94,
    avgLatencyMs: 35,
    enabled: true,
  },
  {
    venue: 'bats',
    priority: 5,
    makerFee: -0.002,
    takerFee: 0.0025,
    fillRate: 0.93,
    avgLatencyMs: 20,
    enabled: true,
  },
  {
    venue: 'iex',
    priority: 6,
    makerFee: 0,
    takerFee: 0.0009,
    fillRate: 0.9,
    avgLatencyMs: 100,
    enabled: true,
  },
];

function calculateVenueScore(config: VenueConfig, request: RouteRequest): number {
  let score = 0;

  if (request.urgency === 'high') {
    score += (1 - config.avgLatencyMs / 200) * 40;
    score += config.fillRate * 30;
    score += (1 - config.takerFee / 0.005) * 20;
  } else if (request.urgency === 'medium') {
    score += config.fillRate * 35;
    score += (1 - config.takerFee / 0.005) * 35;
    score += (1 - config.avgLatencyMs / 200) * 15;
  } else {
    score += (1 - config.takerFee / 0.005) * 40;
    score += config.fillRate * 25;
    score += (1 - config.avgLatencyMs / 200) * 10;
  }

  if (request.orderType === 'limit') {
    score += config.makerFee < 0 ? Math.abs(config.makerFee) * 500 : 0;
  }

  return score;
}

export function routeOrder(request: RouteRequest): RoutingDecision {
  const enabledVenues = VENUE_CONFIGS.filter((v) => v.enabled);

  if (enabledVenues.length === 0) {
    return {
      venue: 'alpaca',
      reason: 'No venues available, defaulting to Alpaca',
      estimatedCost: 0,
      estimatedLatency: 100,
    };
  }

  let bestVenue = enabledVenues[0];
  let bestScore = calculateVenueScore(bestVenue, request);

  for (let i = 1; i < enabledVenues.length; i++) {
    const score = calculateVenueScore(enabledVenues[i], request);
    if (score > bestScore) {
      bestScore = score;
      bestVenue = enabledVenues[i];
    }
  }

  const tradeValue = request.qty * (request.price || 0);
  const fee = request.orderType === 'limit' ? bestVenue.makerFee : bestVenue.takerFee;
  const estimatedCost = Math.abs(tradeValue * fee);

  return {
    venue: bestVenue.venue,
    reason: buildRoutingReason(bestVenue, request),
    estimatedCost,
    estimatedLatency: bestVenue.avgLatencyMs,
  };
}

function buildRoutingReason(config: VenueConfig, request: RouteRequest): string {
  const parts: string[] = [];

  if (request.urgency === 'high') {
    parts.push(`low latency ${config.avgLatencyMs}ms`);
    parts.push(`high fill rate ${(config.fillRate * 100).toFixed(0)}%`);
  } else if (request.orderType === 'limit' && config.makerFee < 0) {
    parts.push(`rebate ${(Math.abs(config.makerFee) * 100).toFixed(2)}%`);
  } else {
    parts.push(`low cost ${(config.takerFee * 100).toFixed(2)}%`);
  }

  return parts.join(', ');
}

export function getVenueConfigs(): VenueConfig[] {
  return [...VENUE_CONFIGS];
}

export function enableVenue(venue: Venue, enabled: boolean): void {
  const config = VENUE_CONFIGS.find((v) => v.venue === venue);
  if (config) config.enabled = enabled;
}
