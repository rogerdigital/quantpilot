import type { MarketDataProvider, MarketDataSnapshot, Quote, RuntimeConfig, StockState } from '../types/trading.ts';

function normalizeQuote(rawQuote: Partial<Quote> & { symbol?: string } | null | undefined): Quote | null {
  if (!rawQuote || !rawQuote.symbol) return null;
  const price = Number(rawQuote.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    symbol: String(rawQuote.symbol),
    price,
    prevClose: Number(rawQuote.prevClose),
    high: Number(rawQuote.high),
    low: Number(rawQuote.low),
    volume: Number(rawQuote.volume),
    turnover: Number(rawQuote.turnover),
  };
}

function simulatedProvider(): MarketDataProvider {
  return {
    id: 'simulated',
    label: 'Local Simulated Market Data',
    async getQuotePatch(): Promise<MarketDataSnapshot> {
      return {
        connected: true,
        fallback: false,
        message: 'Using the local simulated market data stream.',
        quotes: [],
      };
    },
  };
}

function customHttpProvider(config: RuntimeConfig): MarketDataProvider {
  return {
    id: 'custom-http',
    label: 'HTTP Market Gateway',
    async getQuotePatch(stockStates: StockState[]): Promise<MarketDataSnapshot> {
      if (!config.marketDataHttpUrl) {
        return {
          connected: false,
          fallback: true,
          message: 'VITE_MARKET_DATA_HTTP_URL is not configured. Fell back to local simulated market data.',
          quotes: [],
        };
      }

      try {
        const query = new URL(config.marketDataHttpUrl);
        query.searchParams.set('symbols', stockStates.map((stock) => stock.symbol).join(','));
        const response = await fetch(query.toString(), {
          headers: {
            Accept: 'application/json',
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const rawQuotes = Array.isArray(payload?.data) ? payload.data : [];
        const quotes = rawQuotes.map(normalizeQuote).filter(Boolean);
        return {
          connected: true,
          fallback: false,
          message: quotes.length ? `HTTP market gateway updated ${quotes.length} symbols.` : 'HTTP market gateway returned no data. Keeping simulated quotes.',
          quotes,
        };
      } catch (error) {
        return {
          connected: false,
          fallback: true,
          message: `HTTP market gateway unavailable. Fell back to local simulated market data. ${error instanceof Error ? error.message : 'unknown error'}`,
          quotes: [],
        };
      }
    },
  };
}

function alpacaProvider(config: RuntimeConfig): MarketDataProvider {
  return {
    id: 'alpaca',
    label: 'Alpaca Market Data via Gateway',
    async getQuotePatch(stockStates: StockState[]): Promise<MarketDataSnapshot> {
      try {
        const query = new URL(`${config.alpacaProxyBase}/market/snapshots`, window.location.origin);
        query.searchParams.set('symbols', stockStates.map((stock) => stock.symbol).join(','));
        const response = await fetch(query.toString(), {
          headers: {
            Accept: 'application/json',
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const quotes = Array.isArray(payload?.quotes) ? payload.quotes.map(normalizeQuote).filter(Boolean) : [];
        return {
          connected: true,
          fallback: false,
          message: quotes.length ? `Alpaca market data updated ${quotes.length} symbols.` : 'Alpaca returned no quotes. Keeping current prices.',
          quotes,
        };
      } catch (error) {
        return {
          connected: false,
          fallback: true,
          message: `Alpaca market data unavailable. Fell back to local simulated market data. ${error instanceof Error ? error.message : 'unknown error'}`,
          quotes: [],
        };
      }
    },
  };
}

export function createMarketDataProvider(config: RuntimeConfig): MarketDataProvider {
  if (config.marketDataProvider === 'alpaca') return alpacaProvider(config);
  if (config.marketDataProvider === 'custom-http') return customHttpProvider(config);
  return simulatedProvider();
}
