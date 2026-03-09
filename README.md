# QuantPilot

QuantPilot 是一个面向量化交易工作流的分层平台原型，当前仓库已经从单一 Vite 应用重构为面向 `平台底座 + Agent 能力` 的 monorepo 骨架。

## 当前定位

- `apps/web`: 用户控制台，承载 Dashboard、Market、Strategy、Backtest、Risk、Execution、Agent、Notifications 和 Settings。
- `apps/api`: 后端入口和网关骨架，承载 API、鉴权、任务编排、通知、审计、调度等服务边界。
- `apps/worker`: 异步 worker 骨架，预留回测、风控扫描、通知分发和执行补偿等后台任务进程。
- `packages/shared-types`: 前后端共享的交易和平台类型定义。
- `packages/trading-engine`: 市场、策略、风控、执行和控制面合并所需的共享 runtime。

当前版本依然以产品原型和前端工作流为主，不是可直接用于无人值守实盘的生产系统。

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
npm run gateway
npm run worker
```

前端默认运行在 `http://127.0.0.1:8080`，`/api/*` 会代理到 `http://127.0.0.1:8787`。

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
