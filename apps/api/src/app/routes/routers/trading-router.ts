// @ts-nocheck

import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';
import { assessExecutionCandidate } from '../../../domains/risk/services/assessment-service.js';
import { getStrategyCatalogItem } from '../../../domains/strategy/services/catalog-service.js';
import { buildStrategyExecutionCandidate } from '../../../domains/strategy/services/execution-candidate-service.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';

function buildAdhocStrategy(symbol, side) {
  return {
    id: `terminal-${symbol.toLowerCase()}-${side}`,
    name: `Terminal ${side.toUpperCase()} ${symbol}`,
    family: 'trend',
    status: 'paper',
    score: 60,
    expectedReturnPct: 8,
    maxDrawdownPct: 8,
    sharpe: 1.2,
  };
}

export async function handleTradingRoutes({ req, reqUrl, res, readJsonBody, writeJson }) {
  if (req.method !== 'POST' || reqUrl.pathname !== '/api/trading/orders') {
    return false;
  }

  if (!hasPermission('execution:approve')) {
    writeForbiddenJson(writeJson, res, 'execution:approve', 'submit terminal orders');
    return true;
  }

  const body = await readJsonBody(req);
  const { symbol, side, orderType, qty, price, source } = body || {};

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

  try {
    // Look up strategy by symbol, or use adhoc strategy for direct terminal orders
    const strategyId = `terminal-${symbol.toLowerCase()}-${side}`;
    let strategy = getStrategyCatalogItem(strategyId);

    if (!strategy) {
      // Create an adhoc in-memory candidate without persisting a strategy
      strategy = buildAdhocStrategy(symbol, side);
    }

    const capital = price ? qty * price : qty * 100; // estimate capital for market orders

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

    const handoff = {
      id: `handoff-terminal-${Date.now()}`,
      strategyId: candidate.strategyId,
      strategyName: candidate.strategyName,
      mode: candidate.mode,
      capital: candidate.capital,
      orders: candidate.orders,
      summary: candidate.summary,
      riskStatus: riskAssessment.riskStatus,
      approvalState: riskAssessment.approvalState,
      riskSummary: riskAssessment.summary,
      metadata: candidate.metadata,
      createdAt: new Date().toISOString(),
    };

    controlPlaneRuntime.appendExecutionCandidateHandoff(handoff);

    writeJson(res, 200, {
      ok: true,
      handoffId: handoff.id,
      riskDecision: riskAssessment.riskStatus,
      approvalState: riskAssessment.approvalState,
      message: riskAssessment.summary,
    });
  } catch (err) {
    writeJson(res, 500, { ok: false, message: err.message || 'Failed to submit terminal order' });
  }

  return true;
}
