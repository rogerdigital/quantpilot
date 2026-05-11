// @ts-nocheck
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import test from 'node:test';

import { handlePromotionRoutes } from '../src/app/routes/routers/promotion-router.ts';

function createContext(method, pathname, body = null) {
  const req = Object.assign(new Readable({ read() {} }), { method });
  const reqUrl = new URL(`http://localhost${pathname}`);
  let responseStatus = null;
  let responseData = null;
  const res = {};

  return {
    req,
    reqUrl,
    res,
    readJsonBody: async () => body,
    writeJson: (_res, status, data) => {
      responseStatus = status;
      responseData = data;
    },
    getResponse() {
      return { status: responseStatus, data: responseData };
    },
  };
}

test('POST /api/promotions creates promotion', async () => {
  const ctx = createContext('POST', '/api/promotions', {
    strategyCandidateId: 'strat-1',
    strategyVersionId: 'sv-1',
    requestedBy: 'user-1',
  });
  await handlePromotionRoutes(ctx);
  const resp = ctx.getResponse();
  assert.equal(resp.status, 201);
  assert.equal(resp.data.ok, true);
  assert.equal(resp.data.promotion.strategyCandidateId, 'strat-1');
  assert.equal(resp.data.promotion.status, 'draft');
});

test('POST /api/promotions rejects missing fields', async () => {
  const ctx = createContext('POST', '/api/promotions', { strategyCandidateId: 'x' });
  await handlePromotionRoutes(ctx);
  assert.equal(ctx.getResponse().status, 400);
});

test('GET /api/promotions lists all', async () => {
  const ctx = createContext('GET', '/api/promotions');
  await handlePromotionRoutes(ctx);
  const resp = ctx.getResponse();
  assert.equal(resp.status, 200);
  assert.ok(Array.isArray(resp.data.promotions));
});

test('GET /api/promotions/:id returns 404 for unknown', async () => {
  const ctx = createContext('GET', '/api/promotions/nonexist');
  await handlePromotionRoutes(ctx);
  assert.equal(ctx.getResponse().status, 404);
});

test('POST /api/promotions/:id/submit changes status', async () => {
  const createCtx = createContext('POST', '/api/promotions', {
    strategyCandidateId: 's1',
    strategyVersionId: 'sv1',
    requestedBy: 'u1',
  });
  await handlePromotionRoutes(createCtx);
  const id = createCtx.getResponse().data.promotion.id;

  const submitCtx = createContext('POST', `/api/promotions/${id}/submit`);
  await handlePromotionRoutes(submitCtx);
  assert.equal(submitCtx.getResponse().data.promotion.status, 'submitted');
});

test('POST /api/promotions/:id/approve-paper requires actor and reason', async () => {
  const ctx = createContext('POST', '/api/promotions/some-id/approve-paper', {});
  await handlePromotionRoutes(ctx);
  assert.equal(ctx.getResponse().status, 400);
});

test('POST /api/promotions/:id/reject requires reason', async () => {
  const ctx = createContext('POST', '/api/promotions/some-id/reject', { actor: 'a' });
  await handlePromotionRoutes(ctx);
  assert.equal(ctx.getResponse().status, 400);
});

test('full promotion workflow: create → submit → approve paper', async () => {
  const createCtx = createContext('POST', '/api/promotions', {
    strategyCandidateId: 's2',
    strategyVersionId: 'sv2',
    requestedBy: 'u1',
  });
  await handlePromotionRoutes(createCtx);
  const id = createCtx.getResponse().data.promotion.id;

  const submitCtx = createContext('POST', `/api/promotions/${id}/submit`);
  await handlePromotionRoutes(submitCtx);

  const approveCtx = createContext('POST', `/api/promotions/${id}/approve-paper`, {
    actor: 'risk-mgr',
    reason: 'Metrics acceptable',
    actorType: 'human',
    role: 'risk_manager',
  });
  await handlePromotionRoutes(approveCtx);
  const result = approveCtx.getResponse().data.promotion;
  assert.equal(result.status, 'approved_for_paper');
  assert.equal(result.decisions.length, 1);
  assert.equal(result.decisions[0].action, 'approve_paper');
});
