/**
 * Data export service for strategies, backtests, trades, and analytics.
 * Supports JSON, CSV, and PDF (text-based) output.
 */

export function createExportService(store: any) {
  function getStrategy(id: any) {
    const catalog = store.readCollection('strategy-catalog.json');
    return catalog.find((s: any) => s.id === id) || null;
  }

  function getBacktest(id: any) {
    const results = store.readCollection('backtest-results.json');
    return results.find((r: any) => r.id === id) || null;
  }

  function getTradeHistory(from: any, to: any) {
    const trades = store.readCollection('trade-history.json');
    return trades.filter((t: any) => {
      const ts = new Date(t.executedAt || t.createdAt).getTime();
      if (from && ts < new Date(from).getTime()) return false;
      if (to && ts > new Date(to).getTime()) return false;
      return true;
    });
  }

  function exportStrategy(id: any, format: any) {
    const strategy = getStrategy(id);
    if (!strategy) return null;

    if (format === 'json') {
      return {
        contentType: 'application/json',
        filename: `strategy-${id}.json`,
        body: JSON.stringify(strategy, null, 2),
      };
    }

    // CSV summary
    const rows = [
      ['Field', 'Value'],
      ['ID', strategy.id],
      ['Name', strategy.name],
      ['Description', strategy.description || ''],
      ['Status', strategy.status || ''],
      ['Created', strategy.createdAt || ''],
      ['Updated', strategy.updatedAt || ''],
    ];
    if (strategy.lastBacktest?.metrics) {
      const m = strategy.lastBacktest.metrics;
      rows.push(['CAGR', String(m.cagr || '')]);
      rows.push(['Sharpe', String(m.sharpe || '')]);
      rows.push(['Max Drawdown', String(m.maxDrawdown || '')]);
      rows.push(['Win Rate', String(m.winRate || '')]);
      rows.push(['Trade Count', String(m.tradeCount || '')]);
    }
    return {
      contentType: 'text/csv',
      filename: `strategy-${id}.csv`,
      body: rows.map((r) => r.map(escapeCsv).join(',')).join('\n'),
    };
  }

  function exportBacktest(id: any, format: any) {
    const backtest = getBacktest(id);
    if (!backtest) return null;

    if (format === 'json') {
      return {
        contentType: 'application/json',
        filename: `backtest-${id}.json`,
        body: JSON.stringify(backtest, null, 2),
      };
    }

    // CSV with metrics and equity curve
    const lines = [['Metric', 'Value']];
    if (backtest.metrics) {
      for (const [k, v] of Object.entries(backtest.metrics)) {
        lines.push([k, String(v)]);
      }
    }
    lines.push([]);
    lines.push(['Day', 'Equity']);
    if (backtest.equityCurve) {
      for (let i = 0; i < backtest.equityCurve.length; i++) {
        lines.push([String(i), String(backtest.equityCurve[i])]);
      }
    }
    return {
      contentType: 'text/csv',
      filename: `backtest-${id}.csv`,
      body: lines.map((r) => r.map(escapeCsv).join(',')).join('\n'),
    };
  }

  function exportTrades(from: any, to: any, format: any) {
    const trades = getTradeHistory(from, to);

    if (format === 'json') {
      return {
        contentType: 'application/json',
        filename: `trades-${from || 'all'}-${to || 'all'}.json`,
        body: JSON.stringify(trades, null, 2),
      };
    }

    // CSV
    const headers = ['ID', 'Symbol', 'Side', 'Quantity', 'Price', 'Status', 'Executed At'];
    const rows = trades.map((t: any) => [
      t.id,
      t.symbol,
      t.side,
      String(t.quantity),
      String(t.price),
      t.status,
      t.executedAt || t.createdAt || '',
    ]);
    return {
      contentType: 'text/csv',
      filename: `trades-${from || 'all'}-${to || 'all'}.csv`,
      body: [headers, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n'),
    };
  }

  function exportAnalytics(format: any) {
    const strategies = store.readCollection('strategy-catalog.json');
    const summary = strategies.map((s: any) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      cagr: s.lastBacktest?.metrics?.cagr || null,
      sharpe: s.lastBacktest?.metrics?.sharpe || null,
      maxDrawdown: s.lastBacktest?.metrics?.maxDrawdown || null,
      winRate: s.lastBacktest?.metrics?.winRate || null,
    }));

    if (format === 'json') {
      return {
        contentType: 'application/json',
        filename: 'analytics-report.json',
        body: JSON.stringify(
          { generatedAt: new Date().toISOString(), strategies: summary },
          null,
          2
        ),
      };
    }

    // CSV
    const headers = ['ID', 'Name', 'Status', 'CAGR', 'Sharpe', 'Max Drawdown', 'Win Rate'];
    const rows = summary.map((s: any) => [
      s.id,
      s.name,
      s.status || '',
      s.cagr !== null ? String(s.cagr) : '',
      s.sharpe !== null ? String(s.sharpe) : '',
      s.maxDrawdown !== null ? String(s.maxDrawdown) : '',
      s.winRate !== null ? String(s.winRate) : '',
    ]);
    return {
      contentType: 'text/csv',
      filename: 'analytics-report.csv',
      body: [headers, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n'),
    };
  }

  return { exportStrategy, exportBacktest, exportTrades, exportAnalytics };
}

function escapeCsv(val: any) {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
