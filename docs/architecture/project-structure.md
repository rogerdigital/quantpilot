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
  - 底层存储接口层，当前提供 `collection store`、`kv store` 和 JSON file adapter，`control-plane-store` 通过这些接口组合当前文件型实现，后续可替换为真正的数据库实现。
- `packages/control-plane-store/src/`
  - 控制面文件存储层，当前已拆成 `context + repositories/* + shared + store` 结构，承载 notification outbox、risk scan outbox、已分发通知事件、风险事件流、scheduler ticks、audit records、cycle records、workflow runs 和 operator actions，为 API 与 worker 提供最小跨进程共享状态。
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

### 当前阶段：阶段 1 平台底座产品化

当前仓库当前以平台底座产品化为主：

1. 让 `auth / user-account / scheduler / notification / audit / task-orchestrator` 这些基础模块从骨架走向真实可用服务。
2. 把文件型控制面和前端示例数据逐步替换为稳定的数据访问契约，为数据库和缓存升级铺路。
3. 让前端页面完全退回到 API 消费者角色，把研究、风控、执行的编排职责继续迁往后端和 worker。

### 阶段 2 研究与策略闭环

1. 把 `strategy / backtest` 从静态 research snapshot 升级为真实任务执行与结果持久化模块。
2. 沉淀统一的策略注册、回测运行、绩效评估、参数优化和研究报告模型。
3. 让策略输出稳定进入风控和执行前的候选决策接口。

### 阶段 3 执行闭环与交易中台

1. 把 `execution` 从计划骨架升级为真实订单状态机、持仓同步和失败补偿体系。
2. 扩展 broker 适配边界，形成多券商接入和环境切换能力。
3. 让审计、通知、风险、执行状态在控制面内形成完整闭环。

### 阶段 4 风控与调度中台深化

1. 把风险事件从基础扫描扩展为组合风险、回撤保护、规则引擎和熔断控制。
2. 把 scheduler 从 tick 记录升级为盘前、盘中、盘后和定时报表的任务中枢。
3. 强化恢复、取消、重试、审批和人工接管路径。

### 阶段 5 Agent 受控协作

1. 将 Agent 接入限制在 tool layer、分析解释和受控动作请求之内。
2. 建立意图解析、任务规划、工具路由、结果解释和审批控制链路。
3. 确保 Agent 永远不绕过风险和执行边界。

### 阶段 6 生产化与专业化

1. 升级数据库、缓存、对象存储、日志监控和部署体系。
2. 补齐租户、权限、订阅、备份恢复和运维能力。
3. 以稳定性、可观测性和可运营性为目标推进实盘级平台建设。

## 当前阶段的具体建议

1. 优先补齐 `auth / user-account / broker binding` 的真实服务与数据边界，因为这是平台底座产品化的主要缺口。
2. 把文件型控制面和页面示例数据逐步收敛为稳定 repository 与 service contract，为数据库和缓存升级铺路。
3. 把 `strategy / backtest` 从静态 research snapshot 升级为真实的任务执行与结果持久化模块，为阶段 2 做准备。
4. 把 `task-orchestrator` 从当前的文件型控制面升级为真正的任务流和队列执行层。
5. 把 `core/lifecycle.ts` 里的异步编排继续迁到后端任务层，前端只保留状态消费和交互动作。
6. 在平台底座和交易闭环稳定后，再推进 Agent 的 tool layer、分析解释和受控动作请求能力。
