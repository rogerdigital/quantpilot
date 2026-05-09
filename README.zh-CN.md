# QuantPilot

AI 原生量化交易平台 — 通过 Web 控制台完成策略研究、回测、执行和风控，支持受控 Agent 协作。

> **不是生产级实盘交易系统。** QuantPilot 是面向受控量化交易流程的平台骨架与运营界面。

---

## 核心能力

| 领域 | 功能 |
|------|------|
| **研究与策略** | 策略目录、事件驱动回测引擎（Sharpe、最大回撤、胜率、换手率）、治理、对比、结构化交接到执行 |
| **执行** | 执行计划、券商事件接入、对账、恢复、Trading Terminal 买卖下单 |
| **风控与调度** | 风控工作台、历史法 VaR (95%)、CVaR、Beta、HHI 集中度、调度工作台、经审核的中间件动作 |
| **Agent 协作** | Session/Intent/Plan/Analysis/Action 合同、每日运营循环（盘前简报、盘中监控、盘后复盘）、主动提请队列 |
| **实时推送** | SSE 状态推送、前端轮询降级为 15 秒 fallback |
| **图表** | lightweight-charts v5：权益曲线、K 线、信号柱状图，配合 OHLCV 数据 hook |
| **鉴权与安全** | JWT 认证、AES-256-GCM broker 密钥加密、API key 掩码 |
| **运维** | 监控、事件响应、审计、备份恢复、完整性检查、SQLite WAL 存储 |
| **交互** | `Cmd+K` 命令面板、审批抽屉、Toast 通知 |

---

## 快速开始

**环境要求：** Node.js 20+、npm 10+

```bash
npm install

# 启动三个进程（分开终端）
npm run dev        # Web 控制台 — http://127.0.0.1:8080
npm run gateway    # API 网关 — http://127.0.0.1:8787
npm run worker     # 后台 Worker
```

### 环境变量

复制 `.env.example` 到 `.env` 并配置。校验配置：

```bash
npm run check:runtime-env -- --env-file .env
```

| 变量 | 用途 |
|------|------|
| `QUANTPILOT_TRADING_MODE` / `VITE_TRADING_MODE` | 运行模式：`simulated`、`paper` 或 `live`；两者同时配置时必须一致 |
| `ALPACA_KEY_ID` / `ALPACA_SECRET_KEY` | `paper` 和 `live` 模式必填；`simulated` 模式允许为空 |
| `QUANTPILOT_LIVE_TRADING_ACK` | 进入 `live` 模式前必须显式设为 `I_UNDERSTAND_LIVE_TRADING_RISK` |
| `JWT_SECRET` | HS256 签名密钥（最少 32 字符） |
| `BROKER_KEY_ENCRYPTION_KEY` | 64 字符十六进制，用于 AES-256-GCM |
| `DEMO_USERNAME` / `DEMO_PASSWORD` | 登录凭证（`admin` / `changeme`） |

### 交易模式

| 模式 | 行为 |
|------|------|
| `simulated` | 使用本地模拟 broker 和模拟行情 fallback；Alpaca 凭证可以为空。 |
| `paper` | 必须配置 Alpaca 凭证，且 `ALPACA_USE_PAPER=true`；订单经服务端网关进入 paper account。 |
| `live` | 必须配置 Alpaca 凭证、`ALPACA_USE_PAPER=false`，并显式确认 live trading 风险。 |

---

## 开发

### 命令

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

### 技术栈

| 层级 | 选择 |
|------|------|
| 语言 | TypeScript 5 (TS-only 一手源码) |
| 前端 | React 18 + react-router-dom 6 |
| 构建 | Vite 5 + vanilla-extract |
| 后端 | Node.js ESM + tsx |
| 测试 | Vitest + node --test |
| 包管理 | npm workspaces |

---

## 架构

```
quantpilot/
├── apps/
│   ├── web/          React 18 SPA (Vite, VE 样式)
│   ├── api/          Node.js API 网关 (ESM + tsx)
│   └── worker/       后台任务运行器
├── packages/
│   ├── trading-engine/          策略、回测、风险量化、执行
│   ├── task-workflow-engine/    工作流编排
│   ├── control-plane-runtime/   运行时上下文
│   ├── control-plane-store/     持久化适配 (file / SQLite)
│   ├── llm-provider/            LLM 抽象层 (Claude、OpenAI)
│   ├── db/                      数据库适配 (SQLite + Drizzle)
│   └── shared-types/            前后端共享类型合同
├── docs/             架构、运维、部署
├── scripts/          工具和 CI 辅助
└── CONTRIBUTING.md
```

---

## 文档

| 文档 | 用途 |
|------|------|
| [协作指南](./CONTRIBUTING.md) | 开发流程、PR 规则 |
| [运维手册](./docs/operations-handbook.md) | 备份、恢复、事件响应 |
| [部署指南](./docs/deployment.md) | 构建、环境、部署清单 |
| [项目结构说明](./docs/architecture/project-structure.md) | 详细模块地图 |

---

## 路线图

### 当前状态

Stage 1-7 已完成。平台骨架完全可用，包含研究、回测、执行、风控和 Agent 协作模块。

### 近期计划（1-3 个月）

- 券商对接：Alpaca、Interactive Brokers API 集成
- Agent 治理增强：更细粒度权限控制、风险策略配置
- 监控告警：实时风控指标、异常检测、告警通知
- 文档完善：API 文档、用户手册、贡献指南

### 长期愿景（6-12 个月）

- 多策略多账户：策略组合管理、账户隔离
- 机构级风控：压力测试、情景分析、合规报告
- 开源生态：插件架构、第三方策略市场
- 云原生部署：Docker、Kubernetes、多租户

---

## 安全边界

- 浏览器端不持有真实 broker 密钥
- 远程下单仅通过服务端网关
- Agent 不得直接发起真实交易
- 风控与审批边界不可绕过
- `simulated`、`paper`、`live` 模式会通过 API health 和操作界面明确展示
- 本仓库不是无人值守实盘的生产部署

---

## 许可证

[MIT](./LICENSE)
