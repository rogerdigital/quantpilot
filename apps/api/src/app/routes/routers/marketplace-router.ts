import type { GatewayRouteContext } from '../types.js';

import { controlPlaneContext } from '../../../../../../packages/control-plane-store/src/context.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';

export async function handleMarketplaceRoutes({
  req,
  reqUrl,
  res,
  readJsonBody,
  writeJson,
  userAccount,
}: GatewayRouteContext) {
  const writeForbidden = (permission: string, action = '') =>
    writeForbiddenJson(writeJson, res, permission, action);

  const marketplaceRepo = controlPlaneContext.strategyMarketplace;
  const store = controlPlaneContext;

  // GET /api/marketplace/strategies - browse published strategies
  if (req.method === 'GET' && reqUrl.pathname === '/api/marketplace/strategies') {
    const query = reqUrl.searchParams.get('q') || '';
    const category = reqUrl.searchParams.get('category') || 'all';
    const minRating = parseFloat(reqUrl.searchParams.get('minRating') || '0');
    const sortBy = reqUrl.searchParams.get('sortBy') || 'popular';

    const strategies = marketplaceRepo.searchStrategies(query, {
      category,
      minRating,
      sortBy,
    });

    writeJson(res, 200, { ok: true, strategies });
    return true;
  }

  // GET /api/marketplace/strategies/:id - get strategy detail
  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/marketplace/strategies/')) {
    const parts = reqUrl.pathname.split('/');
    const id = parts[parts.length - 1];

    // Check if requesting reviews
    if (parts.includes('reviews')) {
      const marketplaceId = parts[parts.length - 2];
      const limit = parseInt(reqUrl.searchParams.get('limit') || '20', 10);
      const reviews = marketplaceRepo.getReviews(marketplaceId, limit);
      writeJson(res, 200, { ok: true, reviews });
      return true;
    }

    const strategy = marketplaceRepo.getStrategy(id);
    if (!strategy) {
      writeJson(res, 404, { ok: false, message: 'Strategy not found in marketplace' });
      return true;
    }

    const reviews = marketplaceRepo.getReviews(id, 5);
    writeJson(res, 200, { ok: true, strategy, reviews });
    return true;
  }

  // POST /api/marketplace/strategies/:id/fork - fork strategy
  if (
    req.method === 'POST' &&
    reqUrl.pathname.startsWith('/api/marketplace/strategies/') &&
    reqUrl.pathname.endsWith('/fork')
  ) {
    const parts = reqUrl.pathname.split('/');
    const marketplaceId = parts[parts.length - 2];
    const userId = (userAccount as any)?.id || 'anonymous';
    const userName = (userAccount as any)?.name || 'Anonymous';

    try {
      const result = marketplaceRepo.forkStrategy(marketplaceId, userId, userName);
      if (!result) {
        writeJson(res, 404, { ok: false, message: 'Strategy not found' });
        return true;
      }

      writeJson(res, 200, { ok: true, fork: result.fork, strategy: result.strategy });
    } catch (err: any) {
      writeJson(res, 400, { ok: false, message: err.message });
    }
    return true;
  }

  // POST /api/marketplace/strategies/:id/rate - rate strategy
  if (
    req.method === 'POST' &&
    reqUrl.pathname.startsWith('/api/marketplace/strategies/') &&
    reqUrl.pathname.endsWith('/rate')
  ) {
    const parts = reqUrl.pathname.split('/');
    const marketplaceId = parts[parts.length - 2];
    const body = (await readJsonBody(req)) as Record<string, any> | undefined;
    const userId = (userAccount as any)?.id || 'anonymous';
    const rating = parseInt(body?.rating, 10);

    if (rating < 1 || rating > 5) {
      writeJson(res, 400, { ok: false, message: 'Rating must be between 1 and 5' });
      return true;
    }

    try {
      const result = marketplaceRepo.rateStrategy(marketplaceId, userId, rating);
      if (!result) {
        writeJson(res, 404, { ok: false, message: 'Strategy not found' });
        return true;
      }

      writeJson(res, 200, { ok: true, strategy: result });
    } catch (err: any) {
      writeJson(res, 400, { ok: false, message: err.message });
    }
    return true;
  }

  // POST /api/marketplace/strategies/:id/reviews - add review
  if (
    req.method === 'POST' &&
    reqUrl.pathname.startsWith('/api/marketplace/strategies/') &&
    reqUrl.pathname.endsWith('/reviews')
  ) {
    const parts = reqUrl.pathname.split('/');
    const marketplaceId = parts[parts.length - 2];
    const body = (await readJsonBody(req)) as Record<string, any> | undefined;
    const userId = (userAccount as any)?.id || 'anonymous';
    const userName = (userAccount as any)?.name || 'Anonymous';

    if (!body?.comment || body?.comment.trim().length === 0) {
      writeJson(res, 400, { ok: false, message: 'Comment cannot be empty' });
      return true;
    }

    try {
      const review = marketplaceRepo.reviewStrategy(
        marketplaceId,
        userId,
        userName,
        body?.comment.trim(),
        body?.rating ? parseInt(body?.rating, 10) : undefined
      );

      writeJson(res, 200, { ok: true, review });
    } catch (err: any) {
      writeJson(res, 400, { ok: false, message: err.message });
    }
    return true;
  }

  // POST /api/marketplace/strategies/publish - publish strategy
  if (req.method === 'POST' && reqUrl.pathname === '/api/marketplace/strategies/publish') {
    if (!(await hasPermission('strategy:write', req.headers.authorization))) {
      writeForbidden('strategy:write', 'publish strategy to marketplace');
      return true;
    }

    const body = (await readJsonBody(req)) as Record<string, any> | undefined;
    const userId = (userAccount as any)?.id || 'anonymous';
    const userName = (userAccount as any)?.name || 'Anonymous';

    if (!body?.strategyId) {
      writeJson(res, 400, { ok: false, message: 'strategyId is required' });
      return true;
    }

    try {
      // Get strategy from catalog
      const catalog = (store.store as any).readCollection('strategy-catalog.json');
      const strategy = catalog.find((s: any) => s.id === body?.strategyId);

      if (!strategy) {
        writeJson(res, 404, { ok: false, message: 'Strategy not found in catalog' });
        return true;
      }

      const entry = marketplaceRepo.publishStrategy({
        strategyId: body?.strategyId,
        authorId: userId,
        authorName: userName,
        name: strategy.name,
        description: body?.description || strategy.description || '',
        visibility: body?.visibility || 'public',
        category: body?.category || 'other',
        tags: body?.tags || [],
        metrics: {
          cagr: strategy.lastBacktest?.metrics?.cagr || 0,
          sharpe: strategy.lastBacktest?.metrics?.sharpe || 0,
          maxDrawdown: strategy.lastBacktest?.metrics?.maxDrawdown || 0,
          winRate: strategy.lastBacktest?.metrics?.winRate || 0,
          tradeCount: strategy.lastBacktest?.metrics?.tradeCount || 0,
        },
      });

      writeJson(res, 200, { ok: true, strategy: entry });
    } catch (err: any) {
      writeJson(res, 400, { ok: false, message: err.message });
    }
    return true;
  }

  return false;
}
