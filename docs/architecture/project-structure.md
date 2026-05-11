# QuantPilot 目录结构

仓库已经形成面向七层架构的 monorepo 目录体系，当前持续处于“研发迭代”阶段，用这套结构承接平台能力落地。

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
│       │   ├── hooks/
│       │   ├── modules/
│       │   └── store/
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── docs/
│   └── architecture/
├── packages/
│   ├── control-plane-runtime/
│   │   ├── src/
│   │   └── package.json
│   ├── task-workflow-engine/
│   │   ├── src/
│   │   └── package.json
│   ├── db/
│   │   ├── src/
│   │   └── package.json
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
- `apps/web/src/app/` 与 `apps/web/src/hooks/`
  - 前端运行配置、provider 接入、控制面通信与共享数据拉取层，包括 runtime config、market data、broker、HTTP API 与轮询 hooks。
- `apps/api/src/`
  - 后端入口和平台底座骨架，当前包括 app、gateway、最小控制面服务和模块注册层。
- `apps/api/test/`
  - API 网关级集成测试，当前覆盖 notification、risk、scheduler、audit、cycles、workflow runs、cycle resolution 和 state runner 这些控制面核心接口。
- `apps/worker/src/`
  - 异步任务进程骨架，当前已拆出独立启动入口、worker runtime 和后台 task 目录，已接管 notification dispatch、risk scan、scheduler tick、workflow maintenance 和 workflow execution 五类后台任务。
- `apps/worker/test/`
  - worker 任务级测试，当前覆盖 notification dispatch、risk scan、scheduler tick、workflow maintenance 和 workflow execution 五类后台任务的核心副作用。
- `apps/api/src/modules/`
  - 控制中枢的模块规划，包括 API、鉴权、账户、任务编排、通知、风控、审计、监控和调度；其中 `auth / audit / notification / risk / task-orchestrator` 已具备最小原型实现。
- `packages/control-plane-runtime/src/`
  - 控制面共享服务装配层，统一封装 audit、notification、risk、scheduler、cycles、workflow runs、operator actions 以及 task-orchestrator 的 audit/notification fanout、workflow 状态流转、重试调度和恢复取消规则，供 API 与 worker 共同消费。
- `packages/shared-types/src/`
  - 共享类型层，承接前端、API 和后续 worker 的统一领域模型。
- `packages/db/src/`
  - 底层存储接口层，当前提供 `collection store`、`kv store` 以及 `file / db` 两类 control-plane adapter foundation；embedded db path 现已补上 schema manifest 与 migration contracts，`control-plane-store` 可在保持 file 默认实现的前提下切换到 db adapter 并显式管理版本基线。
- `packages/control-plane-store/src/`
  - 控制面持久化层，当前已拆成 `context + repositories/* + shared + store` 结构，承载 notification outbox、risk scan outbox、已分发通知事件、风险事件流、scheduler ticks、audit records、cycle records、workflow runs 和 operator actions，并通过统一 storage adapter 入口为 API 与 worker 提供跨进程共享状态。
- `packages/control-plane-store/test/`
  - 控制面核心 repository 的轻量自动化测试，当前覆盖 notification、risk、scheduler 以及 context 注入路径。
- `packages/control-plane-runtime/test/`
  - 控制面共享 runtime 的自动化测试，当前覆盖装配委托、queued job 分发、workflow lifecycle、retry scheduling 和 resume/cancel 路径。
- `packages/task-workflow-engine/src/`
  - task workflow shared execution layer，当前承载 `cycle-run / state-run / manual-review` 这些 workflow 的 executor registry 和执行逻辑，供 API 与 worker 共同消费。
- `packages/task-workflow-engine/test/`
  - task workflow shared engine 的自动化测试，当前覆盖 cycle/state workflow 执行和 queued workflow dispatch。
- `packages/trading-engine/src/`
  - 共享运行时层，当前已按 `constants / shared / market / execution / risk / strategy / control-plane` 拆分，沉淀市场推进、策略执行、风控裁决、订单意图和控制面状态合并逻辑，供前后端共同消费。

## 当前差距

- 当前交付物仍主要是“平台骨架 + 最小闭环”，还不是成熟的专业交易平台。
- `strategy-execution` workflow 的最小闭环已打通：现在会经过 API 入队、worker 执行、JSON store 持久化、risk 审核和 execution plan 落库。
- workflow lifecycle 的失败、重试、恢复、取消和 maintenance re-queue 也已统一 fanout 到后端 audit 与 notification，并联动 execution plan 状态。
- `apps/web/src/store/trading-system/core/` 已从本地状态机实现收敛为共享 runtime 的前端包装层，但前端状态驱动本身仍属原型形态。
- `apps/api` 已具备最小控制面接口、`cycle runner` 和 `state runner` 能力，其中 `state runner` 已收敛为对共享 runtime 的服务端编排封装，但整体仍是轻量 Node 网关形态，尚未进入真正的 NestJS 模块实现阶段。
- `apps/api` 现已补上 `strategy / backtest` 研究接口，`apps/web/src/pages/backtest/BacktestPage.tsx` 已开始消费结构化研究数据，但回测执行仍是静态研究快照而非真实任务运行结果。
- `apps/worker` 当前已接管 notification outbox 分发、risk scan 处理和 scheduler tick，但尚未真正接管重试补偿和更复杂的定时编排。
- `packages` 目前已落 `shared-types`、`trading-engine` 与 `control-plane-store`，`data-core / strategy-core / risk-core / execution-core` 仍应随着真实实现逐步抽离。
- 用户系统、权限模型、账户体系、券商绑定、真实市场数据、订单状态机和 Agent 规划能力仍未真正落地。

## 研发迭代阶段

### 阶段 1 到阶段 7 → 已收官

### Institutional Research Platform (阶段 8-12) → 已收官

Stage 8-12 完成了从专业量化研究平台到机构级部署的完整链路：

1. **Domain Contracts (Stage 8)**：定义了 AI Research、Data Science、Experiments、Lifecycle、Organization 和 Compute 六大共享类型体系。
2. **Data Science Platform (Stage 9)**：Dataset Registry、Feature Registry、Data Quality 七项自动化检查、数据版本激活策略、Feature Lineage 血缘追踪。
3. **Research OS (Stage 9)**：Research Workspace 带假设管理、Experiment Registry、Model Registry。
4. **Backtest Lab (Stage 9)**：Reproducible backtest specs (hash-stable)、Commission/Slippage models、Regime Attribution、Walk-Forward Analysis、Robustness Diagnostics。
5. **Strategy Lifecycle (Stage 10)**：8 个 Promotion Gates、Evidence-based 晋升(research→paper→live)、Strategy Registry。
6. **Risk Control Plane (Stage 10)**：Policy Engine (11 条规则)、Pre-trade Risk Assessment (promotion/execution/order batch)、Kill Switch。
7. **Execution Control Plane (Stage 10)**：Order Lifecycle State Machine (algo orders + legs)、Recovery Workflows (diagnose → plan → execute)、Broker Adapter。
8. **Compute Platform (Stage 10)**：Compute Job Store、Backtest Dispatcher、Worker Job Handlers。
9. **Agent Collaboration (Stage 10)**：Agent Tools Registry、Review Workflows (5 types)、Multi-Agent Review。
10. **Institutional Operations (Stage 10)**：Organization/Workspace/Team Store、Permission Policy (9 institutional actions × 5 roles)、Audit Report Store (6 report types + export lifecycle)。
11. **Open Ecosystem (Stage 11)**：Connector Registry、Data Connector + Ingestion Jobs、Broker Connector、Strategy Package Manifest + Validator。
12. **Observability & Hardening (Stage 12)**：PlatformEventBus (13 event types)、Observability Dashboard (health matrix + event stream + artifact integrity)、6 Artifact Integrity Checks、Maintenance CLI。

## 当前差距
