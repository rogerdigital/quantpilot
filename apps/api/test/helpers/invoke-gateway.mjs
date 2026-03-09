import { Readable } from 'node:stream';

export async function invokeGatewayRoute(handler, { method = 'GET', path = '/', body, headers = {} } = {}) {
  const payload = body === undefined ? null : JSON.stringify(body);
  const req = Readable.from(payload ? [payload] : []);
  req.method = method;
  req.url = path;
  req.headers = {
    host: '127.0.0.1',
    ...(payload ? { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(payload)) } : {}),
    ...headers,
  };

  let statusCode = 200;
  let responseHeaders = {};
  let rawBody = '';
  let ended = false;
  let resolveEnd;

  const endPromise = new Promise((resolve) => {
    resolveEnd = resolve;
  });

  const res = {
    writeHead(code, nextHeaders = {}) {
      statusCode = code;
      responseHeaders = nextHeaders;
    },
    end(chunk = '') {
      if (ended) return;
      ended = true;
      rawBody += typeof chunk === 'string' ? chunk : chunk.toString();
      resolveEnd();
    },
  };

  await handler(req, res);
  await endPromise;

  return {
    statusCode,
    headers: responseHeaders,
    body: rawBody,
    json: rawBody ? JSON.parse(rawBody) : null,
  };
}
