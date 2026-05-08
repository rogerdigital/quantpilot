// @ts-nocheck

export function generateOpenApiSpec(baseUrl = '') {
  return {
    openapi: '3.0.3',
    info: {
      title: 'QuantPilot API',
      description:
        'AI-native quantitative trading platform API. Covers strategies, backtesting, execution, risk, analytics, and agent governance.',
      version: '1.0.0',
      contact: { name: 'QuantPilot Team' },
      license: { name: 'MIT' },
    },
    servers: [{ url: baseUrl || 'http://localhost:8787', description: 'Local development' }],
    tags: [
      { name: 'Health', description: 'System health and monitoring' },
      { name: 'Strategies', description: 'Strategy management' },
      { name: 'Backtest', description: 'Backtesting runs and results' },
      { name: 'Execution', description: 'Order execution and fills' },
      { name: 'Trading', description: 'Trading terminal operations' },
      { name: 'Risk', description: 'Risk management and parameters' },
      { name: 'Analytics', description: 'Performance analytics and reporting' },
      { name: 'Agent', description: 'AI agent governance and analysis' },
      { name: 'Marketplace', description: 'Strategy marketplace' },
      { name: 'Collaboration', description: 'Strategy sharing and comments' },
      { name: 'Export', description: 'Data export (JSON/CSV)' },
    ],
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: { 200: { description: 'System healthy' } },
        },
      },
      '/api/strategies': {
        get: {
          tags: ['Strategies'],
          summary: 'List all strategies',
          responses: {
            200: {
              description: 'Strategy list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { ok: { type: 'boolean' }, strategies: { type: 'array' } },
                  },
                },
              },
            },
          },
        },
      },
      '/api/strategies/{id}': {
        get: {
          tags: ['Strategies'],
          summary: 'Get strategy by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Strategy detail' }, 404: { description: 'Not found' } },
        },
      },
      '/api/backtest/runs': {
        get: {
          tags: ['Backtest'],
          summary: 'List backtest runs',
          responses: { 200: { description: 'Backtest runs list' } },
        },
        post: {
          tags: ['Backtest'],
          summary: 'Start a new backtest run',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    strategyId: { type: 'string' },
                    startDate: { type: 'string', format: 'date' },
                    endDate: { type: 'string', format: 'date' },
                    initialCapital: { type: 'number' },
                  },
                  required: ['strategyId'],
                },
              },
            },
          },
          responses: {
            200: { description: 'Backtest started' },
            400: { description: 'Invalid request' },
          },
        },
      },
      '/api/execution/orders': {
        get: {
          tags: ['Execution'],
          summary: 'List orders',
          parameters: [
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['pending', 'filled', 'cancelled', 'rejected'] },
            },
          ],
          responses: { 200: { description: 'Orders list' } },
        },
      },
      '/api/risk/parameters': {
        get: {
          tags: ['Risk'],
          summary: 'Get risk parameters',
          responses: { 200: { description: 'Risk parameters' } },
        },
        post: {
          tags: ['Risk'],
          summary: 'Update risk parameters',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    maxPositionSize: { type: 'number' },
                    maxDailyLoss: { type: 'number' },
                    maxDrawdown: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Parameters updated' } },
        },
      },
      '/api/analytics/performance': {
        get: {
          tags: ['Analytics'],
          summary: 'Get performance analytics data',
          parameters: [
            {
              name: 'range',
              in: 'query',
              schema: { type: 'string', enum: ['1M', '3M', '6M', '1Y', 'ALL'] },
              description: 'Time range',
            },
          ],
          responses: {
            200: {
              description:
                'Performance data including summary metrics, equity curve, drawdown, monthly returns, and trade distribution',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          summary: { $ref: '#/components/schemas/PerformanceSummary' },
                          equityCurve: { type: 'array', items: { type: 'number' } },
                          drawdownSeries: { type: 'array', items: { type: 'number' } },
                          monthlyReturns: { type: 'object' },
                          tradeDistribution: { type: 'array', items: { type: 'object' } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/marketplace/strategies': {
        get: {
          tags: ['Marketplace'],
          summary: 'Browse published strategies',
          parameters: [
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search query' },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'minRating', in: 'query', schema: { type: 'number' } },
            {
              name: 'sortBy',
              in: 'query',
              schema: { type: 'string', enum: ['popular', 'rating', 'newest'] },
            },
          ],
          responses: { 200: { description: 'Marketplace strategies' } },
        },
      },
      '/api/export/strategies/{id}': {
        get: {
          tags: ['Export'],
          summary: 'Export strategy data',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            {
              name: 'format',
              in: 'query',
              schema: { type: 'string', enum: ['json', 'csv'] },
              description: 'Export format',
            },
          ],
          responses: { 200: { description: 'Exported file' }, 404: { description: 'Not found' } },
        },
      },
      '/api/export/backtest/{id}': {
        get: {
          tags: ['Export'],
          summary: 'Export backtest results',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'] } },
          ],
          responses: { 200: { description: 'Exported file' }, 404: { description: 'Not found' } },
        },
      },
      '/api/export/trades': {
        get: {
          tags: ['Export'],
          summary: 'Export trade history',
          parameters: [
            { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'] } },
          ],
          responses: { 200: { description: 'Exported trade history' } },
        },
      },
      '/api/export/analytics': {
        get: {
          tags: ['Export'],
          summary: 'Export analytics report',
          parameters: [
            { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'] } },
          ],
          responses: { 200: { description: 'Exported analytics report' } },
        },
      },
    },
    components: {
      schemas: {
        PerformanceSummary: {
          type: 'object',
          properties: {
            totalReturn: { type: 'number', description: 'Total return (decimal)' },
            cagr: { type: 'number', description: 'Compound annual growth rate' },
            sharpe: { type: 'number', description: 'Sharpe ratio' },
            sortino: { type: 'number', description: 'Sortino ratio' },
            maxDrawdown: { type: 'number', description: 'Maximum drawdown (decimal)' },
            winRate: { type: 'number', description: 'Win rate (decimal)' },
            profitFactor: { type: 'number', description: 'Profit factor' },
            tradingDays: { type: 'integer', description: 'Number of trading days' },
            totalTrades: { type: 'integer', description: 'Total number of trades' },
          },
        },
      },
    },
  };
}
