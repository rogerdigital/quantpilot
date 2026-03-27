# QuantPilot

[English](./README.md) | [中文](./README.zh-CN.md)

QuantPilot 是一个以 AI 为核心能力的量化交易平台，采用 TypeScript monorepo 形式构建。它由 Web 操作控制台、API 网关、后台 worker、共享控制面运行时，以及围绕研究、执行、风控、调度、事件响应和受控 Agent 协作的工作流编排组成。

QuantPilot 不是一个可直接用于实盘的生产交易系统。它当前定位为一套面向受控量化交易流程的平台骨架与运营界面，而不是无人值守自动交易机器人。

## QuantPilot 包含什么

- 一个覆盖 dashboard、market、strategy、backtest、risk、execution、agent、notifications 和 settings 的多工作台前端控制台
- 一套覆盖 account、auth、research、execution、risk、scheduler、incident、operations 与 agent 合同的 API 网关
- 负责通知分发、风险扫描、调度 tick、workflow maintenance、monitoring scan 与排队工作流执行的后台 worker
- 用于交易逻辑、控制面 fanout、工作流执行和前后端共享类型的公共运行时包
- 具备 `file` 与 `db` adapter foundation、维护工具、schema manifest 和 migration contract 的控制面持久化层
- 用于保护平台、研究、执行、风险、调度、Agent 与生产化基线合同的自动化验证体系

## 平台范围

QuantPilot 当前围绕四条平台级运行主链路组织能力：

- 研究链路：strategy catalog、backtest runs、evaluation、report、governance 和 execution handoff
- 执行链路：execution plan、broker event ingestion、reconciliation、compensation、recovery 和 incident linkage
- 中间件链路：risk workbench、scheduler workbench、linkage context、reviewed action 和 control-plane fanout
- Agent 链路：prompt、intent、plan、read-only analysis、explanation、controlled handoff、approval 和 downstream workflow routing

此外，平台还包括 account scope、workspace-aware permissions、monitoring、incident response、maintenance tooling 以及面向部署的验证与运行约束。

## 目标架构

### 1. Frontend

面向操作人员的统一控制台，用于承载工作流、复核队列、工作台与配置界面。

主要代码位置：

- `apps/web`
- `apps/web/src/app`
- `apps/web/src/pages`
- `apps/web/src/modules`
- `apps/web/src/store`

### 2. Backend

负责平台 API 合同、鉴权、工作流路由、领域服务和控制面装配的后端层。

主要代码位置：

- `apps/api`
- `apps/api/src/app`
- `apps/api/src/domains`
- `apps/api/src/modules`
- `packages/control-plane-runtime`

### 3. Data Layer

负责持久化、仓储合同、adapter 抽象和底层存储能力。

主要代码位置：

- `packages/control-plane-store`
- `packages/db`
- `packages/shared-types`

### 4. Strategy Layer

负责策略注册、回测、评估、比较与治理。

主要代码位置：

- `packages/trading-engine/src/strategy`
- `apps/api/src/domains/strategy`
- `apps/api/src/domains/backtest`
- `apps/api/src/modules/strategy`
- `apps/api/src/modules/backtest`

### 5. Agent Layer

负责 session、intent、planning、analysis、explanation 和 action handoff 等受控协作链路。

主要代码位置：

- `apps/web/src/modules/agent`
- `apps/api/src/domains/agent`
- `apps/api/src/modules/agent`

### 6. Risk Layer

负责风险复核、审批边界、policy action 以及共享 risk/scheduler 中间件上下文。

主要代码位置：

- `packages/trading-engine/src/risk`
- `apps/api/src/domains/risk`
- `apps/api/src/modules/risk`
- `apps/worker/src/tasks/risk-scan-task.mjs`

### 7. Execution Layer

负责执行准备、券商集成、生命周期推进、对账、恢复与补偿。

主要代码位置：

- `packages/trading-engine/src/execution`
- `apps/api/src/domains/execution`
- `apps/api/src/modules/execution`
- `apps/api/src/gateways/alpaca.mjs`

## 仓库结构

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

## 核心能力

### 研究与策略

- 带研究上下文的 strategy catalog
- backtest run、result version、evaluation 和 report
- governance action、baseline、champion、comparison 和 replay
- 从 research 到 execution preparation 的结构化 handoff

### 执行

- execution plan、runtime event、broker event ingestion 和 account snapshot
- 覆盖 approval、submission、reconciliation、recovery 和 compensation 的生命周期推进
- 带 incident linkage 的队列化 execution operations console

### 风控与调度

- 统一的 risk workbench 与 scheduler workbench 快照
- 共享的 risk/scheduler linkage context
- 会写入 audit、notification 和 incident-aware control-plane state 的 reviewed middleware action

### Agent 协作

- 持久化的 `session / intent / plan / analysis run / action request` 合同
- 由后端聚合驱动的 Agent workbench
- 保持在审批与风控边界内的 controlled action handoff

### 运维与控制面

- monitoring snapshot、alert、incident、audit trail、operator action 和 workflow history
- workspace-aware 的 account scope 与 access policy 解析
- backup、restore dry-run、integrity check、repair tooling 和 persistence posture 可视化

## 快速开始

### 环境要求

- Node.js 20+
- npm 10+

### 安装依赖

```bash
npm install
```

### 启动主要进程

```bash
npm run dev
npm run gateway
npm run worker
```

默认本地端口：

- Web: `http://127.0.0.1:8080`
- API: `http://127.0.0.1:8787`

### 校验运行环境合同

在启动真实 gateway 配置前，建议先校验运行环境：

```bash
npm run check:runtime-env -- --env-file .env
```

这一步会校验支持的 storage adapter、provider 组合以及关键环境变量。模板文件位于 `.env.example`。

## 开发命令

```bash
npm run check:runtime-env
npm run test:control-plane
npm run test:runtime
npm run test:engine
npm run test:api
npm run test:worker
npm run test:web
npm run typecheck
npm run build
npm run verify
```

安装依赖后，仓库会自动把 git hooks 指向 `.githooks`。默认的 `pre-push` hook 会在推送前执行 `npm run verify`。

## 测试与校验

`npm run verify` 会执行以下检查：

1. Workspace 完整性检查
2. Lockfile 同步检查
3. 文档一致性检查
4. Runtime 环境检查
5. Control-plane tests
6. Runtime tests
7. Workflow-engine tests
8. API tests
9. Worker tests
10. Web tests
11. Web typecheck
12. Production web build

## 运维与部署

主要运维与部署文档：

- [部署指南](./docs/deployment.md)
- [Control-Plane Migration Runbook](./docs/control-plane-migrations.md)
- [项目结构说明](./docs/architecture/project-structure.md)

当前持久化与维护工具支持：

- Backup export
- Restore dry run
- Integrity check
- Workflow retry repair
- Persistence status 与 migration posture 检查

## 架构历史

阶段化交付路线已经收官。以下阶段文档现在主要作为架构历史和合同基线参考：

- [Stage 1 Closeout](./docs/architecture/stage-1-closeout.md)
- [Stage 2 Closeout](./docs/architecture/stage-2-closeout.md)
- [Stage 3 Closeout](./docs/architecture/stage-3-closeout.md)
- [Stage 4 Closeout](./docs/architecture/stage-4-closeout.md)
- [Stage 5 Closeout](./docs/architecture/stage-5-closeout.md)
- [Stage 6 Closeout](./docs/architecture/stage-6-closeout.md)

这些文档定义了已经关闭的能力边界，以及当前仍由 `verify` 持续守护的基线预期。

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

- 浏览器端不得持有真实 broker 密钥
- 远程下单必须通过服务端网关
- Agent 不得直接发起真实下单
- 风控与审批边界不得被前端、Agent 或执行层绕过
- 当前仓库不应被视为可直接用于无人值守实盘的生产部署
