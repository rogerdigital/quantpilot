# QuantPilot 目录结构

当前仓库已经按“应用层 / 页面层 / 服务层 / 状态层 / 类型层 / 后端模块层”完成两轮重组，前端外层信息架构已经对齐 `dashboard / strategies / risk / execution / agent / settings`。

## 当前目录骨架

```text
quantpilot/
├── server/
│   ├── app/
│   │   └── index.mjs
│   ├── gateways/
│   │   └── alpaca.mjs
│   ├── index.mjs
│   └── modules/
│       ├── api-gateway/
│       ├── auth/
│       ├── user-account/
│       ├── task-orchestrator/
│       ├── notification/
│       ├── audit/
│       ├── monitoring/
│       └── scheduler/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── providers/
│   │   │   └── AppProviders.tsx
│   │   ├── routes/
│   │   │   └── AppRouter.tsx
│   │   └── styles/
│   │       └── style.css
│   ├── data/
│   │   └── market_data.json
│   ├── pages/
│   │   ├── agent/
│   │   │   └── AgentPage.tsx
│   │   ├── console/
│   │   │   ├── DashboardConsole.tsx
│   │   │   ├── components/
│   │   │   │   ├── ConsoleChrome.tsx
│   │   │   │   └── ConsoleTables.tsx
│   │   │   ├── hooks.ts
│   │   │   ├── i18n.tsx
│   │   │   ├── routes/
│   │   │   │   ├── ExecutionPage.tsx
│   │   │   │   ├── MarketPage.tsx
│   │   │   │   ├── OverviewPage.tsx
│   │   │   │   ├── PortfolioPage.tsx
│   │   │   │   ├── SettingsPage.tsx
│   │   │   │   └── SignalsPage.tsx
│   │   │   └── utils.ts
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── execution/
│   │   │   └── ExecutionPage.tsx
│   │   ├── risk/
│   │   │   └── RiskPage.tsx
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx
│   │   └── strategies/
│   │       └── StrategiesPage.tsx
│   ├── services/
│   │   ├── config/
│   │   │   └── runtime.ts
│   │   └── providers/
│   │       ├── broker.ts
│   │       └── marketData.ts
│   ├── shared/
│   │   └── types/
│   │       └── trading.ts
│   ├── store/
│   │   └── trading-system/
│   │       ├── core.ts
│   │       └── TradingSystemProvider.tsx
│   └── main.tsx
└── docs/
    └── architecture/
        └── project-structure.md
```

## 模块职责

- `src/app/`: 应用层入口，只负责装配 providers、router 和全局样式。
- `src/pages/`: 页面层。外层已经按 `dashboard / strategies / risk / execution / agent / settings` 建立产品模块，`console/` 负责承载共享壳层、通用组件和旧原型兼容路由。
- `src/store/`: 前端状态层。`TradingSystemProvider.tsx` 负责 React 生命周期与交互动作，`core.ts` 负责纯计算、初始状态和执行推进逻辑。
- `src/services/`: 与外部接入和运行配置相关的服务层。
- `src/shared/types/`: 共享类型定义，避免 UI、状态和 provider 各自维护模型。
- `server/app/`: 后端运行入口。
- `server/modules/`: 后端业务模块骨架，对齐 API、鉴权、任务编排、通知、审计和调度。

## 下一步建议

1. 把 `trading-system/core.ts` 继续拆成 `market / strategy / execution / risk` 领域切片。
2. 把 `console/routes/` 里的旧原型页面逐步消化到新的产品模块目录，减少兼容层。
3. 在 `server/modules/` 内逐步落 `NestJS` 或 `Fastify` 模块实现，而不是再往 `server/app/index.mjs` 堆逻辑。
