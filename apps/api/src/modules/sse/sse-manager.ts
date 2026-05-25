import type { ServerResponse } from 'node:http';

// SSE connection pool — maintains a set of active response streams
// and provides a broadcast function.

const connections = new Set<ServerResponse>();

export function addSseConnection(res: ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  });
  connections.add(res);

  res.on('close', () => {
    connections.delete(res);
  });

  // Initial heartbeat so the client knows the connection is live
  res.write('event: connected\ndata: {}\n\n');
}

export function broadcast(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of connections) {
    try {
      res.write(payload);
    } catch {
      connections.delete(res);
    }
  }
}

export function getSseConnectionCount() {
  return connections.size;
}
