// @ts-nocheck

import { randomUUID } from 'node:crypto';
import type {
  PlatformEvent,
  PlatformEventSeverity,
  PlatformEventType,
} from '../../../shared-types/src/platform-events.ts';

export type PlatformEventListener = (event: PlatformEvent) => void;

export type PlatformEventFilter = {
  type?: PlatformEventType;
  severity?: PlatformEventSeverity;
  source?: string;
  namespace?: string;
};

export class PlatformEventBus {
  private events: PlatformEvent[] = [];
  private listeners: Map<string, { filter: PlatformEventFilter; fn: PlatformEventListener }> =
    new Map();

  emit(params: {
    type: PlatformEventType;
    severity: PlatformEventSeverity;
    source: string;
    payload: Record<string, unknown>;
    correlationId?: string;
    namespace?: string;
  }): PlatformEvent {
    const event: PlatformEvent = {
      id: randomUUID(),
      type: params.type,
      severity: params.severity,
      timestamp: new Date().toISOString(),
      source: params.source,
      payload: structuredClone(params.payload),
      correlationId: params.correlationId,
      namespace: params.namespace,
    };
    this.events.push(event);
    for (const [, { filter, fn }] of this.listeners) {
      if (this.matchesFilter(event, filter)) {
        fn(event);
      }
    }
    return event;
  }

  subscribe(filter: PlatformEventFilter, fn: PlatformEventListener): string {
    const id = randomUUID();
    this.listeners.set(id, { filter, fn });
    return id;
  }

  unsubscribe(id: string): boolean {
    return this.listeners.delete(id);
  }

  query(filter: PlatformEventFilter): PlatformEvent[] {
    return this.events.filter((e) => this.matchesFilter(e, filter)).map((e) => structuredClone(e));
  }

  recent(count: number): PlatformEvent[] {
    return this.events.slice(-count).map((e) => structuredClone(e));
  }

  countByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const e of this.events) {
      counts[e.type] = (counts[e.type] || 0) + 1;
    }
    return counts;
  }

  countBySeverity(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const e of this.events) {
      counts[e.severity] = (counts[e.severity] || 0) + 1;
    }
    return counts;
  }

  clear(): void {
    this.events = [];
  }

  private matchesFilter(event: PlatformEvent, filter: PlatformEventFilter): boolean {
    if (filter.type && event.type !== filter.type) return false;
    if (filter.severity && event.severity !== filter.severity) return false;
    if (filter.source && event.source !== filter.source) return false;
    if (filter.namespace && event.namespace !== filter.namespace) return false;
    return true;
  }
}
