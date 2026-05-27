const FILENAME = 'market-provider-status.json';

const DEFAULT_MARKET_STATUS = {
  asOf: '',
  provider: 'simulated',
  connected: false,
  fallback: true,
  message: 'market provider has not been synced yet',
  symbolCount: 0,
};

function normalizeSnapshot(snapshot: any = {}) {
  return {
    asOf: snapshot.asOf || new Date().toISOString(),
    provider: snapshot.provider || 'simulated',
    connected: Boolean(snapshot.connected),
    fallback: snapshot.fallback !== false,
    message: snapshot.message || '',
    symbolCount: Number(snapshot.symbolCount || 0),
  };
}

export function createMarketProviderRepository(store: any) {
  return {
    getMarketProviderStatus() {
      return normalizeSnapshot(store.readObject(FILENAME, DEFAULT_MARKET_STATUS));
    },
    updateMarketProviderStatus(snapshot: any = {}) {
      const next = normalizeSnapshot(snapshot);
      store.writeObject(FILENAME, next);
      return next;
    },
  };
}
