import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';

export async function invokeGatewayRoute(
  handler: (...args: any[]) => Promise<void>,
  {
    method = 'GET',
    path = '/',
    body,
    rawBody: rawRequestBody,
    headers = {},
  }: {
    method?: string;
    path?: string;
    body?: any;
    rawBody?: string | null;
    headers?: Record<string, string>;
  } = {}
) {
  const payload =
    rawRequestBody !== undefined
      ? rawRequestBody
      : body === undefined
        ? null
        : JSON.stringify(body);
  const req = Readable.from(payload ? [payload] : []) as unknown as IncomingMessage;
  req.method = method;
  req.url = path;
  req.headers = {
    host: '127.0.0.1',
    ...(payload
      ? { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(payload)) }
      : {}),
    ...headers,
  };

  let statusCode = 200;
  let responseHeaders: Record<string, any> = {};
  let rawBody = '';
  let ended = false;
  let resolveEnd: () => void;

  const endPromise = new Promise<void>((resolve) => {
    resolveEnd = resolve;
  });

  const res = {
    writeHead(code: number, nextHeaders: Record<string, any> = {}) {
      statusCode = code;
      responseHeaders = nextHeaders;
    },
    setHeader(name: string, value: any) {
      responseHeaders[name] = value;
    },
    end(chunk: any = '') {
      if (ended) return;
      ended = true;
      rawBody += typeof chunk === 'string' ? chunk : String(chunk);
      resolveEnd();
    },
  } as unknown as ServerResponse;

  await handler(req, res);
  await endPromise;

  return {
    statusCode,
    headers: responseHeaders,
    body: rawBody,
    json: rawBody ? JSON.parse(rawBody) : null,
  };
}
