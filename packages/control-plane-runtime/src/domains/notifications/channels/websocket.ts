export interface WebSocketConfig {
  enabled: boolean;
  channels: string[];
  heartbeatIntervalMs: number;
}

export interface WebSocketMessage {
  channel: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface WebSocketDeliveryResult {
  success: boolean;
  clientsNotified: number;
  error?: string;
  timestamp: string;
}

export interface WebSocketClient {
  id: string;
  channels: Set<string>;
  lastHeartbeat: string;
  send: (data: string) => void;
}

export class WebSocketChannelManager {
  private clients = new Map<string, WebSocketClient>();
  private config: WebSocketConfig;

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = {
      enabled: true,
      channels: ['orders', 'risk', 'system', 'market'],
      heartbeatIntervalMs: 30000,
      ...config,
    };
  }

  addClient(client: WebSocketClient): void {
    this.clients.set(client.id, client);
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  subscribe(clientId: string, channel: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;
    client.channels.add(channel);
    return true;
  }

  unsubscribe(clientId: string, channel: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;
    client.channels.delete(channel);
    return true;
  }

  broadcast(
    channel: string,
    event: string,
    data: Record<string, unknown>
  ): WebSocketDeliveryResult {
    if (!this.config.enabled) {
      return {
        success: false,
        clientsNotified: 0,
        error: 'WebSocket channel is disabled',
        timestamp: new Date().toISOString(),
      };
    }

    const message: WebSocketMessage = {
      channel,
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    const messageString = JSON.stringify(message);
    let clientsNotified = 0;

    for (const client of this.clients.values()) {
      if (client.channels.has(channel)) {
        try {
          client.send(messageString);
          clientsNotified++;
        } catch {
          // Client disconnected, will be cleaned up on next heartbeat
        }
      }
    }

    return {
      success: true,
      clientsNotified,
      timestamp: new Date().toISOString(),
    };
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getChannelSubscribers(channel: string): string[] {
    const subscribers: string[] = [];
    for (const client of this.clients.values()) {
      if (client.channels.has(channel)) {
        subscribers.push(client.id);
      }
    }
    return subscribers;
  }

  getActiveChannels(): string[] {
    const channels = new Set<string>();
    for (const client of this.clients.values()) {
      for (const channel of client.channels) {
        channels.add(channel);
      }
    }
    return [...channels];
  }

  cleanupStaleClients(maxAgeMs: number = 60000): string[] {
    const now = Date.now();
    const removed: string[] = [];

    for (const [id, client] of this.clients) {
      const lastSeen = new Date(client.lastHeartbeat).getTime();
      if (now - lastSeen > maxAgeMs) {
        this.clients.delete(id);
        removed.push(id);
      }
    }

    return removed;
  }
}

export function createWebSocketMessage(
  channel: string,
  event: string,
  data: Record<string, unknown>
): WebSocketMessage {
  return {
    channel,
    event,
    data,
    timestamp: new Date().toISOString(),
  };
}
