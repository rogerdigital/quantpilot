interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTtl: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 1000,
  defaultTtl: 30_000, // 30 seconds
};

class LRUCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];
  private config: CacheConfig;
  private hits = 0;
  private misses = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.misses++;
      return undefined;
    }

    // Move to end (most recently used)
    this.moveToEnd(key);
    this.hits++;
    return entry;
  }

  set(key: string, data: unknown, ttl?: number): void {
    // Remove if exists
    if (this.cache.has(key)) {
      this.delete(key);
    }

    // Evict if at capacity
    while (this.cache.size >= this.config.maxSize) {
      const oldest = this.accessOrder[0];
      if (oldest) this.delete(oldest);
    }

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.config.defaultTtl,
    };

    this.cache.set(key, entry);
    this.accessOrder.push(key);
  }

  private moveToEnd(key: string): void {
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);
  }

  delete(key: string): boolean {
    const existed = this.cache.delete(key);
    if (existed) {
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
    }
    return existed;
  }

  invalidatePattern(pattern: string): number {
    let count = 0;
    for (const key of [...this.accessOrder]) {
      if (key.includes(pattern)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
  }

  stats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate:
        this.hits + this.misses > 0
          ? `${((this.hits / (this.hits + this.misses)) * 100).toFixed(2)}%`
          : '0%',
    };
  }
}

// Global cache instance
export const apiCache = new LRUCache({ maxSize: 500, defaultTtl: 30_000 });

// Cache TTL configuration per route pattern (in milliseconds)
const CACHE_TTL_MAP: Record<string, number> = {
  '/api/market/ohlcv': 60_000, // 60s
  '/api/strategy/catalog': 30_000, // 30s
  '/api/risk/parameters': 30_000, // 30s
  '/api/backtest/summary': 10_000, // 10s
  '/api/monitoring/status': 5_000, // 5s
};

// Methods that invalidate cache
const INVALIDATION_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

// Route patterns to invalidate on mutation
const INVALIDATION_PATTERNS: Record<string, string[]> = {
  '/api/strategy/': ['/api/strategy/catalog'],
  '/api/risk/': ['/api/risk/parameters', '/api/risk/events'],
  '/api/backtest/': ['/api/backtest/summary', '/api/backtest/runs'],
  '/api/market/': ['/api/market/ohlcv'],
};

export function getCacheTtl(pathname: string): number | undefined {
  for (const [pattern, ttl] of Object.entries(CACHE_TTL_MAP)) {
    if (pathname.startsWith(pattern)) {
      return ttl;
    }
  }
  return undefined;
}

export function buildCacheKey(
  method: string,
  pathname: string,
  search: string,
  userId?: string
): string {
  return `${method}:${pathname}${search}${userId ? `:${userId}` : ''}`;
}

export function shouldCache(method: string, pathname: string): boolean {
  if (method !== 'GET') return false;
  return getCacheTtl(pathname) !== undefined;
}

export function shouldInvalidate(method: string): boolean {
  return INVALIDATION_METHODS.has(method);
}

export function getInvalidationPatterns(pathname: string): string[] {
  for (const [pattern, targets] of Object.entries(INVALIDATION_PATTERNS)) {
    if (pathname.startsWith(pattern)) {
      return targets;
    }
  }
  return [];
}

export function getCacheStats() {
  return apiCache.stats();
}
