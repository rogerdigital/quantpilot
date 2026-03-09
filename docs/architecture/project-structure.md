# QuantPilot 目录结构

仓库已经按 `apps / packages / docs` 重构为第一阶段 monorepo 形态，用来承接你定义的七层架构。

## 当前目录骨架

```text
quantpilot/
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   └── src/
│   │       ├── main.mjs
│   │       ├── app/
│   │       ├── gateways/
│   │       └── modules/
│   └── web/
│       ├── public/
│       ├── src/
│       │   ├── app/
│       │   ├── data/
│       │   ├── pages/
│       │   ├── services/
│       │   └── store/
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── docs/
│   └── architecture/
├── packages/
│   └── shared-types/
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── package.json
└── tsconfig.base.json
```

## 模块职责

- `apps/web/src/app/`
  - 前端应用装配层，负责 providers、router 和全局样式。
- `apps/web/src/pages/`
  - 前端页面层，已对齐 `dashboard / market / strategies / backtest / risk / execution / agent / notifications / settings`。
- `apps/web/src/store/`
  - 前端状态层，`TradingSystemProvider.tsx` 负责本地周期推进和后端控制面协同，`core/` 目录下按市场、策略、风控、执行、控制面和生命周期切分纯计算逻辑。
- `apps/web/src/services/`
  - 运行配置、provider 接入和控制面通信层，包括 market data、broker 与 control-plane service。
- `apps/api/src/`
  - 后端入口和平台底座骨架，当前包括 app、gateway、最小控制面服务和模块注册层。
- `apps/api/src/modules/`
  - 控制中枢的模块规划，包括 API、鉴权、账户、任务编排、通知、审计、监控和调度；其中 `auth / audit / notification / task-orchestrator` 已具备最小内存实现。
- `packages/shared-types/src/`
  - 共享类型层，承接前端、API 和后续 worker 的统一领域模型。

## 当前差距

- `apps/web/src/store/trading-system/core/` 已完成第一轮切片，但仍属于前端原型状态机，后续应继续向真正的领域服务和后端任务流迁移。
- `apps/api` 已具备最小控制面接口和 `cycle resolve` 能力，但仍是轻量 Node 网关形态，尚未进入真正的 NestJS 模块实现阶段。
- `packages` 目前只落了 `shared-types`，`data-core / strategy-core / risk-core / execution-core` 仍应随着真实实现逐步抽离。

## 下一步建议

1. 把 `task-orchestrator` 从当前的内存控制面升级为真正的任务流和队列执行层。
2. 把 `core/lifecycle.ts` 里的异步编排继续迁到后端任务层，前端只保留状态消费和交互动作。
3. 当后端能力稳定后，再把共享规则和核心逻辑逐步抽成更多 `packages/*`。
