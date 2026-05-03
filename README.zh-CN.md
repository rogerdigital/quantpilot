# QuantPilot

AI 原生量化交易平台 — 通过 Web 控制台完成策略研究、回测、执行和风控，支持受控 Agent 协作。

> **不是生产级实盘交易系统。** QuantPilot 是面向受控量化交易流程的平台骨架与运营界面。

## 快速开始

**环境要求：** Node.js 20+、npm 10+

```bash
npm install
npm run dev        # Web 控制台 — http://127.0.0.1:8080
npm run gateway    # API 网关 — http://127.0.0.1:8787
npm run worker     # 后台 Worker
```

接入真实券商或 LLM 时，复制 `.env.example` 到 `.env` 并配置。校验配置：

```bash
npm run check:runtime-env -- --env-file .env
```

## 架构

```
apps/
├── api/        API 网关 (Node.js)
├── web/        React SPA (Vite + Vanilla Extract)
└── worker/     后台 Worker

packages/
├── trading-engine/          策略、回测、风险量化、执行
├── task-workflow-engine/    工作流编排
├── control-plane-runtime/   运行时上下文
├── control-plane-store/     持久化适配 (file / SQLite)
├── llm-provider/            LLM 抽象层 (Claude、OpenAI)
├── db/                      数据库适配 (SQLite + Drizzle)
└── shared-types/            前后端共享类型合同
```

**四条运行主链路：** 研究 → 执行 → 中间件（风控/调度）→ Agent 协作。

## 核心能力

- **研究与策略** — 策略目录、事件驱动回测引擎（Sharpe、最大回撤、胜率、换手率）、治理、对比、结构化交接到执行
- **执行** — 执行计划、券商事件接入、对账、恢复、Trading Terminal 买卖下单
- **风控与调度** — 风控工作台、历史法 VaR (95%)、CVaR、Beta、HHI 集中度、调度工作台、经审核的中间件动作
- **Agent 协作** — Session/Intent/Plan/Analysis/Action 合同、每日运营循环（盘前简报、盘中监控、盘后复盘）、主动提请队列
- **实时推送** — SSE 状态推送、前端轮询降级为 15 秒 fallback
- **图表** — lightweight-charts v5：权益曲线、K 线、信号柱状图，配合 OHLCV 数据 hook
- **鉴权与安全** — JWT 认证、AES-256-GCM broker 密钥加密、API key 掩码
- **运维** — 监控、事件响应、审计、备份恢复、完整性检查、SQLite WAL 存储

## 命令

```bash
# 开发
npm run dev                  # 启动 Web 开发服务器
npm run gateway              # 启动 API 网关
npm run worker               # 启动后台 Worker

# 测试
npm run test:web             # Vitest 前端测试
npm run test:api             # API 测试 (node --test)
npm run test:engine          # 交易引擎测试
npm run test:runtime         # 运行时测试
npm run test:control-plane   # 控制面存储测试
npm run test:worker          # Worker 测试

# 校验
npm run typecheck            # TypeScript 类型检查
npm run build                # 生产构建
npm run verify               # 完整校验 (lint + 测试 + typecheck + build)
```

Pre-push hook 自动执行 `npm run verify`。

## 文档

- [协作指南](./CONTRIBUTING.md)
- [运维手册](./docs/operations-handbook.md)
- [部署指南](./docs/deployment.md)
- [控制面迁移手册](./docs/control-plane-migrations.md)
- [项目结构说明](./docs/architecture/project-structure.md)

### 架构历史

阶段化交付路线已收官。阶段文档作为架构历史和合同基线参考：

- [Stage 1](./docs/architecture/stage-1-closeout.md) · [Stage 2](./docs/architecture/stage-2-closeout.md) · [Stage 3](./docs/architecture/stage-3-closeout.md) · [Stage 4](./docs/architecture/stage-4-closeout.md) · [Stage 5](./docs/architecture/stage-5-closeout.md) · [Stage 6](./docs/architecture/stage-6-closeout.md) · [Stage 7](./docs/architecture/stage-7-closeout.md)

## 安全边界

- 浏览器端不持有真实 broker 密钥
- 远程下单仅通过服务端网关
- Agent 不得直接发起真实交易
- 风控与审批边界不可绕过
- 本仓库不是无人值守实盘的生产部署

## 许可证

[MIT](./LICENSE)
