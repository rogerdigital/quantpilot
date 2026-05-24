const DEFAULT_CRITERIA = {
  minTradingDays: 30,
  maxDrawdown: 0.15, // 15%
  minSharpe: 0.5,
  minTradeCount: 20,
  minWinRate: 0.4, // 40%
};

export function createPaperPromotionService({ paperJournalRepo }: { paperJournalRepo: Record<string, any> }) {
  return {
    evaluatePromotionReadiness(strategyId: string, customCriteria: Record<string, any> = {}) {
      const criteria = { ...DEFAULT_CRITERIA, ...customCriteria };
      const metrics = paperJournalRepo.getCumulativeMetrics(strategyId);

      if (!metrics) {
        return {
          ready: false,
          score: 0,
          criteria: [],
          message: 'No paper trading history found',
        };
      }

      const checks = [
        {
          name: 'tradingDays',
          label: 'Trading Days',
          labelZh: '交易天数',
          current: metrics.tradingDays,
          required: criteria.minTradingDays,
          met: metrics.tradingDays >= criteria.minTradingDays,
          unit: 'days',
        },
        {
          name: 'maxDrawdown',
          label: 'Max Drawdown',
          labelZh: '最大回撤',
          current: metrics.maxDrawdown,
          required: criteria.maxDrawdown,
          met: metrics.maxDrawdown <= criteria.maxDrawdown,
          unit: '%',
          format: (v: number) => `${(v * 100).toFixed(1)}%`,
        },
        {
          name: 'sharpe',
          label: 'Sharpe Ratio',
          labelZh: '夏普比率',
          current: metrics.sharpe,
          required: criteria.minSharpe,
          met: metrics.sharpe >= criteria.minSharpe,
          unit: '',
          format: (v: number) => v.toFixed(2),
        },
        {
          name: 'tradeCount',
          label: 'Trade Count',
          labelZh: '交易次数',
          current: metrics.totalTrades,
          required: criteria.minTradeCount,
          met: metrics.totalTrades >= criteria.minTradeCount,
          unit: 'trades',
        },
        {
          name: 'winRate',
          label: 'Win Rate',
          labelZh: '胜率',
          current: metrics.winRate,
          required: criteria.minWinRate,
          met: metrics.winRate >= criteria.minWinRate,
          unit: '%',
          format: (v: number) => `${(v * 100).toFixed(1)}%`,
        },
      ];

      const metCount = checks.filter((c) => c.met).length;
      const score = Math.round((metCount / checks.length) * 100);
      const ready = metCount === checks.length;

      return {
        ready,
        score,
        metrics,
        criteria: checks,
        message: ready
          ? 'All criteria met - ready for live promotion'
          : `${checks.length - metCount} criteria not yet met`,
      };
    },

    getPromotionReport(strategyId: string) {
      const readiness = this.evaluatePromotionReadiness(strategyId);
      const metrics = readiness.metrics;

      if (!metrics) {
        return null;
      }

      return {
        strategyId,
        readiness,
        summary: {
          tradingDays: metrics.tradingDays,
          totalTrades: metrics.totalTrades,
          winRate: `${(metrics.winRate * 100).toFixed(1)}%`,
          sharpe: metrics.sharpe.toFixed(2),
          maxDrawdown: `${(metrics.maxDrawdown * 100).toFixed(1)}%`,
          cagr: `${(metrics.cagr * 100).toFixed(1)}%`,
          totalPnl: metrics.totalPnl.toFixed(2),
          profitFactor: metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2),
        },
        generatedAt: new Date().toISOString(),
      };
    },
  };
}
