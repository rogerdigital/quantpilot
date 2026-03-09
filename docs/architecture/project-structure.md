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
│   ├── worker/
│   │   ├── package.json
│   │   └── src/
│   │       ├── main.mjs
│   │       ├── app/
│   │       ├── runtime/
│   │       └── tasks/
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
│   ├── control-plane-store/
│   │   ├── src/
│   │   └── package.json
│   ├── shared-types/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── trading-engine/
│       ├── src/
│       └── package.json
├── package.json
└── tsconfig.base.json
```

## 模块职责

- `apps/web/src/app/`
  - 前端应用装配层，负责 providers、router 和全局样式。
- `apps/web/src/pages/`
  - 前端页面层，已对齐 `dashboard / market / strategies / backtest / risk / execution / agent / notifications / settings`。
- `apps/web/src/store/`
  - 前端状态层，`TradingSystemProvider.tsx` 负责向后端提交当前状态并消费新状态，`core/` 目录下主要保留对共享 runtime 的类型化封装。
- `apps/web/src/services/`
  - 运行配置、provider 接入和控制面通信层，包括 market data、broker 与 control-plane service。
- `apps/api/src/`
  - 后端入口和平台底座骨架，当前包括 app、gateway、最小控制面服务和模块注册层。
- `apps/worker/src/`
  - 异步任务进程骨架，当前已拆出独立启动入口、worker runtime 和后台 task 目录，已接管 notification dispatch、risk scan 和 scheduler tick 三类后台任务。
- `apps/api/src/modules/`
  - 控制中枢的模块规划，包括 API、鉴权、账户、任务编排、通知、风控、审计、监控和调度；其中 `auth / audit / notification / risk / task-orchestrator` 已具备最小原型实现。
- `packages/shared-types/src/`
  - 共享类型层，承接前端、API 和后续 worker 的统一领域模型。
- `packages/control-plane-store/src/`
  - 控制面文件存储层，当前承载 notification outbox、risk scan outbox、已分发通知事件、风险事件流、scheduler ticks、audit records、cycle records 和 operator actions，为 API 与 worker 提供最小跨进程共享状态。
- `packages/trading-engine/src/`
  - 共享运行时层，当前已按 `constants / shared / market / execution / risk / strategy / control-plane` 拆分，沉淀市场推进、策略执行、风控裁决、订单意图和控制面状态合并逻辑，供前后端共同消费。

## 当前差距

- `apps/web/src/store/trading-system/core/` 已从本地状态机实现收敛为共享 runtime 的前端包装层，但前端状态驱动本身仍属原型形态。
- `apps/api` 已具备最小控制面接口、`cycle runner` 和 `state runner` 能力，其中 `state runner` 已收敛为对共享 runtime 的服务端编排封装，但整体仍是轻量 Node 网关形态，尚未进入真正的 NestJS 模块实现阶段。
- `apps/worker` 当前已接管 notification outbox 分发、risk scan 处理和 scheduler tick，但尚未真正接管重试补偿和更复杂的定时编排。
- `packages` 目前已落 `shared-types`、`trading-engine` 与 `control-plane-store`，`data-core / strategy-core / risk-core / execution-core` 仍应随着真实实现逐步抽离。

## 下一步建议

1. 把 `task-orchestrator` 从当前的内存控制面升级为真正的任务流和队列执行层。
2. 把 `core/lifecycle.ts` 里的异步编排继续迁到后端任务层，前端只保留状态消费和交互动作。
3. 当后端能力稳定后，再把共享规则和核心逻辑逐步抽成更多 `packages/*`。
