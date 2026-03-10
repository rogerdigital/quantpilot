# QuantPilot

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
- worker 已接管通知分发、风险扫描、调度 tick、workflow maintenance 和 workflow execution。
- 共享运行时已经拆分到 `trading-engine / control-plane-runtime / task-workflow-engine / shared-types`。
- 控制面持久化已抽到 `control-plane-store`，当前以文件型存储为主。
- 最小工作流链路已经打通：`API 入队 -> worker 执行 -> control-plane 持久化 -> risk 审核 -> execution plan 准备 / notification fanout`。
- `user-account` 已开始承载真实的 `profile / preferences / access / broker bindings` 持久化模型，不再只依赖前端静态配置。
- 账户写操作和券商绑定变更已经进入 audit records，基础对象变更具备最小留痕能力。
- `auth/session` 已改为由持久化账户访问策略驱动，前后端对 `strategy:write / risk:review / execution:approve / account:write` 的权限判断已经开始收敛。
- Settings、Risk、Execution、Agent 等前端页面已经接入权限禁用、页面级拦截反馈和结构化 API 错误解释。

### 当前边界

- 当前仍不适合直接用于无人值守实盘。
- 用户系统和权限边界已经开始从 demo 常量迁到持久化账户配置，但租户、多用户隔离和完整 RBAC 仍未真正落地。
- 行情接入、历史数据、研究结果持久化仍处于简化阶段。
- Agent 仍处于受控协作原型阶段，尚未形成真正的规划、记忆和工具编排系统。
- 执行引擎仍是骨架，距离真实订单状态机、补偿重试和多 broker 抽象还有较大差距。

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

### 阶段 1：平台底座产品化

这是当前所在阶段，目标是把“可演示原型”推进成“可持续研发的平台底座”。

- 落地真实的 `auth / user-account / account settings / broker binding` 基础模块。
- 把文件型原型存储进一步收敛为可迁移的数据访问边界，为 `PostgreSQL + Redis` 形态做准备。
- 将市场数据、策略配置、研究结果、执行记录从页面静态/示例数据升级为服务端结构化读写。
- 继续压缩前端中的编排逻辑，让页面只做展示、触发和消费。

### 阶段 2：研究与策略闭环

- 落地 `strategy registry / strategy runner / backtest engine / performance evaluator` 的真实任务链路。
- 让回测、参数优化、研究报告进入 `task-orchestrator + worker` 的统一异步执行模型。
- 建立研究结果持久化、版本化和可回溯查询能力。
- 让策略层稳定输出信号、目标仓位、调仓建议和评分，而不是停留在静态快照。

### 阶段 3：执行闭环与交易中台

- 将执行层升级为真实的 `broker connector / order manager / execution engine / fill handler / failure handler`。
- 补齐订单状态机、持仓同步、账户权益同步和异常补偿重试。
- 建立 execution plan 到真实订单、成交、持仓、账户状态的完整映射。
- 让“通过风控的计划”真正进入可追踪、可恢复、可审计的执行流程。

### 阶段 4：风险与调度中台深化

- 将风控从基础扫描升级为 `position / portfolio / drawdown / volatility / compliance / emergency brake` 六类能力。
- 将 scheduler 从节拍记录升级为盘前、盘中、盘后和定时任务编排中心。
- 建立风险阻断、人工审批、熔断、恢复和通知联动闭环。
- 让控制面具备更完整的恢复、取消、重试、补偿和人工介入能力。

### 阶段 5：Agent 受控协作落地

- 按架构文档落地 `intent parser / planner / tool router / analysis engine / explanation engine / approval controller`。
- 先建设只读分析、解释和建议能力，再开放受控动作请求。
- 所有 Agent 动作都必须走审计、风控、审批和执行 guardrail。
- 让 Agent 成为高层任务协作者，而不是绕过平台规则的捷径。

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

当前以“阶段 1：平台底座产品化”为主，优先级如下：

1. 完成用户、账户、鉴权和券商绑定等平台基础对象的真实数据模型。
2. 将前后端权限判断、错误反馈和页面禁用逻辑继续收敛到统一的 account/access 模型。
3. 将市场数据、研究数据、执行数据从原型读写升级为稳定 API 与持久化存储。
4. 继续把研究、风控、执行相关异步动作收敛到后端任务流与 worker。
5. 为阶段 2 的策略研究闭环预留统一任务协议、结果模型和审计链路。

研发节奏保持为“设计对齐 -> 小步实现 -> 自动化验证 -> 再推进下一层能力”。
