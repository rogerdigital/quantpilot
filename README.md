# QuantPilot

QuantPilot 是一个 AI 自动量化交易平台项目，目标定义为：

`Web2 平台底座 + Web4.0 智能代理能力`

当前仓库不是实盘生产系统，而是围绕这一目标持续演进的 monorepo 原型。它已经从单一前端应用重构为包含前端控制台、后端网关、异步 worker、共享运行时、控制面存储和任务工作流的分层骨架。

## 项目目标

### Web2 平台底座

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

- `packages/trading-engine/src/strategy.mjs`
- `apps/api/src/modules/strategy`
- `apps/api/src/modules/backtest`

### 5. Agent Layer

负责理解用户目标、组织分析、调用工具、解释结果，并在审批和风控边界内发起受控动作请求。

当前代码落点：

- `apps/web/src/pages/agent`
- `apps/web/src/services/agentTools.ts`
- `apps/api/src/modules/agent`

### 6. Risk Layer

负责仓位限制、风险检查、阈值判断、熔断和审批闸门，是所有执行动作前的最终裁决层。

当前代码落点：

- `packages/trading-engine/src/risk.mjs`
- `apps/api/src/modules/risk`
- `apps/worker/src/tasks/risk-scan-task.mjs`

### 7. Execution Layer

负责将已经通过风控和审批的结构化计划转换为真实执行动作，包括券商接入、订单管理、状态同步和异常补偿。

当前代码落点：

- `packages/trading-engine/src/execution.mjs`
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

当前项目已经具备“平台原型 + 最小控制面闭环”，但还没有达到目标架构的完整形态。

### 已有内容

- monorepo 基础结构已经稳定，`web / api / worker / packages/*` 已拆分。
- 前端控制台已经覆盖 `dashboard / market / strategies / backtest / risk / execution / agent / notifications / settings`。
- 后端已具备最小控制面能力，包括 `auth / audit / notification / risk / scheduler / task-orchestrator / strategy / backtest / agent` 等模块骨架。
- worker 已接管通知分发、风险扫描、调度 tick、workflow maintenance 和 workflow execution。
- 共享运行时已经拆分到 `trading-engine / control-plane-runtime / task-workflow-engine / shared-types`。
- 控制面持久化已抽到 `control-plane-store`，当前以文件型存储为主。
- 最小工作流链路已经打通：`API 入队 -> worker 执行 -> control-plane 持久化 -> risk 审核 -> execution plan 准备 / notification fanout`。

### 当前边界

- 仍以原型和架构重构为主，不适合直接用于无人值守实盘。
- 用户系统、权限和租户模型尚未真正落地。
- 行情接入、历史数据、研究结果持久化仍处于简化阶段。
- Agent 仍处于受控协作原型阶段，尚未形成真正的规划、记忆和工具编排系统。
- 执行引擎仍是骨架，距离真实订单状态机、补偿重试和多 broker 抽象还有较大差距。

## 重构原则

- 先稳住分层边界，再扩充能力，避免继续堆叠单点实现。
- 共享领域逻辑优先沉淀到 `packages/*`，避免前后端重复实现。
- Agent 不直接绕过风控和执行边界。
- 风控必须是执行动作前的最终闸门。
- 所有关键状态变更都应具备审计、通知和可恢复能力。
- 前端逐步退回为状态消费与操作入口，复杂编排迁往后端和 worker。

## 重构路线

### 阶段 1：文档和边界对齐

- 用 README 和架构文档统一目标架构、当前实现和推进路线。
- 收敛目录职责，明确哪些代码属于平台底座，哪些属于原型页面实现。

### 阶段 2：控制面与任务流深化

- 继续强化 `task-orchestrator`、`control-plane-runtime` 和 `worker` 协作边界。
- 把更多异步编排从前端迁到后端任务层。
- 收敛 workflow 生命周期、恢复、取消、重试和审计行为。

### 阶段 3：按层拆分业务能力

- 将策略、回测、风险、执行、数据接入逐步从应用层代码抽到共享模块。
- 补齐数据模型、服务契约和 repository 分层。
- 让页面层更多只消费结构化 API。

### 阶段 4：Agent 受控接入

- 明确 tool layer、只读摘要、动作请求、审批流和执行 guardrail。
- 让 Agent 只能提出建议或提交受控请求，不能直接触发下单。

## 目录说明

### `apps/web`

前端控制台，负责页面路由、控制台布局、用户交互和状态消费。

### `apps/api`

后端入口和服务模块聚合层，负责同步请求处理、控制面接口、研究接口和工作流启动。

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

## 当前重构方向

接下来的重构会严格围绕这份架构推进：

1. 先完善文档与模块边界表达。
2. 再按层收敛控制面、任务流和共享运行时。
3. 随后逐步推进策略、回测、风险、执行和 Agent 的真实模块化。

每一步都以“修改 -> 验证 -> 提交 -> 推送”为节奏推进。
