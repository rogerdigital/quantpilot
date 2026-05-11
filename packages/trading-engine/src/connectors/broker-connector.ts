// @ts-nocheck

import type {
  ConnectorConfig,
  ConnectorHealthCheck,
} from '../../../shared-types/src/connectors.ts';
import type { BrokerAdapter } from '../execution/broker-adapter.js';

export type BrokerConnectorCapabilities = {
  supportedOrderTypes: Array<'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop'>;
  supportedAssetClasses: Array<'equity' | 'option' | 'future' | 'crypto' | 'forex'>;
  supportedTradingModes: Array<'paper' | 'live'>;
  supportsShortSelling: boolean;
  supportsFractionalShares: boolean;
  maxConcurrentOrders: number;
};

export type BrokerConnectorStatus = {
  connectorId: string;
  connected: boolean;
  latencyMs: number;
  lastHeartbeat: string;
  activeOrders: number;
  message: string;
};

export interface BrokerConnector {
  config: ConnectorConfig;
  capabilities: BrokerConnectorCapabilities;
  adapter: BrokerAdapter;
  connect(): Promise<ConnectorHealthCheck>;
  disconnect(): Promise<void>;
  getStatus(): BrokerConnectorStatus;
  validateEnvironment(): { valid: boolean; missing: string[] };
}

export function createBrokerConnectorCapabilities(
  overrides: Partial<BrokerConnectorCapabilities> = {}
): BrokerConnectorCapabilities {
  return {
    supportedOrderTypes: ['market', 'limit', 'stop'],
    supportedAssetClasses: ['equity'],
    supportedTradingModes: ['paper'],
    supportsShortSelling: false,
    supportsFractionalShares: false,
    maxConcurrentOrders: 10,
    ...overrides,
  };
}

export function validateBrokerConnectorEnv(
  env: Record<string, string | undefined>,
  mode: 'paper' | 'live'
): { valid: boolean; missing: string[] } {
  const baseRequired = ['BROKER_PROVIDER'];
  const liveRequired = ['BROKER_API_KEY', 'BROKER_API_SECRET', 'BROKER_ACCOUNT_ID'];
  const required = mode === 'live' ? [...baseRequired, ...liveRequired] : baseRequired;
  const missing = required.filter((key) => !env[key]);
  return { valid: missing.length === 0, missing };
}

export function isOrderTypeSupported(
  capabilities: BrokerConnectorCapabilities,
  orderType: string
): boolean {
  return capabilities.supportedOrderTypes.includes(
    orderType as BrokerConnectorCapabilities['supportedOrderTypes'][number]
  );
}

export function isAssetClassSupported(
  capabilities: BrokerConnectorCapabilities,
  assetClass: string
): boolean {
  return capabilities.supportedAssetClasses.includes(
    assetClass as BrokerConnectorCapabilities['supportedAssetClasses'][number]
  );
}

export function buildBrokerConnectorStatus(params: {
  connectorId: string;
  connected: boolean;
  latencyMs: number;
  activeOrders: number;
  message?: string;
}): BrokerConnectorStatus {
  return {
    connectorId: params.connectorId,
    connected: params.connected,
    latencyMs: params.latencyMs,
    lastHeartbeat: new Date().toISOString(),
    activeOrders: params.activeOrders,
    message: params.message || (params.connected ? 'Connected' : 'Disconnected'),
  };
}
