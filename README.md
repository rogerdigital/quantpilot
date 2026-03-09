# QuantPilot

QuantPilot 是一个面向量化交易工作流的分层平台原型，目标定义已经收敛为 `Web2 平台底座 + Web4.0 智能代理能力`。当前仓库已经从单一 Vite 应用重构为面向该目标的 monorepo 骨架。

## 当前定位

- `apps/web`: 用户控制台，承载 Dashboard、Market、Strategy、Backtest、Risk、Execution、Agent、Notifications 和 Settings。
- `apps/api`: 后端入口和网关骨架，承载 API、鉴权、任务编排、通知、审计、调度等服务边界。
- `apps/worker`: 异步 worker 骨架，预留回测、风控扫描、通知分发和执行补偿等后台任务进程。
- `packages/db`: 底层存储接口层，当前提供 `collection store / kv store` 抽象和 JSON file adapter，为后续数据库替换预留边界。
- `packages/control-plane-runtime`: API 和 worker 共用的控制面运行时装配层，当前已统一封装 notification、risk、scheduler、audit、task-orchestrator record fanout，以及 workflow run 的状态流转、重试调度、恢复和取消。
- `packages/shared-types`: 前后端共享的交易和平台类型定义。
- `packages/trading-engine`: 市场、策略、风控、执行和控制面合并所需的共享 runtime。
- `packages/control-plane-store`: 控制面文件存储层，当前已按 `context + repositories` 结构拆分，承载 notification、risk、scheduler、audit、cycle records、workflow runs、operator actions 等跨进程事件和记录。

当前版本依然以产品原型和前端工作流为主，不是可直接用于无人值守实盘的生产系统。

## 当前进度

- 里程碑 A `平台底座闭环`：已完成最小链路。现在支持 `API 请求策略执行 -> Worker 执行 workflow -> DB(JSON store) 持久化 execution plan -> Risk 审核 -> Execution plan 出队准备`。
- 里程碑 B `控制面与审计闭环`：已完成最小闭环。workflow 的 `retry_scheduled / failed / resumed / canceled / re-queued` 生命周期现在都会统一写入后端 audit 和 notification，execution workflow 失败恢复也走后端 maintenance + resume 机制。
- 里程碑 C `Agent 受控接入`：已完成最小闭环。Agent 现在通过只读 tool layer 访问系统摘要，只能提交 `agent action request`，并且这些请求必须先经过 risk gate 与 operator approval，批准后才会排 downstream workflow。
- 平台骨架：`apps/web + apps/api + apps/worker + packages/*` 的 monorepo 结构已经稳定，控制面、共享类型和运行时边界已拆开。
- 控制面：notification、risk、scheduler、audit、workflow run、operator action 已具备最小持久化和 API/worker 协作链路。
- 执行闭环：`state run -> control plane -> broker sync -> risk scan -> notification` 已有原型链路，适合继续细化为真实服务。
- 策略/回测：本轮已补上 `strategy catalog + backtest summary + backtest runs` 的后端接口和前端研究中心视图，开始从“页面占位”进入“结构化研究数据”阶段。
- Agent：当前仍以协作台和解释层原型为主，尚未进入真正的 LLM orchestration、memory 和 tool calling。

## 距离最终目标还差什么

- 里程碑 C `Agent 受控接入`：尚未开始真正实现，仍缺目标解析、tool layer、memory、审批式动作请求和 execution guardrail。
- 用户系统：缺少真实注册登录、权限模型、租户/账户绑定和用户设置持久化。
- 行情数据：缺少稳定的数据接入抽象、历史数据存储、订阅分发和多 provider 切换。
- 策略管理：缺少策略注册中心、参数版本、运行配置、晋级审批和策略生命周期管理。
- 回测系统：当前只有研究快照接口，缺少真实回测执行器、任务队列、结果持久化和参数优化。
- 风控系统：缺少组合级规则引擎、阈值配置、审批流和熔断恢复机制。
- 执行引擎：缺少 broker adapter 抽象层、订单路由、成交回报、补偿重试和真实订单状态机。
- 仪表盘与日志告警：当前以原型展示为主，缺少系统级指标、日志查询、告警通道和运维面板。
- Agent 能力：缺少自然语言目标解析、Planner、Tool Router、Prompt/Context 管理、结果解释和受控自动执行。

## 架构原则

- 策略层负责产出候选信号、目标仓位和研究结果。
- Agent 层负责理解目标、组织分析、调用工具和解释结果。
- 风控层负责做最终审核，不允许被 Agent 或执行层绕过。
- 执行层只接受结构化、已审批、可审计的动作请求。

## 目录结构

```text
quantpilot/
├── apps/
│   ├── api/
│   │   └── src/
│   ├── worker/
│   │   └── src/
│   └── web/
│       ├── public/
│       ├── src/
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── packages/
│   ├── shared-types/
│   └── trading-engine/
├── docs/
│   └── architecture/
├── package.json
└── tsconfig.base.json
```

更细的分层说明见 [docs/architecture/layered-architecture.md](docs/architecture/layered-architecture.md) 和 [docs/architecture/project-structure.md](docs/architecture/project-structure.md)。

## 开发命令

```bash
npm run dev
npm run build
npm run typecheck
npm run check:lockfile
npm run test:control-plane
npm run test:runtime
npm run test:engine
npm run test:api
npm run test:worker
npm run verify
npm run gateway
npm run worker
```

`npm run verify` 当前会执行 `check:lockfile -> test:control-plane -> test:runtime -> test:engine -> test:api -> test:worker -> typecheck -> build`，用于在推送前复现 CI 的核心校验路径。`test:runtime` 负责校验共享 control-plane runtime 的装配、fanout 和 workflow 行为，`test:engine` 负责校验 shared task workflow engine 的 executor registry 和执行路径，`test:api` 当前覆盖 notification、risk、scheduler、audit、cycle records、workflow runs、cycle resolution 和 state runner 这些控制面关键路由，`test:worker` 覆盖 notification dispatch、risk scan、scheduler tick、workflow maintenance 和 workflow execution 这些后台任务。

前端默认运行在 `http://127.0.0.1:8080`，`/api/*` 会代理到 `http://127.0.0.1:8787`。
当前通知链路已经拆成 `API 入队 -> worker 分发 -> Notification Center 拉取已分发事件`，风险扫描链路已经拆成 `state runner 入队 -> worker 扫描 -> Risk Console 拉取 risk events`，scheduler 链路已经拆成 `worker tick -> scheduler store -> Notification Center 拉取 scheduler ticks`，运行时文件写入 `.quantpilot-runtime/`。
当前 `task-orchestrator` 已开始具备最小持久化工作流能力，`cycles/run` 和 `state/run` 会自动写入 workflow runs，并支持 `queued / running / retry_scheduled / completed / failed / canceled` 这些状态，以及 `/api/task-orchestrator/workflows` 查询、`resume / cancel` 控制和 worker maintenance 重排。

## 关键入口

- [web app](apps/web/src/app/App.tsx)
- [web router](apps/web/src/app/routes/AppRouter.tsx)
- [trading state](apps/web/src/store/trading-system/TradingSystemProvider.tsx)
- [simulation core](apps/web/src/store/trading-system/core.ts)
- [runtime config](apps/web/src/services/config/runtime.ts)
- [market provider](apps/web/src/services/providers/marketData.ts)
- [broker provider](apps/web/src/services/providers/broker.ts)
- [api gateway entry](apps/api/src/main.mjs)
- [alpaca gateway](apps/api/src/gateways/alpaca.mjs)
- [control-plane service](apps/web/src/services/controlPlane.ts)
- [shared types](packages/shared-types/src/trading.ts)
- [shared trading runtime](packages/trading-engine/src/runtime.mjs)

## 安全边界

- 浏览器端不应持有真实 broker 密钥。
- 远程下单必须通过服务端网关。
- Agent 建议不应直接触发真实下单。
- 实盘执行前必须经过风控和审批闸门。
