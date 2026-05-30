import { appendExecutionHandoff, assessExecutionCandidate, getStrategy } from '../core-data.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';
import type { GatewayRouteContext } from '../types.js';

interface TradingOrderBody {
  symbol: string;
  side: string;
  orderType: string;
  qty: number;
  price?: number;
  source?: string;
}

function buildAdhocStrategy(symbol: string, side: string) {
  return {
    id: `terminal-${symbol.toLowerCase()}-${side}`,
    name: `Terminal ${side.toUpperCase()} ${symbol}`,
    family: 'manual',
    status: 'paper',
    score: 60,
    expectedReturnPct: 0,
    maxDrawdownPct: 0,
    sharpe: 0,
  };
}

export async function handleTradingRoutes({
  req,
  reqUrl,
  res,
  readJsonBody,
  writeJson,
}: GatewayRouteContext) {
  if (req.method !== 'POST' || reqUrl.pathname !== '/api/trading/orders') {
    return false;
  }

  if (!(await hasPermission('execution:approve', req.headers.authorization))) {
    writeForbiddenJson(writeJson, res, 'execution:approve', 'submit terminal orders');
    return true;
  }

  const body = (await readJsonBody(req)) as TradingOrderBody | null;
  const { symbol, side, orderType, qty, price, source } = body || ({} as TradingOrderBody);

  if (!symbol || !side || !orderType || !qty || qty <= 0) {
    writeJson(res, 400, {
      ok: false,
      message: 'Missing required fields: symbol, side, orderType, qty',
    });
    return true;
  }

  if ((orderType === 'limit' || orderType === 'stop') && (!price || price <= 0)) {
    writeJson(res, 400, { ok: false, message: 'price is required for limit and stop orders' });
    return true;
  }

  const strategyId = `terminal-${symbol.toLowerCase()}-${side}`;
  const strategyDetail = getStrategy(strategyId);
  const strategy = (strategyDetail.ok && strategyDetail.strategy
    ? strategyDetail.strategy
    : buildAdhocStrategy(symbol, side)) as ReturnType<typeof buildAdhocStrategy>;
  const capital = price ? qty * price : qty * 100;
  const candidate = {
    strategyId: strategy.id,
    strategyName: strategy.name,
    mode: 'paper',
    capital,
    status: strategy.status,
    metrics: {
      score: strategy.score,
      expectedReturnPct: strategy.expectedReturnPct,
      maxDrawdownPct: strategy.maxDrawdownPct,
      sharpe: strategy.sharpe,
    },
    orders: [
      {
        symbol,
        side: side.toUpperCase(),
        weight: 1.0,
        qty,
        price: price || null,
        orderType,
        rationale: `Terminal ${side} order from trading desk`,
      },
    ],
    summary: `Terminal ${side.toUpperCase()} ${qty} ${symbol}${price ? ` @ $${price}` : ''} (${orderType})`,
    metadata: {
      family: strategy.family,
      requestedBy: 'terminal',
      source: source || 'trading-terminal',
    },
  };
  const riskAssessment = assessExecutionCandidate(candidate);
  const handoff = appendExecutionHandoff({
    id: `handoff-terminal-${Date.now()}`,
    ...candidate,
    riskStatus: riskAssessment.riskStatus,
    approvalState: riskAssessment.approvalState,
    createdAt: new Date().toISOString(),
  });

  writeJson(res, 200, {
    ok: true,
    handoffId: handoff.id,
    riskDecision: riskAssessment.riskStatus,
    approvalState: riskAssessment.approvalState,
    message: riskAssessment.summary,
  });

  return true;
}
