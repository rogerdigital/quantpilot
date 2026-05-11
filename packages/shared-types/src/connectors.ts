export type ConnectorType =
  | 'market_data'
  | 'fundamental_data'
  | 'news_nlp'
  | 'broker'
  | 'model_provider'
  | 'report_export';

export type ConnectorStatus = 'active' | 'inactive' | 'error' | 'pending_setup';

export type ConnectorCapability = {
  name: string;
  version: string;
  description: string;
};

export type ConnectorHealthCheck = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  lastCheckedAt: string;
  message: string;
};

export type ConnectorConfig = {
  id: string;
  type: ConnectorType;
  name: string;
  provider: string;
  version: string;
  status: ConnectorStatus;
  capabilities: ConnectorCapability[];
  healthCheck: ConnectorHealthCheck | null;
  auth: ConnectorAuth;
  rateLimits: ConnectorRateLimit;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ConnectorAuth = {
  method: 'api_key' | 'oauth2' | 'certificate' | 'none';
  configured: boolean;
};

export type ConnectorRateLimit = {
  requestsPerMinute: number;
  requestsPerDay: number;
  concurrentConnections: number;
};

export type ConnectorEvent = {
  id: string;
  connectorId: string;
  eventType: 'connected' | 'disconnected' | 'error' | 'data_received' | 'health_changed';
  detail: string;
  timestamp: string;
  metadata: Record<string, unknown>;
};
