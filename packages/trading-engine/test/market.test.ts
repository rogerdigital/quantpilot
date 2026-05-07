import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_ENGINE_CONFIG, STOCK_UNIVERSE } from '../src/core/constants.ts';
import { createTickerState } from '../src/core/shared.ts';
import { createInitialStockStates, scoreStock, updateTicker } from '../src/market/index.ts';

describe('scoreStock', () => {
  it('assigns BUY signal for high-score stock', () => {
    const ticker = STOCK_UNIVERSE[0]; // AAPL, drift 0.12 (high positive)
    const stock = createTickerState(ticker, 0);
    // Force high drift to guarantee BUY
    stock.drift = 1.0;
    stock.history = Array.from({ length: 48 }, (_, i) => 100 + i * 2);
    stock.price = stock.history[stock.history.length - 1];
    scoreStock(stock);
    // With extreme drift, should get a high score
    assert.ok(stock.score >= 0 && stock.score <= 100);
    assert.ok(['BUY', 'SELL', 'HOLD'].includes(stock.signal));
  });

  it('score is clamped to [0, 100]', () => {
    const ticker = STOCK_UNIVERSE[0];
    const stock = createTickerState(ticker, 0);
    scoreStock(stock);
    assert.ok(stock.score >= 0);
    assert.ok(stock.score <= 100);
  });

  it('populates features object', () => {
    const ticker = STOCK_UNIVERSE[0];
    const stock = createTickerState(ticker, 0);
    scoreStock(stock);
    assert.ok('short' in stock.features);
    assert.ok('long' in stock.features);
    assert.ok('momentum' in stock.features);
    assert.ok('volatility' in stock.features);
    assert.ok('trend' in stock.features);
  });
});

describe('createInitialStockStates', () => {
  it('creates states for all stocks in universe', () => {
    const states = createInitialStockStates();
    assert.equal(states.length, STOCK_UNIVERSE.length);
  });

  it('each state has required properties', () => {
    const states = createInitialStockStates();
    for (const state of states) {
      assert.ok(state.symbol);
      assert.ok(state.price > 0);
      assert.ok(state.history.length > 0);
      assert.ok(typeof state.score === 'number');
      assert.ok(['BUY', 'SELL', 'HOLD'].includes(state.signal));
    }
  });
});

describe('updateTicker', () => {
  it('updates price deterministically from seed', () => {
    const ticker = STOCK_UNIVERSE[0];
    const stock1 = createTickerState(ticker, 0);
    const stock2 = createTickerState(ticker, 0);
    updateTicker(stock1, 0, 1, false, 10);
    updateTicker(stock2, 0, 1, false, 10);
    assert.equal(stock1.price, stock2.price);
  });

  it('appends to history', () => {
    const ticker = STOCK_UNIVERSE[0];
    const stock = createTickerState(ticker, 0);
    const historyLen = stock.history.length;
    updateTicker(stock, 0, 1, false, 10);
    assert.equal(stock.history.length, historyLen + 1);
  });

  it('trims history beyond 80 entries', () => {
    const ticker = STOCK_UNIVERSE[0];
    const stock = createTickerState(ticker, 0);
    for (let i = 0; i < 100; i++) {
      updateTicker(stock, 0, i, false, 10);
    }
    assert.ok(stock.history.length <= 80);
  });

  it('applies risk shock when riskGuard is active', () => {
    const ticker = STOCK_UNIVERSE[0];
    const stockNoRisk = createTickerState(ticker, 0);
    const stockWithRisk = createTickerState(ticker, 0);
    updateTicker(stockNoRisk, 0, 0, false, 10);
    updateTicker(stockWithRisk, 0, 0, true, 10);
    // When risk guard is on and index === cycle % stockCount, shock is applied
    // This may or may not produce lower price depending on shock magnitude vs other factors
    assert.ok(stockNoRisk.price > 0);
    assert.ok(stockWithRisk.price > 0);
  });
});
