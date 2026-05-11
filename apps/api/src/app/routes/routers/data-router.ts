// @ts-nocheck

import { controlPlaneContext } from '../../../../../../packages/control-plane-store/src/context.js';
import { createDatasetRegistry } from '../../../../../../packages/control-plane-store/src/dataset-registry.js';
import { createFeatureRegistry } from '../../../../../../packages/control-plane-store/src/feature-registry.js';

function getStore() {
  return controlPlaneContext?.store || { readCollection: () => [], writeCollection: () => {} };
}

export function handleDataRoutes({ req, reqUrl, res, readJsonBody, writeJson }) {
  const pathname = reqUrl.pathname;

  if (req.method === 'GET' && pathname === '/api/data/datasets') {
    const registry = createDatasetRegistry(getStore());
    writeJson(res, 200, { ok: true, datasets: registry.listDatasets() });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/data/datasets') {
    return (async () => {
      const body = await readJsonBody(req);
      if (!body || !body.id || !body.name || !body.category) {
        writeJson(res, 400, { ok: false, error: 'Missing required fields: id, name, category' });
        return true;
      }
      const registry = createDatasetRegistry(getStore());
      const dataset = registry.registerDataset({
        ...body,
        activeVersionId: body.activeVersionId || null,
        versions: body.versions || [],
        createdAt: body.createdAt || new Date().toISOString(),
        updatedAt: body.updatedAt || new Date().toISOString(),
        metadata: body.metadata || {},
      });
      writeJson(res, 201, { ok: true, dataset });
      return true;
    })();
  }

  const datasetVersionsMatch = pathname.match(/^\/api\/data\/datasets\/([^/]+)\/versions$/);
  if (datasetVersionsMatch) {
    const datasetId = datasetVersionsMatch[1];

    if (req.method === 'GET') {
      const registry = createDatasetRegistry(getStore());
      writeJson(res, 200, { ok: true, versions: registry.listDatasetVersions(datasetId) });
      return true;
    }

    if (req.method === 'POST') {
      return (async () => {
        const body = await readJsonBody(req);
        if (!body || !body.id || !body.schemaHash) {
          writeJson(res, 400, { ok: false, error: 'Missing required fields: id, schemaHash' });
          return true;
        }
        const registry = createDatasetRegistry(getStore());
        const version = registry.createDatasetVersion({
          ...body,
          datasetId,
          status: body.status || 'draft',
          qualityReport: body.qualityReport || null,
          createdAt: body.createdAt || new Date().toISOString(),
          metadata: body.metadata || {},
        });
        writeJson(res, 201, { ok: true, version });
        return true;
      })();
    }
  }

  if (req.method === 'GET' && pathname === '/api/data/quality') {
    const registry = createDatasetRegistry(getStore());
    const datasets = registry.listDatasets();
    const reports = datasets
      .filter((d) => d.activeVersionId)
      .map((d) => registry.getQualityReport(d.activeVersionId))
      .filter(Boolean);
    writeJson(res, 200, { ok: true, reports });
    return true;
  }

  if (req.method === 'GET' && pathname === '/api/data/features') {
    const registry = createFeatureRegistry(getStore());
    writeJson(res, 200, { ok: true, featureSets: registry.listFeatureSets() });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/data/features') {
    return (async () => {
      const body = await readJsonBody(req);
      if (!body || !body.id || !body.name) {
        writeJson(res, 400, { ok: false, error: 'Missing required fields: id, name' });
        return true;
      }
      const registry = createFeatureRegistry(getStore());
      const featureSet = registry.registerFeatureSet({
        ...body,
        activeVersionId: body.activeVersionId || null,
        versions: body.versions || [],
        createdAt: body.createdAt || new Date().toISOString(),
        updatedAt: body.updatedAt || new Date().toISOString(),
        metadata: body.metadata || {},
      });
      writeJson(res, 201, { ok: true, featureSet });
      return true;
    })();
  }

  return false;
}
