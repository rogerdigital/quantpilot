import type {
  ConnectorConfig,
  ConnectorEvent,
  ConnectorHealthCheck,
  ConnectorStatus,
  ConnectorType,
} from '../../shared-types/src/connectors.ts';

export class ConnectorRegistry {
  private connectors: Map<string, ConnectorConfig> = new Map();
  private events: ConnectorEvent[] = [];

  register(config: ConnectorConfig): ConnectorConfig {
    this.connectors.set(config.id, structuredClone(config));
    return structuredClone(config);
  }

  get(id: string): ConnectorConfig | null {
    const c = this.connectors.get(id);
    return c ? structuredClone(c) : null;
  }

  list(type?: ConnectorType): ConnectorConfig[] {
    let results = [...this.connectors.values()];
    if (type) {
      results = results.filter((c) => c.type === type);
    }
    return results.map((c) => structuredClone(c));
  }

  listByStatus(status: ConnectorStatus): ConnectorConfig[] {
    return [...this.connectors.values()]
      .filter((c) => c.status === status)
      .map((c) => structuredClone(c));
  }

  updateStatus(id: string, status: ConnectorStatus): ConnectorConfig | null {
    const c = this.connectors.get(id);
    if (!c) return null;
    c.status = status;
    c.updatedAt = new Date().toISOString();
    return structuredClone(c);
  }

  updateHealthCheck(id: string, healthCheck: ConnectorHealthCheck): ConnectorConfig | null {
    const c = this.connectors.get(id);
    if (!c) return null;
    c.healthCheck = healthCheck;
    c.updatedAt = new Date().toISOString();
    return structuredClone(c);
  }

  unregister(id: string): boolean {
    return this.connectors.delete(id);
  }

  recordEvent(event: ConnectorEvent): ConnectorEvent {
    const clone = structuredClone(event);
    this.events.push(clone);
    return structuredClone(clone);
  }

  listEvents(connectorId?: string, limit = 50): ConnectorEvent[] {
    let results = [...this.events];
    if (connectorId) {
      results = results.filter((e) => e.connectorId === connectorId);
    }
    return results.slice(-limit).map((e) => structuredClone(e));
  }

  getHealthSummary(): {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    unchecked: number;
  } {
    const all = [...this.connectors.values()];
    return {
      total: all.length,
      healthy: all.filter((c) => c.healthCheck?.status === 'healthy').length,
      degraded: all.filter((c) => c.healthCheck?.status === 'degraded').length,
      unhealthy: all.filter((c) => c.healthCheck?.status === 'unhealthy').length,
      unchecked: all.filter((c) => !c.healthCheck).length,
    };
  }
}
