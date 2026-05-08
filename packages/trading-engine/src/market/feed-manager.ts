export type FeedProvider = 'alpaca' | 'yahoo' | 'simulated';
export type BarInterval = '1s' | '1m' | '5m' | '15m' | '1h' | '1d';

export interface Tick {
  symbol: string;
  price: number;
  volume: number;
  timestamp: string;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
}

export interface Quote {
  symbol: string;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  timestamp: string;
}

export interface FeedHealth {
  provider: FeedProvider;
  connected: boolean;
  latencyMs: number;
  lastTickAt: string;
  gapCount: number;
  reconnectCount: number;
  ticksReceived: number;
}

export interface FeedAdapter {
  provider: FeedProvider;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(symbols: string[]): void;
  unsubscribe(symbols: string[]): void;
  onTick(callback: (tick: Tick) => void): void;
  onQuote(callback: (quote: Quote) => void): void;
  getHealth(): FeedHealth;
}

export interface NormalizedBar {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
  interval: BarInterval;
}

const DEFAULT_HEALTH: FeedHealth = {
  provider: 'simulated',
  connected: false,
  latencyMs: 0,
  lastTickAt: '',
  gapCount: 0,
  reconnectCount: 0,
  ticksReceived: 0,
};

export class FeedManager {
  private adapters = new Map<FeedProvider, FeedAdapter>();
  private tickCallbacks: ((tick: Tick) => void)[] = [];
  private quoteCallbacks: ((quote: Quote) => void)[] = [];
  private subscribedSymbols = new Set<string>();

  registerAdapter(adapter: FeedAdapter): void {
    this.adapters.set(adapter.provider, adapter);
    adapter.onTick((tick) => {
      for (const cb of this.tickCallbacks) cb(tick);
    });
    adapter.onQuote((quote) => {
      for (const cb of this.quoteCallbacks) cb(quote);
    });
  }

  async connect(provider: FeedProvider): Promise<void> {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error(`No adapter registered for provider: ${provider}`);
    await adapter.connect();
    if (this.subscribedSymbols.size > 0) {
      adapter.subscribe([...this.subscribedSymbols]);
    }
  }

  async disconnect(provider: FeedProvider): Promise<void> {
    const adapter = this.adapters.get(provider);
    if (adapter) await adapter.disconnect();
  }

  async disconnectAll(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      await adapter.disconnect();
    }
  }

  subscribe(symbols: string[], provider?: FeedProvider): void {
    for (const s of symbols) this.subscribedSymbols.add(s);
    if (provider) {
      const adapter = this.adapters.get(provider);
      adapter?.subscribe(symbols);
    } else {
      for (const adapter of this.adapters.values()) {
        adapter.subscribe(symbols);
      }
    }
  }

  unsubscribe(symbols: string[], provider?: FeedProvider): void {
    for (const s of symbols) this.subscribedSymbols.delete(s);
    if (provider) {
      const adapter = this.adapters.get(provider);
      adapter?.unsubscribe(symbols);
    } else {
      for (const adapter of this.adapters.values()) {
        adapter.unsubscribe(symbols);
      }
    }
  }

  onTick(callback: (tick: Tick) => void): void {
    this.tickCallbacks.push(callback);
  }

  onQuote(callback: (quote: Quote) => void): void {
    this.quoteCallbacks.push(callback);
  }

  getHealth(provider: FeedProvider): FeedHealth {
    return this.adapters.get(provider)?.getHealth() ?? { ...DEFAULT_HEALTH };
  }

  getAllHealth(): FeedHealth[] {
    return [...this.adapters.values()].map((a) => a.getHealth());
  }

  getSubscribedSymbols(): string[] {
    return [...this.subscribedSymbols];
  }
}

export function normalizeTick(raw: Record<string, unknown>, provider: FeedProvider): Tick {
  switch (provider) {
    case 'alpaca':
      return {
        symbol: String(raw.S ?? raw.symbol ?? ''),
        price: Number(raw.p ?? raw.price ?? 0),
        volume: Number(raw.v ?? raw.volume ?? 0),
        timestamp: String(raw.t ?? raw.timestamp ?? new Date().toISOString()),
      };
    case 'yahoo':
      return {
        symbol: String(raw.symbol ?? ''),
        price: Number(raw.price ?? 0),
        volume: Number(raw.volume ?? 0),
        timestamp: String(raw.time ?? new Date().toISOString()),
      };
    default:
      return {
        symbol: String(raw.symbol ?? ''),
        price: Number(raw.price ?? 0),
        volume: Number(raw.volume ?? 0),
        timestamp: String(raw.timestamp ?? new Date().toISOString()),
      };
  }
}

export function normalizeQuote(raw: Record<string, unknown>, provider: FeedProvider): Quote {
  switch (provider) {
    case 'alpaca':
      return {
        symbol: String(raw.S ?? raw.symbol ?? ''),
        bid: Number(raw.bp ?? raw.bid ?? 0),
        ask: Number(raw.ap ?? raw.ask ?? 0),
        bidSize: Number(raw.bs ?? raw.bidSize ?? 0),
        askSize: Number(raw.as ?? raw.askSize ?? 0),
        timestamp: String(raw.t ?? raw.timestamp ?? new Date().toISOString()),
      };
    default:
      return {
        symbol: String(raw.symbol ?? ''),
        bid: Number(raw.bid ?? 0),
        ask: Number(raw.ask ?? 0),
        bidSize: Number(raw.bidSize ?? 0),
        askSize: Number(raw.askSize ?? 0),
        timestamp: String(raw.timestamp ?? new Date().toISOString()),
      };
  }
}
