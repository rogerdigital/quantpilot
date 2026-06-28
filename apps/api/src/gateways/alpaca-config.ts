import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadEnvFile(pathname: string) {
  if (!existsSync(pathname)) return;
  const text = readFileSync(pathname, 'utf8');
  text.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index === -1) return;
    // Support `export KEY=VALUE` shell-style lines.
    let key = trimmed.slice(0, index).trim();
    if (key.startsWith('export ')) key = key.slice('export '.length).trim();
    let value = trimmed.slice(index + 1).trim();
    // Strip a single pair of surrounding single or double quotes.
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    if (key && !process.env[key]) process.env[key] = value;
  });
}

loadEnvFile(join(process.cwd(), '.env'));

export interface GatewayConfig {
  gatewayPort: number;
  tradingMode: string;
  liveTradingEnabled: boolean;
  alpacaKeyId: string;
  alpacaSecretKey: string;
  alpacaUsePaper: boolean;
  alpacaDataFeed: string;
  alpacaTradingBase: string;
  alpacaDataBase: string;
  brokerAdapter: string;
  brokerUpstreamUrl: string;
  brokerUpstreamApiKey: string;
  brokerUpstreamAuthScheme: string;
}

export function createGatewayConfig(overrides: Record<string, unknown> = {}): GatewayConfig {
  const gatewayPort = Number(overrides.gatewayPort || process.env.GATEWAY_PORT || 8787);
  const alpacaKeyId = (overrides.alpacaKeyId ?? process.env.ALPACA_KEY_ID ?? '') as string;
  const alpacaSecretKey = (overrides.alpacaSecretKey ??
    process.env.ALPACA_SECRET_KEY ??
    '') as string;
  const alpacaUsePaper =
    `${overrides.alpacaUsePaper ?? process.env.ALPACA_USE_PAPER ?? 'true'}` !== 'false';
  const alpacaDataFeed = (overrides.alpacaDataFeed ??
    process.env.ALPACA_DATA_FEED ??
    'iex') as string;
  const brokerAdapter = (overrides.brokerAdapter ??
    process.env.BROKER_ADAPTER ??
    'alpaca') as string;
  const brokerUpstreamUrl = (
    (overrides.brokerUpstreamUrl ?? process.env.BROKER_UPSTREAM_URL ?? '') as string
  ).replace(/\/$/, '');
  const tradingMode = ['paper', 'live'].includes(
    String(overrides.tradingMode ?? process.env.QUANTPILOT_TRADING_MODE ?? '')
  )
    ? String(overrides.tradingMode ?? process.env.QUANTPILOT_TRADING_MODE)
    : 'simulated';
  const liveTradingEnabled =
    tradingMode === 'live' &&
    !alpacaUsePaper &&
    Boolean(alpacaKeyId && alpacaSecretKey) &&
    (overrides.liveTradingAck ?? process.env.QUANTPILOT_LIVE_TRADING_ACK) ===
      'I_UNDERSTAND_LIVE_TRADING_RISK';
  return {
    gatewayPort,
    tradingMode,
    liveTradingEnabled,
    alpacaKeyId,
    alpacaSecretKey,
    alpacaUsePaper,
    alpacaDataFeed,
    alpacaTradingBase: alpacaUsePaper
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets',
    alpacaDataBase: 'https://data.alpaca.markets',
    brokerAdapter,
    brokerUpstreamUrl,
    brokerUpstreamApiKey: (overrides.brokerUpstreamApiKey ??
      process.env.BROKER_UPSTREAM_API_KEY ??
      '') as string,
    brokerUpstreamAuthScheme: (overrides.brokerUpstreamAuthScheme ??
      process.env.BROKER_UPSTREAM_AUTH_SCHEME ??
      'Bearer') as string,
  };
}
