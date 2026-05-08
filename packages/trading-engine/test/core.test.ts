import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { STOCK_UNIVERSE } from '../src/core/constants.ts';
import {
  cloneState,
  computeAccount,
  createAccount,
  createTickerState,
} from '../src/core/shared.ts';

describe('createAccount', () => {
  it('creates account with correct initial values', () => {
    const account = createAccount('test', 'Test', 100000);
    assert.equal(account.id, 'test');
    assert.equal(account.cash, 100000);
    assert.equal(account.buyingPower, 100000);
    assert.equal(account.nav, 100000);
    assert.equal(account.pnlPct, 0);
    assert.equal(account.realizedPnl, 0);
    assert.deepEqual(account.holdings, {});
    assert.deepEqual(account.orders, []);
  });

  it('creates account with initial holdings', () => {
    const holdings = { AAPL: { shares: 100, avgCost: 150 } };
    const account = createAccount('test', 'Test', 50000, holdings);
    assert.equal(account.holdings.AAPL.shares, 100);
  });
});

describe('createTickerState', () => {
  it('creates stock state from ticker definition', () => {
    const ticker = STOCK_UNIVERSE[0]; // AAPL
    const state = createTickerState(ticker, 0);
    assert.equal(state.symbol, 'AAPL');
    assert.equal(state.name, 'Apple');
    assert.ok(state.price > 0);
    assert.ok(state.history.length > 0);
    assert.equal(state.signal, 'HOLD');
    assert.ok(typeof state.score === 'number');
  });

  it('generates deterministic price history from index', () => {
    const ticker = STOCK_UNIVERSE[0];
    const state1 = createTickerState(ticker, 0);
    const state2 = createTickerState(ticker, 0);
    assert.deepEqual(state1.history, state2.history);
  });

  it('different indices produce different histories', () => {
    const ticker = STOCK_UNIVERSE[0];
    const state0 = createTickerState(ticker, 0);
    const state1 = createTickerState(ticker, 1);
    assert.notDeepEqual(state0.history, state1.history);
  });
});

describe('computeAccount', () => {
  it('computes NAV as cash + market value of holdings', () => {
    const account = createAccount('test', 'Test', 50000, {
      AAPL: { shares: 100, avgCost: 150 },
    });
    const stockStates = [{ symbol: 'AAPL', price: 200 }];
    computeAccount(account, stockStates);
    assert.equal(account.nav, 50000 + 100 * 200);
  });

  it('computes exposure as market value percentage of NAV', () => {
    const account = createAccount('test', 'Test', 50000, {
      AAPL: { shares: 100, avgCost: 150 },
    });
    const stockStates = [{ symbol: 'AAPL', price: 200 }];
    computeAccount(account, stockStates);
    const expectedExposure = ((100 * 200) / (50000 + 100 * 200)) * 100;
    assert.ok(Math.abs(account.exposure - expectedExposure) < 0.01);
  });

  it('appends to equity series', () => {
    const account = createAccount('test', 'Test', 100000);
    const stockStates: Array<{ symbol: string; price: number }> = [];
    computeAccount(account, stockStates);
    assert.equal(account.equitySeries.length, 1);
    computeAccount(account, stockStates);
    assert.equal(account.equitySeries.length, 2);
  });
});

describe('cloneState', () => {
  it('deep clones stock states', () => {
    const ticker = STOCK_UNIVERSE[0];
    const stockState = createTickerState(ticker, 0);
    const state = {
      accounts: {
        paper: createAccount('paper', 'Paper', 100000),
        live: createAccount('live', 'Live', 100000),
      },
      stockStates: [stockState],
      integrationStatus: {
        marketData: { provider: 'simulated', label: 'Sim', connected: true, message: '' },
        broker: { provider: 'simulated', label: 'Sim', connected: true, message: '' },
      },
      brokerOrderStatusMap: {},
      approvalQueue: [],
      pendingLiveIntents: [],
      activityLog: [],
      controlPlane: {},
      orderSeq: 0,
    } as any;
    const cloned = cloneState(state);
    cloned.stockStates[0].price = 999;
    assert.notEqual(state.stockStates[0].price, 999);
  });

  it('deep clones account holdings', () => {
    const state = {
      accounts: {
        paper: createAccount('paper', 'Paper', 100000, { AAPL: { shares: 50, avgCost: 150 } }),
        live: createAccount('live', 'Live', 100000),
      },
      stockStates: [],
      integrationStatus: {
        marketData: { provider: 'simulated', label: 'Sim', connected: true, message: '' },
        broker: { provider: 'simulated', label: 'Sim', connected: true, message: '' },
      },
      brokerOrderStatusMap: {},
      approvalQueue: [],
      pendingLiveIntents: [],
      activityLog: [],
      controlPlane: {},
      orderSeq: 0,
    } as any;
    const cloned = cloneState(state);
    cloned.accounts.paper.holdings.AAPL.shares = 999;
    assert.equal(state.accounts.paper.holdings.AAPL.shares, 50);
  });
});
