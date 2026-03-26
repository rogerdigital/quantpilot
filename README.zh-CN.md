# QuantPilot

[English](./README.md) | [中文](./README.zh-CN.md)

QuantPilot 是一个 AI 自动量化交易平台项目，目标定义为：

`Web2.0 平台底座 + Web4.0 智能代理能力`

当前仓库不是实盘生产系统，而是围绕这一目标持续演进的 monorepo 研发项目。当前已经形成包含前端控制台、后端网关、异步 worker、共享运行时、控制面存储和任务工作流的分层骨架。

## 项目目标

### Web2.0 平台底座

- 用户系统
- 行情数据接入
- 策略管理
- 回测系统
- 风控系统
- 执行引擎
- 仪表盘
- 日志与告警

### Web4.0 智能代理能力

- 自然语言下达目标
- AI 自动做市场分析
- AI 自动生成策略建议
- AI 自动解释回测与实盘表现
- AI 辅助风控
- AI 触发自动执行流程

## 七层目标架构

### 1. Frontend

用户操作和观察系统的统一入口，负责承载 Dashboard、策略工作台、风控面板、执行控制台、Agent 对话台和通知中心。

当前代码落点：

- `apps/web`
- `apps/web/src/pages`
- `apps/web/src/store`
- `apps/web/src/services`

### 2. Backend

平台控制中枢，负责 API、鉴权、账户、任务编排、通知、审计、监控和调度，并协调数据层、策略层、Agent 层、风控层和执行层。

当前代码落点：

- `apps/api`
- `apps/api/src/app`
- `apps/api/src/control-plane`
- `apps/api/src/domains`
- `apps/api/src/modules`
- `packages/control-plane-runtime`

### 3. Data Layer

负责市场数据、用户数据、交易数据、研究数据、系统事件数据的统一管理，为策略、风控、执行和 Agent 提供稳定状态基础。

当前代码落点：

- `packages/db`
- `packages/control-plane-store`
- `apps/web/src/data`

### 4. Strategy Layer

负责策略注册、信号生成、历史回测、参数优化和绩效评估，输出候选交易信号和研究结果。

当前代码落点：

- `packages/trading-engine/src/strategy`
- `apps/api/src/domains/strategy`
- `apps/api/src/domains/backtest`
- `apps/api/src/modules/strategy`
- `apps/api/src/modules/backtest`

### 5. Agent Layer

负责理解用户目标、组织分析、调用工具、解释结果，并在审批和风控边界内发起受控动作请求。

当前代码落点：

- `apps/web/src/pages/agent`
- `apps/web/src/services/agentTools.ts`
- `apps/api/src/domains/agent`
- `apps/api/src/modules/agent`

### 6. Risk Layer

负责仓位限制、风险检查、阈值判断、熔断和审批闸门，是所有执行动作前的最终裁决层。

当前代码落点：

- `packages/trading-engine/src/risk`
- `apps/api/src/domains/risk`
- `apps/api/src/modules/risk`
- `apps/worker/src/tasks/risk-scan-task.mjs`

### 7. Execution Layer

负责将已经通过风控和审批的结构化计划转换为真实执行动作，包括券商接入、订单管理、状态同步和异常补偿。

当前代码落点：

- `packages/trading-engine/src/execution`
- `apps/api/src/domains/execution`
- `apps/api/src/modules/execution`
- `apps/api/src/gateways/alpaca.mjs`

## 当前仓库结构

```text
quantpilot/
├── apps/
│   ├── api/
│   ├── web/
│   └── worker/
├── packages/
│   ├── control-plane-runtime/
│   ├── control-plane-store/
│   ├── db/
│   ├── shared-types/
│   ├── task-workflow-engine/
│   └── trading-engine/
├── docs/
├── scripts/
├── package.json
└── tsconfig.base.json
```

## 当前实现状态

当前项目始终处于研发阶段，当前主线是“研发迭代”。

现状可以概括为：平台骨架、最小控制面闭环和主要页面入口已经具备，但距离成熟专业的 AI 自动量化交易平台还有明显差距。后续重点是沿着架构设计文档把各层能力逐步做实、做深、做成闭环。

### 已有内容

- monorepo 基础结构已经稳定，`web / api / worker / packages/*` 已拆分。
- 前端控制台已经覆盖 `dashboard / market / strategies / backtest / risk / execution / agent / notifications / settings`。
- 后端已具备最小控制面能力，包括 `auth / audit / notification / risk / scheduler / task-orchestrator / strategy / backtest / agent` 等模块骨架。
- `monitoring` 模块已进入原型阶段，后端现可输出 `broker / market / worker / workflow / risk / queues` 的运行态摘要接口。
- worker 现会周期性落库 `monitoring snapshots / alerts` 历史，通知中心和后续运维视图已具备可追踪的监控数据来源。
- 通知中心已从单纯观察面板推进到可追踪的 `incident / investigation` 控制台，支持把监控告警、控制面通知、审计、风控、工作流和执行计划升级为 incident，并联动证据时间线、处置活动流、对象检查器和响应检查单。
- incident 队列已具备 `summary / owner load / source mix / aging / bulk actions`，支持按负责人和未指派视角管理事件队列，并批量指派负责人、推进状态、追加处置备注。
- incident 控制台已进一步补齐运营态能力：summary 现在会输出 `ack overdue / blocked tasks / owner hotspots / next actions`，详情页会展示 `response posture / handoff / next step`，并支持批量归我、备注并收尾等更完整的处置动作。
- 通知中心中的 control-plane feed 已开始统一成 `boards + context + feed detail` 模式：monitoring、notifications、audit、operator actions 和 scheduler 都会先给出板块摘要和当前筛选上下文，再下钻到各自列表。
- 平台现已提供统一的 `operations workbench` 聚合快照：后端会把 monitoring、incident、scheduler、connectivity 和 control-plane trail 汇总成一份运维摘要，通知中心据此展示 runbook、运维泳道和最近运维信号。
- Risk Console 已切到统一 `risk workbench` 聚合快照：后端现会把风险事件、执行复核、研究复核、风险 incident 和 broker live 暴露汇总成一份风险工作台摘要，风险页不再只依赖前端 runtime 拼装态。
- worker 已接管通知分发、风险扫描、调度 tick、workflow maintenance 和 workflow execution。
- 共享运行时已经拆分到 `trading-engine / control-plane-runtime / task-workflow-engine / shared-types`。
- 控制面持久化已抽到 `control-plane-store`，当前以文件型存储为主。
- 最小工作流链路已经打通：`API 入队 -> worker 执行 -> control-plane 持久化 -> risk 审核 -> execution plan 准备 / notification fanout`。
- `strategy catalog` 已具备结构化注册表读写边界，并可按单条策略查看最近研究运行上下文。
- `backtest runs` 已具备列表、入队、人工复核与单条详情读取能力，可关联 workflow 与策略目录追踪研究链路。
- `research task backbone` 已开始落地：回测入队、worker 执行和人工复核现在会同步为统一的 `research tasks` 对象，研究中心可直接查看任务骨架、任务分布和策略维度的活跃压力。
- `backtest result model` 已开始独立成型：回测完成和人工复核都会写入正式的 `backtest results` 版本对象，研究中心详情页不再只从 audit metadata 回放结果轨迹。
- `research workspace integration` 已进入闭环阶段：策略页开始统一消费 `latest result / recent results / promotion readiness / execution candidate preview`，研究路径已可从 `strategy -> result -> execution prep` 串联查看。
- `evaluation and promotion flow` 已开始正式成型：回测页现在会把 reviewed result 落成 `research evaluations`，策略晋级则改为受最新评估结论约束，研究链路已形成 `review -> evaluation -> promote -> execution prep` 的显式闭环。
- `research report workflow` 已接入统一异步执行模型：研究评估完成后会自动排队 `research-report` workflow，由 worker 异步生成正式 `research reports` 资产，并把报告、通知、审计和研究任务同步到统一控制面。
- `research workbench` 已开始形成：后端会把结果、评估、报告和晋级治理统一聚合成 `research workbench` 快照，策略页和回测页现可直接查看晋级队列、横向结果对比和研究资产覆盖缺口。
- `research governance actions` 已接入研究工作台：策略页现在可以直接批量推进策略晋级、补跑回测和补做评估，所有治理动作都会沉淀到统一的 operator action / audit / notification 历史中。
- `research baselines and champions` 已开始进入正式治理：研究工作台现支持把单条策略设为 `baseline / champion`，并将这些正式标签带入横向结果对比、资产覆盖缺口和治理动作摘要中。
- `research comparison and baseline analysis` 已开始形成：研究工作台现会把 baseline / champion 变成正式对比锚点，产出相对基线/冠军的收益与 Sharpe 差值、对比带分类和治理洞察，帮助识别谁在挑战冠军、谁已落后于基线。
- `research timeline and replay` 已开始形成：策略详情现会聚合 `audit / task / workflow / run / result / evaluation / report / governance` 为统一回放时间线和摘要，研究链路已经可以按单条策略回看从注册、研究、评估到治理推进的完整轨迹。
- `execution plans / runtime events / account snapshots / execution ledger` 已具备独立查询接口，执行面不再只存在于页面本地状态。
- `execution lifecycle backbone` 已开始落地：执行层现在会把 `execution candidate handoff -> execution workflow -> execution plan -> execution run -> order lifecycle` 串成统一对象流，支持 `awaiting approval / submitted / partial fill / filled / blocked / failed` 等生命周期状态，以及审批、成交结算和 execution workbench 聚合摘要。
- `execution order state machine` 已开始形成：执行层现支持 `broker acknowledged / partial fill / cancel` 等更细的 lifecycle 推进，执行台可以直接触发 broker sync、部分成交模拟和取消动作，plan / run / order state / runtime snapshot 会自动聚合成一致状态。
- `execution reconciliation` 已开始形成：后端现会把 execution order states、broker snapshots 和持仓数量做结构化对账，输出 `aligned / attention / drift / missing snapshot` 摘要；执行台也能直接查看对账问题并把当前结果落到 audit / operator action 留痕。
- `execution recovery workbench` 已开始形成：执行层现会根据 workflow retry/failed、plan cancelled/failed 和 reconciliation drift 自动产出 `recovery posture`，并支持从执行台直接执行 `resume workflow / reroute orders / reconcile` 等恢复动作，把异常补偿和人工恢复真正接入执行闭环。
- `broker event ingestion` 已开始形成：执行层现会把 broker `acknowledged / partial fill / filled / rejected / cancelled` 回报落成结构化 `broker execution events`，并用这些事件驱动 order state、runtime 摘要与执行台时间线，执行闭环已开始从“平台主动推进状态”转向“接住 broker 回报再聚合状态”。
- `execution exception and retry policies` 已开始形成：执行层现会把 broker event 历史进一步压成重试预算、补偿姿态和 incident 联动，重复 reject 或 reconciliation drift 不再只停留在事件层，而会升级成明确的执行异常处置路径。
- `execution operations console` 已开始形成：执行台现会把审批、重试、补偿、incident 和活跃路由压成统一处置队列，并补上 owner 负载视图，执行侧已经开始从“逐条查看计划”转向“按运营队列处理异常和积压”。
- `execution account reconciliation` 已开始做深：对账层现在除了 orders / fills / positions，还会比较 cash、buying power、equity、deployed capital、residual capital 和 snapshot cadence，执行台也会直接展示这些账户级信号。
- `execution compensation automation` 已开始形成：执行层现在会把 compensation posture 进一步拆成自动对账刷新、incident 同步和 operator follow-up 三层步骤，并在执行台暴露正式的自动补偿动作。
- `execution bulk queue actions` 已开始形成：执行台现在可以直接从 approval、retry、compensation 和 incident 队列选取执行计划，并批量执行 `approve / reconcile / compensate / recover` 等动作。
- `execution incident triage` 已开始形成：执行台现在支持用 queue focus 快速聚焦不同执行积压，并可直接认领、推进、关闭和记录关联 incident，不需要离开执行工作流。
- `risk governance workbench` 已开始形成：风险页现在会把组合集中度、drawdown/compliance alerts、scheduler attention 和 operator runbook 收到统一的风险中台快照里。
- `scheduler operations workbench` 已开始形成：调度侧现在会把当前窗口姿态、cycle drift、scheduler incidents、通知压力、风险联动和 operator runbook 聚成统一的 scheduler 中台工作台。
- `risk scheduler linkage` 已开始形成：risk 与 scheduler 两边现在共享同一份 linkage 快照，可以围绕同一条 scheduler window、risk event、incident、cycle drift 和通知上下文做联动排查，不再是两块彼此分离的面板。
- `scheduler orchestration actions` 已开始形成：scheduler runbook 现在不只是给出建议，还能通过统一动作 API 真实写入 operator actions、scheduler ticks、cycle 记录和 scheduler incident triage，通知中心也已经接上这条编排路径。
- `risk middleware policy actions` 已开始形成：Risk Runbook 现在不只是给出聚焦建议，还能在风险页直接执行 policy action，把 operator history、risk-policy event、控制面通知和关联 risk incident triage 一起写入同一条中台处置链路。
- Overview 首页已开始消费后端 `monitoring status` 摘要，可直接观察 `broker / market / worker / workflow / queues` 运行态。
- `user-account` 已开始承载真实的 `profile / preferences / access / broker bindings` 持久化模型，不再只依赖前端静态配置。
- 账户写操作和券商绑定变更已经进入 audit records，基础对象变更具备最小留痕能力。
- `auth/session` 已改为由持久化账户访问策略驱动，前后端对 `strategy:write / risk:review / execution:approve / account:write` 的权限判断已经开始收敛。
- 账户域已进一步收敛为统一 `account workspace` 快照：设置页现在消费同一份 `profile / preferences / access / broker summary / role templates / session` 结构化数据，并在保存账户、权限或默认券商绑定后自动刷新当前会话。
- `broker bindings` 已补齐健康状态与待处理摘要，能区分 `healthy / degraded / attention / idle`，并汇总默认绑定、连接数、待处理绑定和最近同步时间。
- 权限护栏已开始统一：后端 `403` 现会返回结构化权限说明与帮助信息，前端关键页面改为复用同一套 permission copy，设置、策略、回测、执行、风控和研究面板的缺权限提示与只读反馈已开始收口。
- Settings、Risk、Execution、Agent 等前端页面已经接入权限禁用、页面级拦截反馈和结构化 API 错误解释。
- Agent 完整分析会话现在已经可以正式提交受控 action request，并把审批结果、operator history 和 session timeline 串成一条可回放的受控交接链路。

### 当前边界

- 当前仍不适合直接用于无人值守实盘。
- 用户系统和权限边界已经开始从 demo 常量迁到持久化账户配置，但租户、多用户隔离和完整 RBAC 仍未真正落地。
- 行情接入、历史数据、研究结果持久化仍处于简化阶段。
- Agent 仍处于受控协作原型阶段，当前以 allowlist 只读工具、动作请求和审批流为主，尚未形成真正的规划、记忆和工具编排系统。
- 阶段 4 已收官：风险与调度现在已经具备稳定的中台契约，包括 workbench 快照、linkage 上下文、经过审核的操作动作以及带 incident 语义的控制面 fanout。

## 研发迭代原则

- 在既有分层边界内扩充能力，避免重新回到单体堆叠。
- 共享领域逻辑优先沉淀到 `packages/*`，避免前后端重复实现。
- Agent 不直接绕过风控和执行边界。
- 风控必须是执行动作前的最终闸门。
- 所有关键状态变更都应具备审计、通知和可恢复能力。
- 前端逐步退回为状态消费与操作入口，复杂编排迁往后端和 worker。

## 研发迭代阶段

### 基础阶段：架构骨架就位

- monorepo、七层目标架构和主要目录边界已经明确。
- 最小控制面闭环已经跑通：`API 入队 -> worker 执行 -> store 持久化 -> risk / execution / notification fanout`。
- 前端主工作台、后端模块骨架、共享 runtime 和控制面存储都已具备继续迭代的基础。

### 阶段 1：平台底座产品化（已收官）

这一阶段已经完成，阶段目标是把“可演示原型”推进成“可持续研发的平台底座”。

- 阶段 1 的收官定义、非目标和阶段 2 入口条件已单独整理到 [docs/architecture/stage-1-closeout.md](./docs/architecture/stage-1-closeout.md)。
- 阶段 2 的收官定义、非目标和阶段 3 入口条件已单独整理到 [docs/architecture/stage-2-closeout.md](./docs/architecture/stage-2-closeout.md)。

- 阶段 1 现已完成账户与权限底座、incident / investigation 控制台、operations workbench、risk workbench 和研究/执行基础数据边界的第一轮产品化。
- 阶段 2 现已收官：已完成 `Research Task Backbone`、`Backtest Result Model`、`Research Workspace Integration`、`Evaluation And Promotion Flow`、`Research Report Workflow`、`Research Workbench`、`Research Governance Actions`、`Research Baselines And Champions`、`Research Comparison And Baseline Analysis`、`Research Timeline And Replay` 和 `Execution Candidate Handoff` 十一个大步，研究链路已形成 `task -> workflow -> result -> evaluation -> report -> compare -> replay -> govern -> handoff -> act -> promote` 的统一异步骨架。

### 阶段 2：研究与策略闭环

- 落地 `strategy registry / strategy runner / backtest engine / performance evaluator` 的真实任务链路。
- 让回测、参数优化、研究报告进入 `task-orchestrator + worker` 的统一异步执行模型。
- 建立研究结果持久化、版本化和可回溯查询能力。
- 让策略层稳定输出信号、目标仓位、调仓建议和评分，而不是停留在静态快照。

### 阶段 3：执行闭环与交易中台（已收官）

- 阶段 3 的收官定义、非目标和阶段 4 入口条件已单独整理到 [docs/architecture/stage-3-closeout.md](./docs/architecture/stage-3-closeout.md)。
- 阶段 3 已完成 `Execution Lifecycle Backbone`、`Execution Order State Machine`、`Execution Reconciliation Workbench`、`Execution Recovery Workbench`、`Broker Event Ingestion`、`Execution Exception And Retry Policies`、`Execution Operations Console`、`Execution Account Reconciliation`、`Execution Compensation Automation`、`Execution Bulk Queue Actions` 和 `Execution Incident Triage`。
- 执行链路现已形成 `handoff -> workflow -> plan -> run -> order state -> broker event -> reconcile -> compensate -> recover -> incident -> operate` 的统一闭环。

### 阶段 4：风险与调度中台深化（已收官）

- 阶段 4 的收官定义、非目标和阶段 5 入口条件已单独整理到 [docs/architecture/stage-4-closeout.md](./docs/architecture/stage-4-closeout.md)。
- 阶段 4 已完成 `Risk Governance Workbench`、`Scheduler Operations Workbench`、`Risk Scheduler Linkage`、`Scheduler Orchestration Actions` 和 `Risk Middleware Policy Actions`。
- 风险与调度中台现已形成 `risk/scheduler snapshot -> linkage -> runbook -> reviewed action -> operator history / notification / incident triage` 的统一链路。

### 阶段 5：Agent 受控协作落地（已收官）

- 阶段 5 的收官定义、非目标和阶段 6 入口条件已单独整理到 [docs/architecture/stage-5-closeout.md](./docs/architecture/stage-5-closeout.md)。
- 阶段 5 已完成 `Agent Contracts`、`Intent Parsing And Planning`、`Analysis Runs`、`Agent Workbench` 和 `Controlled Action Handoffs`。
- Agent 协作链路现已形成 `prompt -> intent -> plan -> analysis -> explanation -> action request -> approval -> downstream workflow` 的统一闭环。

### 阶段 6：生产化与专业化

- 完成数据库、缓存、对象存储、日志监控、告警通道和部署体系升级。
- 补齐租户、权限、订阅、可观测性、备份恢复和运维工具链。
- 建立实盘运行所需的稳定性指标、回放能力、故障演练和发布流程。
- 将平台从“研发可用”推进到“专业可运营”。

## 目录说明

### `apps/web`

前端控制台，负责页面路由、控制台布局、用户交互和状态消费。

### `apps/api`

后端入口和服务聚合层，当前内部已经开始按 `app / control-plane / domains / modules` 四类目录组织：

- `app`: 路由与请求入口
- `control-plane`: 编排与控制面工作流
- `domains`: 研究、Agent、风险、执行等领域实现
- `modules`: 兼容导出与稳定边界

### `apps/worker`

异步 worker 进程，负责执行后台任务、分发 outbox、推进工作流和处理维护任务。

### `packages/trading-engine`

共享交易运行时，承载市场推进、策略输出、风控裁决、执行意图和控制面状态合并逻辑。

### `packages/task-workflow-engine`

共享工作流执行层，封装 workflow executor registry 与执行路径。

### `packages/control-plane-runtime`

API 与 worker 共用的控制面运行时装配层，负责 workflow 生命周期及 fanout。

### `packages/control-plane-store`

控制面存储层，负责 notification、risk、scheduler、audit、workflow runs、operator actions 等记录的持久化。

### `packages/db`

底层存储抽象层，当前提供文件型 adapter 和基础 store 抽象，为后续切换数据库保留边界。

### `packages/shared-types`

前后端共享类型定义。

## 开发命令

```bash
npm install
npm run dev
npm run gateway
npm run worker
npm run typecheck
npm run test:control-plane
npm run test:runtime
npm run test:engine
npm run test:api
npm run test:worker
npm run verify
```

安装依赖后会自动把仓库的 git hooks 指到 `.githooks`。当前默认启用了 `pre-push` 校验，会在推送前执行一次 `npm run verify`，避免仅在 CI 才暴露 `typecheck` 或生产构建错误。

默认端口：

- Web: `http://127.0.0.1:8080`
- API: `http://127.0.0.1:8787`

## 测试与校验

`npm run verify` 会执行以下检查：

1. workspace 完整性检查
2. lockfile 同步检查
3. control-plane tests
4. runtime tests
5. task-workflow-engine tests
6. api tests
7. worker tests
8. web typecheck
9. web build

## 关键入口

- `apps/web/src/app/App.tsx`
- `apps/web/src/pages/console/DashboardConsole.tsx`
- `apps/web/src/store/trading-system/TradingSystemProvider.tsx`
- `apps/api/src/main.mjs`
- `apps/api/src/app/index.mjs`
- `apps/worker/src/main.mjs`
- `packages/trading-engine/src/runtime.mjs`
- `packages/control-plane-runtime/src/index.mjs`
- `packages/control-plane-store/src/index.mjs`
- `packages/task-workflow-engine/src/index.mjs`

## 安全边界

- 浏览器端不应持有真实 broker 密钥。
- 远程下单必须通过服务端网关。
- Agent 不应直接发起真实下单。
- 风控和审批不应被前端、Agent 或执行层绕过。

## 当前研发重点

当前已完成“阶段 1 / 阶段 2 / 阶段 3 / 阶段 4 / 阶段 5”，并开始转向“阶段 6：生产化与专业化”，优先级如下：

1. 在已经稳定的 research、execution、risk、scheduler、incident 和 agent collaboration 契约之上，推进数据库、权限、缓存和可观测性能力。
2. 保持所有 Agent 请求继续落在既有的 audit、risk、approval、execution 和 control-plane 边界内，不为生产化建设引入绕过式通道。
3. 在生产化推进过程中，持续守住阶段 1 到阶段 5 的账户、incident、research hub、execution workbench、risk middleware、scheduler workbench、linkage 和 agent collaboration 契约稳定性。
4. 在更高自主性能力进入规划之前，先把现有受控 handoff、审批和下游 workflow 链路做稳。

研发节奏保持为“设计对齐 -> 小步实现 -> 自动化验证 -> 再推进下一层能力”。
