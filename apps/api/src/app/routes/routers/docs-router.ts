import type { GatewayRouteContext } from '../types.js';
import { generateOpenApiSpec } from '../../../docs/openapi.js';

const SWAGGER_UI_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuantPilot API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; padding: 0; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
    });
  </script>
</body>
</html>`;

export async function handleDocsRoutes({ req, reqUrl, res, writeJson }: GatewayRouteContext) {
  // GET /api/docs/openapi.json
  if (req.method === 'GET' && reqUrl.pathname === '/api/docs/openapi.json') {
    const spec = generateOpenApiSpec();
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify(spec, null, 2));
    return true;
  }

  // GET /api/docs — Swagger UI
  if (req.method === 'GET' && reqUrl.pathname === '/api/docs') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(SWAGGER_UI_HTML);
    return true;
  }

  return false;
}
