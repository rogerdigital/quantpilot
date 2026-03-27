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
│       │   ├── services/
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
- `apps/web/src/services/`
  - 运行配置、provider 接入和控制面通信层，包括 market data、broker 与 control-plane service。
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
  - 底层存储接口层，当前提供 `collection store`、`kv store` 以及 `file / db` 两类 control-plane adapter foundation；`control-plane-store` 已可在保持 file 默认实现的前提下切换到 db adapter 骨架，为后续数据库迁移打底。
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

### 当前阶段：阶段 1 到阶段 6 已收官

当前仓库已经完成阶段 1 的平台底座产品化、阶段 2 的研究与策略闭环、阶段 3 的执行闭环与交易中台、阶段 4 的风险与调度中台深化、阶段 5 的 Agent 受控协作落地，以及阶段 6 的生产化与专业化基线：

1. `auth / user-account / scheduler / notification / audit / task-orchestrator / incident / operations / risk workbench` 这批基础模块已具备稳定服务边界。
2. `research task / backtest result / research evaluation / research report / governance / replay / execution handoff` 这批研究对象已具备稳定服务边界。
3. `execution lifecycle / broker events / reconciliation / compensation / triage` 与 `risk / scheduler linkage / reviewed actions` 已形成稳定中台契约。
4. 下一阶段重点将转向数据库、权限、可观测性和可运营性，而不是继续返工平台底座、研究骨架、执行主链路、风险/调度中台或 Agent 最小闭环。

阶段 1 的收官标准已经单独整理为 [stage-1-closeout.md](./stage-1-closeout.md)，后续判断是否进入阶段 2 以该文档为准。
阶段 2 的收官标准已经单独整理为 [stage-2-closeout.md](./stage-2-closeout.md)，后续判断是否进入阶段 3 以该文档为准。
阶段 3 的收官标准已经单独整理为 [stage-3-closeout.md](./stage-3-closeout.md)，后续判断是否进入阶段 4 以该文档为准。
阶段 4 的收官标准已经单独整理为 [stage-4-closeout.md](./stage-4-closeout.md)，后续判断是否进入阶段 5 以该文档为准。
阶段 5 的收官标准已经单独整理为 [stage-5-closeout.md](./stage-5-closeout.md)，后续判断是否进入阶段 6 以该文档为准。
阶段 6 的收官标准已经单独整理为 [stage-6-closeout.md](./stage-6-closeout.md)，后续判断是否继续进入更高阶平台化扩展以前者为准。

### 阶段 2 研究与策略闭环

1. 把 `strategy / backtest` 从静态 research snapshot 升级为真实任务执行与结果持久化模块。
2. 沉淀统一的策略注册、回测运行、绩效评估、参数优化和研究报告模型。
3. 让策略输出稳定进入风控和执行前的候选决策接口。

### 阶段 3 执行闭环与交易中台

1. 把 `execution` 从计划骨架升级为真实订单状态机、持仓同步和失败补偿体系。
2. 扩展 broker 适配边界，形成多券商接入和环境切换能力。
3. 让审计、通知、风险、执行状态在控制面内形成完整闭环。

### 阶段 4 风控与调度中台深化（已收官）

1. 风险页已形成 `Risk Governance Workbench` 与 `Risk Middleware Policy Actions`，可围绕 drawdown、compliance、scheduler attention 和 incident 做统一治理。
2. 调度侧已形成 `Scheduler Operations Workbench` 与 `Scheduler Orchestration Actions`，可围绕 scheduler windows、cycle drift、notifications 和 incidents 做统一编排。
3. Risk 与 scheduler 现已共享 linkage 中台上下文，可围绕同一条 scheduler window、risk event、incident 和 notification 做统一排查与处置。

### 阶段 5 Agent 受控协作（已收官）

1. Agent 现已稳定落在 `session / intent / plan / analysis run / action request` 正式合同内。
2. Agent workbench 已具备 `prompt studio / recent sessions / explanation detail / pending requests / operator timeline / runbook` 协作界面。
3. 完成的 analysis session 现已可通过 `controlled handoff` 正式提交 action request，并继续走 risk、approval 和 downstream workflow contracts。
4. Agent 的建议、请求、审批和留痕已稳定沉淀到 audit、notification、operator action 和 session timeline。

### 阶段 6 生产化与专业化（已收官）

1. control-plane storage 已具备 `file / db` adapter foundation，后续数据库化迁移可以在既有仓储合同内推进。
2. 账户域已正式持久化 role template 与 access policy，权限不再只由 demo 常量驱动，而是支持默认权限、额外授予和显式移除。
3. 账户域已补上 tenant / workspace foundation：session、account workspace、workspace memberships 与 current workspace 切换都已形成正式合同。
4. 新的 control-plane 写入会自动附带当前 tenant / workspace scope metadata，为后续真正的多工作区过滤和隔离做准备。
5. monitoring 与 operations workbench 已补齐 worker freshness、workflow retry posture、queue backlog posture 和 observability summary，为值守与运维界面提供统一运行姿态。
6. control-plane maintenance 已具备 backup export、restore dry run、integrity check 和 workflow retry repair，并提供 API 与 CLI 双入口。
7. `docs/deployment.md` 与 `check:runtime-env` 已把环境变量、adapter 选择、启动顺序、backup/restore 和 readiness checklist 收敛为统一运行基线。
8. 阶段 6 baseline tests 与 closeout 文档已把 production readiness contracts 正式纳入验收基线。

## 当前阶段的具体建议

1. 以阶段 1 到阶段 5 已稳定的 contracts 为前提，开始推进数据库、权限、缓存、可观测性和运维能力，不返工 Agent 的最小协作闭环。
2. 继续让 Agent 消费现有 `research / execution / risk / scheduler / incidents / notifications` 的稳定 workbench 和 detail 数据，不新增绕过中台的平行链路。
3. 把更高自主性能力留到后续阶段，在此之前继续守住 `risk / approval / execution` guardrails。
4. 在阶段 6 推进过程中，持续用基线测试守住阶段 1 到阶段 5 已关闭阶段的合同稳定性。
