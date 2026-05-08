// @ts-nocheck
import { randomUUID } from 'node:crypto';
import { trimAndSave } from '../shared.js';

const JOURNAL_FILE = 'paper-journal.json';
const SNAPSHOTS_FILE = 'paper-snapshots.json';

function createJournalEntry(entry) {
  return {
    id: entry.id || `journal-${randomUUID()}`,
    strategyId: entry.strategyId || 'default',
    date: entry.date || new Date().toISOString().split('T')[0],
    nav: Number(entry.nav || 0),
    pnl: Number(entry.pnl || 0),
    pnlPercent: Number(entry.pnlPercent || 0),
    drawdown: Number(entry.drawdown || 0),
    tradeCount: Number(entry.tradeCount || 0),
    winCount: Number(entry.winCount || 0),
    lossCount: Number(entry.lossCount || 0),
    positions: entry.positions || [],
    metadata: entry.metadata || {},
    createdAt: entry.createdAt || new Date().toISOString(),
  };
}

function createSnapshotEntry(snapshot) {
  return {
    id: snapshot.id || `snapshot-${randomUUID()}`,
    strategyId: snapshot.strategyId || 'default',
    date: snapshot.date || new Date().toISOString().split('T')[0],
    nav: Number(snapshot.nav || 0),
    cash: Number(snapshot.cash || 0),
    positions: snapshot.positions || [],
    dailyPnl: Number(snapshot.dailyPnl || 0),
    cumulativePnl: Number(snapshot.cumulativePnl || 0),
    maxDrawdown: Number(snapshot.maxDrawdown || 0),
    tradeCount: Number(snapshot.tradeCount || 0),
    metadata: snapshot.metadata || {},
    createdAt: snapshot.createdAt || new Date().toISOString(),
  };
}

export function createPaperJournalRepository(store) {
  function getAllEntries() {
    return store.readCollection(JOURNAL_FILE);
  }

  function getAllSnapshots() {
    return store.readCollection(SNAPSHOTS_FILE);
  }

  return {
    recordDailyEntry(entryData) {
      const entries = getAllEntries();
      const entry = createJournalEntry(entryData);

      // Check if entry for this date already exists
      const existingIdx = entries.findIndex(
        (e) => e.strategyId === entry.strategyId && e.date === entry.date
      );

      if (existingIdx >= 0) {
        entries[existingIdx] = { ...entries[existingIdx], ...entry };
      } else {
        entries.unshift(entry);
      }

      trimAndSave(store, JOURNAL_FILE, entries, 1000);
      return entry;
    },

    recordSnapshot(snapshotData) {
      const snapshots = getAllSnapshots();
      const snapshot = createSnapshotEntry(snapshotData);
      snapshots.unshift(snapshot);
      trimAndSave(store, SNAPSHOTS_FILE, snapshots, 500);
      return snapshot;
    },

    getJournalEntries(strategyId, limit = 90) {
      return getAllEntries()
        .filter((e) => e.strategyId === strategyId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
    },

    getSnapshots(strategyId, limit = 30) {
      return getAllSnapshots()
        .filter((s) => s.strategyId === strategyId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
    },

    getCumulativeMetrics(strategyId) {
      const entries = getAllEntries()
        .filter((e) => e.strategyId === strategyId)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (entries.length === 0) {
        return null;
      }

      const totalTrades = entries.reduce((sum, e) => sum + e.tradeCount, 0);
      const totalWins = entries.reduce((sum, e) => sum + e.winCount, 0);
      const totalLosses = entries.reduce((sum, e) => sum + e.lossCount, 0);
      const maxDrawdown = Math.max(...entries.map((e) => e.drawdown));
      const totalPnl = entries.reduce((sum, e) => sum + e.pnl, 0);

      // Calculate daily returns for Sharpe ratio
      const dailyReturns = entries.map((e) => e.pnlPercent / 100);
      const avgReturn = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
      const stdReturn = Math.sqrt(
        dailyReturns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / dailyReturns.length
      );
      const sharpe = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;

      // Calculate win rate
      const winRate = totalTrades > 0 ? totalWins / totalTrades : 0;

      // Calculate profit factor
      const grossProfit = entries
        .filter((e) => e.pnl > 0)
        .reduce((sum, e) => sum + e.pnl, 0);
      const grossLoss = Math.abs(
        entries.filter((e) => e.pnl < 0).reduce((sum, e) => sum + e.pnl, 0)
      );
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

      // Trading days
      const tradingDays = entries.length;

      // First and last NAV for CAGR
      const firstNav = entries[0].nav;
      const lastNav = entries[entries.length - 1].nav;
      const years = tradingDays / 252;
      const cagr = years > 0 && firstNav > 0 ? (lastNav / firstNav) ** (1 / years) - 1 : 0;

      return {
        tradingDays,
        totalTrades,
        totalWins,
        totalLosses,
        winRate,
        totalPnl,
        maxDrawdown,
        sharpe,
        profitFactor,
        cagr,
        avgDailyReturn: avgReturn,
        dailyReturnStd: stdReturn,
        firstNav,
        lastNav,
      };
    },
  };
}
