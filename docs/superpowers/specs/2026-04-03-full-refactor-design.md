# QuantPilot 全面重构设计规范

> 基于代码审计报告 (2026-04-03)，针对原型质量问题进行系统性修复

## 目标

消除代码库中的架构腐化点：死代码堆积、后端路由臃肿、Worker 跨 app 耦合、缺少错误边界、测试缺口。所有功能行为保持不变。所有现有测试通过不变。

---

## 重构范围（5个独立任务）

### Task 1 — 删除前端死代码

**问题：** 两类死代码积累：
1. **纯 re-export stub 文件**（永远不被应用代码直接 import 的中转文件）
2. **孤立页面文件**（完整实现但从未被任何路由引用）

**要删除的文件（精确列表）：**

Re-export stubs（`services/` 层 - 全部）：
- `apps/web/src/services/agentTools.ts`
- `apps/web/src/services/controlPlane.ts`
- `apps/web/src/services/research.ts`
- `apps/web/src/services/config/runtime.ts`
- `apps/web/src/services/providers/broker.ts`
- `apps/web/src/services/providers/marketData.ts`

Re-export stubs（`hooks/` 层 - 只删纯 re-exports）：
- `apps/web/src/hooks/useAgentTools.ts`
- `apps/web/src/hooks/useNotificationsFeed.ts`
- `apps/web/src/hooks/useOperatorActionsFeed.ts`
- `apps/web/src/hooks/useResearchHub.ts`
- `apps/web/src/hooks/useRiskEventsFeed.ts`
- `apps/web/src/hooks/useSchedulerTicksFeed.ts`

Re-export stubs（`pages/` 层 - 非 InspectionPanels）：
- `apps/web/src/pages/dashboard/DashboardPage.tsx`（→ modules/console/pages/DashboardPage.tsx）
- `apps/web/src/pages/execution/ExecutionPage.tsx`（→ modules/console/pages/ExecutionPage.tsx）
- `apps/web/src/pages/market/MarketPage.tsx`（→ modules/console/pages/MarketPage.tsx）
- `apps/web/src/pages/settings/SettingsPage.tsx`（→ modules/console/pages/SettingsPage.tsx）
- `apps/web/src/pages/agent/AgentPage.tsx`（→ modules/agent/AgentPage.tsx）
- `apps/web/src/pages/console/DashboardConsole.tsx`（→ modules/console/DashboardConsole.tsx）
- `apps/web/src/pages/console/hooks.ts`（→ modules/console/console.hooks.ts）
- `apps/web/src/pages/console/utils.ts`（→ modules/console/console.utils.ts）
- `apps/web/src/pages/console/i18n.tsx`（→ modules/console/console.i18n.tsx）
- `apps/web/src/pages/console/components/ConsoleChrome.tsx`（→ components/layout/ConsoleChrome.tsx）
- `apps/web/src/pages/console/components/ConsoleTables.tsx`（→ components/business/ConsoleTables.tsx）

Re-export stubs（`modules/` 层）：
- `apps/web/src/modules/research/StrategiesPage.tsx`（→ pages/strategies/StrategiesPage.tsx）
- `apps/web/src/modules/research/BacktestPage.tsx`（→ pages/backtest/BacktestPage.tsx）
- `apps/web/src/modules/risk/RiskPage.tsx`（→ pages/risk/RiskPage.tsx）
- `apps/web/src/modules/notifications/NotificationsPage.tsx`（→ pages/notifications/NotificationsPage.tsx）

孤立死页面：
- `apps/web/src/pages/console/routes/PortfolioPage.tsx`
- `apps/web/src/pages/console/routes/SignalsPage.tsx`

**不删除的文件：**
- `apps/web/src/pages/console/components/InspectionPanels.tsx` — 包含真实组件实现
- `apps/web/src/hooks/useLatestBrokerSnapshot.ts` — 真实 hook 实现
- `apps/web/src/hooks/useMarketProviderStatus.ts` — 真实 hook 实现
- `apps/web/src/hooks/useMonitoringStatus.ts` — 真实 hook 实现

**关键影响链分析：**

删除 re-export stubs 后，需要更新唯一消费它们的文件：
- `modules/console/DashboardConsole.tsx` 通过 `pages/console/components/ConsoleChrome.tsx` (stub) 引用 → 需改为直接 import `components/layout/ConsoleChrome.tsx`
- `modules/console/DashboardConsole.tsx` 通过 `pages/console/i18n.tsx` (stub) → 需改为直接 import `modules/console/console.i18n.tsx`
- `modules/console/console.routes.tsx` 通过 `modules/research/StrategiesPage.tsx` (stub) → 需改为直接 import `pages/strategies/StrategiesPage.tsx`
- `modules/console/console.routes.tsx` 通过 `modules/research/BacktestPage.tsx` (stub) → 需改为直接 import `pages/backtest/BacktestPage.tsx`
- `modules/console/console.routes.tsx` 通过 `modules/notifications/NotificationsPage.tsx` (stub) → 需改为直接 import `pages/notifications/NotificationsPage.tsx`
- `modules/console/console.routes.tsx` 通过 `modules/risk/RiskPage.tsx` (stub) → 需改为直接 import `pages/risk/RiskPage.tsx`

所有其他应用代码已直接 import 规范路径，无需修改。

---

### Task 2 — 添加 React Error Boundary

**问题：** React 树无错误边界，任何页面级 runtime 错误白屏。

**方案：** 创建 `apps/web/src/app/components/ErrorBoundary.tsx`，在 `apps/web/src/app/routes/AppRouter.tsx` 的 Suspense 外层包裹 ErrorBoundary。

错误边界显示友好降级 UI，匹配 Terminal Luxe 设计风格（沿用 CSS custom properties）。

---

### Task 3 — 后端 API 路由模块化

**问题：** `platform-routes.mjs`（902行）+ `control-plane-routes.mjs`（403行）= 1305行的 if-chain，维护性极差。

**方案：** 按业务域拆分为独立 router 模块，主 dispatch 仅做分发。不引入任何新依赖，不改变任何路由路径或业务逻辑。

**新文件结构：**
```
apps/api/src/app/routes/
├── platform-routes.mjs          # 重构后：调用各 domain router
├── control-plane-routes.mjs     # 重构后：调用各 domain router
├── routers/
│   ├── health-router.mjs        # /api/health, /api/modules, /api/architecture
│   ├── monitoring-router.mjs    # /api/monitoring/*
│   ├── operations-router.mjs    # /api/operations/*
│   ├── auth-router.mjs          # /api/auth/*
│   ├── user-account-router.mjs  # /api/user-account/*
│   ├── agent-router.mjs         # /api/agent/*
│   ├── strategy-router.mjs      # /api/strategy/*
│   ├── backtest-router.mjs      # /api/backtest/*
│   ├── research-router.mjs      # /api/research/*
│   ├── execution-router.mjs     # /api/execution/*
│   ├── market-router.mjs        # /api/market/*
│   ├── audit-router.mjs         # /api/audit/*
│   ├── incidents-router.mjs     # /api/incidents/*
│   ├── notification-router.mjs  # /api/notification/*
│   ├── risk-router.mjs          # /api/risk/*
│   ├── scheduler-router.mjs     # /api/scheduler/*
│   └── task-orchestrator-router.mjs  # /api/task-orchestrator/*
```

每个 router 导出 `handle<Domain>Routes(context)` 函数，返回 `true`（已处理）或 `false`（未匹配）。

`platform-routes.mjs` 重构为：依次调用各 domain router 并返回第一个 `true` 的结果。行数从 902 降至约 30。

---

### Task 4 — Worker 解耦（消除 apps/api 跨 app import）

**问题：** `apps/worker/src/tasks/workflow-execution-task.mjs` 直接 import：
- `../../../api/src/modules/execution/service.mjs` → `recordExecutionPlan`
- `../../../api/src/domains/backtest/services/summary-service.mjs` → `refreshBacktestSummary`
- `../../../api/src/modules/risk/service.mjs` → `assessAgentActionRequestRisk`, `assessExecutionCandidate`
- `../../../api/src/modules/strategy/service.mjs` → `buildStrategyExecutionCandidate`
- `../../../api/src/modules/agent/service.mjs` → `recordAgentActionRequest`

**方案：** 这 6 个函数应通过依赖注入从 `control-plane-runtime` 获取，而不是直接 import 跨 app 代码。

具体做法：在 `packages/control-plane-runtime/src/index.mjs` 中暴露这些 domain 方法（通过 re-export 或封装），Worker 的 `createWorkerExecutionContext()` 从 `controlPlaneRuntime` 读取这些方法，而不是直接 import。

这样 Worker 只依赖 `packages/`，完全不依赖 `apps/api/`。

---

### Task 5 — 补充 stage-5 测试

**问题：** `apps/api/test/` 目录有 stage-1~4 和 stage-6 的 baseline 测试，但缺少 stage-5。

**方案：** 阅读 `docs/architecture/stage-5-closeout.md` 了解 stage-5 引入的能力，编写对应的 smoke tests 覆盖 stage-5 的合约路由。

---

## 约束

- 所有改动后 `npm run verify` 必须 100% 通过
- 不改变任何路由路径、API 合约、业务逻辑
- 不引入新依赖
- CSS 不动（只在 `style.css` 中）
- commit 不加 AI 署名
