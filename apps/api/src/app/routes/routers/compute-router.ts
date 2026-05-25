import { ComputeJobStore } from '../../../../../../packages/control-plane-store/src/compute-job-store.js';
import type { GatewayRouteContext } from '../types.js';

let store: ComputeJobStore | null = null;

function getStore() {
  if (!store) {
    store = new ComputeJobStore();
  }
  return store;
}

export async function handleComputeRoutes({
  req,
  reqUrl,
  res,
  readJsonBody,
  writeJson,
}: GatewayRouteContext) {
  const jobStore = getStore();

  if (req.method === 'GET' && reqUrl.pathname === '/api/compute/jobs') {
    const status = reqUrl.searchParams.get('status');
    const jobs = status ? jobStore.listByStatus(status as any) : jobStore.list();
    writeJson(res, 200, { ok: true, jobs });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/compute/jobs/')) {
    const id = reqUrl.pathname.replace('/api/compute/jobs/', '');
    if (id.includes('/')) return false;
    const job = jobStore.get(id);
    if (!job) {
      writeJson(res, 404, { ok: false, error: 'Job not found' });
      return true;
    }
    writeJson(res, 200, { ok: true, job });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/compute/jobs') {
    const body = (await readJsonBody(req)) as Record<string, any> | undefined;
    if (!body?.type || !body.owner || !body.resource) {
      writeJson(res, 400, { ok: false, error: 'Missing required fields: type, owner, resource' });
      return true;
    }
    const job = jobStore.enqueue({
      id: body.id || `job-${Date.now()}`,
      type: body.type,
      status: 'queued',
      owner: body.owner,
      workspaceId: body.workspaceId || undefined,
      linkedEntityId: body.linkedEntityId || undefined,
      linkedEntityType: body.linkedEntityType || undefined,
      resource: body.resource,
      params: body.params || {},
      result: null,
      error: null,
      artifacts: [],
      logs: [],
      heartbeat: null,
      retrySafe: body.retrySafe !== false,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      leasedAt: null,
      leasedBy: null,
      leaseExpiresAt: null,
      timeoutMs: body.timeoutMs || 600_000,
    } as any);
    writeJson(res, 201, { ok: true, job });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.match(/^\/api\/compute\/jobs\/[^/]+\/cancel$/)) {
    const id = reqUrl.pathname.split('/')[4];
    const cancelled = jobStore.cancel(id);
    if (!cancelled) {
      writeJson(res, 400, { ok: false, error: 'Job cannot be cancelled' });
      return true;
    }
    writeJson(res, 200, { ok: true, job: cancelled });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.match(/^\/api\/compute\/jobs\/[^/]+\/retry$/)) {
    const id = reqUrl.pathname.split('/')[4];
    const existing = jobStore.get(id);
    if (!existing) {
      writeJson(res, 404, { ok: false, error: 'Job not found' });
      return true;
    }
    if (!existing.retrySafe) {
      writeJson(res, 400, { ok: false, error: 'Job handler does not declare retry-safe' });
      return true;
    }
    if (existing.status !== 'failed' && existing.status !== 'timeout') {
      writeJson(res, 400, { ok: false, error: 'Only failed or timed-out jobs can be retried' });
      return true;
    }
    const retried = jobStore.enqueue({
      ...existing,
      id: `${existing.id}-retry-${Date.now()}`,
      status: 'queued',
      result: null,
      error: null,
      artifacts: [],
      logs: [],
      heartbeat: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      leasedAt: null,
      leasedBy: null,
      leaseExpiresAt: null,
    } as any);
    writeJson(res, 201, { ok: true, job: retried });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/compute/queue') {
    const all = jobStore.list();
    const queue = {
      id: 'queue-main',
      name: 'default',
      maxConcurrency: 4,
      activeJobs: all.filter((j: any) => j.status === 'running' || j.status === 'leased').length,
      queuedJobs: all.filter((j: any) => j.status === 'queued').length,
      totalCompleted: all.filter((j: any) => j.status === 'succeeded').length,
      totalFailed: all.filter((j: any) => j.status === 'failed' || j.status === 'timeout').length,
    };
    writeJson(res, 200, { ok: true, queue });
    return true;
  }

  return false;
}
