import { useEffect, useState } from 'react';

type SseHandlers = Record<string, (data: unknown) => void>;

/**
 * Generic SSE subscription hook with exponential back-off reconnect.
 *
 * @param url      - The SSE endpoint URL (e.g. '/api/sse/state')
 * @param handlers - Map of event name → callback. Stable references recommended.
 */
export function useSSE(url: string, handlers: SseHandlers): { connected: boolean } {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let es: EventSource | null = null;
    let retryDelay = 1000;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      es = new EventSource(url);

      es.addEventListener('connected', () => {
        if (unmounted) return;
        setConnected(true);
        retryDelay = 1000; // reset on successful connect
      });

      es.onerror = () => {
        if (unmounted) return;
        setConnected(false);
        es?.close();
        es = null;
        // Exponential back-off, max 30s
        retryTimer = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, 30_000);
          connect();
        }, retryDelay);
      };

      // Register all event handlers
      for (const [event, handler] of Object.entries(handlers)) {
        es.addEventListener(event, (e: MessageEvent) => {
          try {
            handler(JSON.parse(e.data));
          } catch {
            handler(e.data);
          }
        });
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (retryTimer) clearTimeout(retryTimer);
      es?.close();
      setConnected(false);
    };
    // handlers intentionally excluded from deps to avoid reconnect on every render;
    // callers should memoize handlers themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return { connected };
}
