# QuantPilot

[English](./README.md) | [中文](./README.zh-CN.md)

AI 原生量化研究与执行控制面 — 通过 Web 控制台完成策略研究、回测、执行和风控，支持受控 Agent 协作。

> QuantPilot 是受控量化研究与执行平台，覆盖从假设到实盘的完整生命周期，每个边界都有证据驱动的晋升门禁、风控强制和 Agent 治理。

---

## 安全边界

- 浏览器端不持有真实 broker 密钥 — 所有密钥留在服务端
- Agent 不得直接发起真实交易 — 所有 Agent 行为均为建议性质，需人类或策略确认
- 风控与审批边界不可绕过；紧急熔断在服务端强制执行
- `live` 模式需要服务端环境验证、显式风险确认和完整晋升证据链
- 所有策略上线必须携带研究、回测、风控和执行证据
- 本平台是受控研究与执行控制面，不是无人值守实盘系统

---

## 快速开始

**环境要求：** Node.js >=20.5.0、npm >=10

```bash
npm install

# 启动三个进程（分开终端）
npm run dev        # Web 控制台 → http://localhost:8080
npm run gateway    # API 网关 → http://localhost:8787
npm run worker     # 后台 Worker
```

复制 `.env.example` 到 `.env` 并配置。校验：

```bash
npm run check:runtime-env -- --env-file .env
```

| 变量 | 用途 |
|------|------|
| `QUANTPILOT_TRADING_MODE` / `VITE_TRADING_MODE` | `simulated`、`paper` 或 `live` |
| `ALPACA_KEY_ID` / `ALPACA_SECRET_KEY` | `paper` 和 `live` 模式必填 |
| `QUANTPILOT_LIVE_TRADING_ACK` | 进入 `live` 模式前必须设置 |
| `JWT_SECRET` | HS256 签名密钥（最少 32 字符） |
| `BROKER_KEY_ENCRYPTION_KEY` | 64 字符十六进制，用于 AES-256-GCM |
| `DEMO_USERNAME` / `DEMO_PASSWORD` | 登录凭证（`admin` / `changeme`） |

---

## 核心能力

| 领域 | 功能 |
|------|------|
| **数据科学** | 数据集注册、7 项自动化质量检查、特征注册与血缘追踪、版本化数据摄入 |
| **研究与策略** | 研究工作区（假设管理）、实验注册、模型注册、结构化决策记录 |
| **回测实验室** | 可复现规格（hash 稳定）、佣金/滑点模型、市场环境归因、Walk-Forward 分析、鲁棒性诊断 |
| **策略生命周期** | 8 个晋升门禁、证据驱动状态流转（research → candidate → paper → live）、策略包清单 |
| **执行** | 订单生命周期状态机（算法单 + 腿）、broker 适配层、恢复工作流、对账 |
| **风控** | 策略引擎（11 条规则）、交易前评估、VaR/CVaR/Beta/HHI、紧急熔断、审批边界 |
| **Agent 协作** | 受治理工具注册、5 类审查工作流、Session → Intent → Plan → Analysis → Action 管线、authority 梯度 |
| **计算平台** | 任务调度、产物管理、异步运行器、回测分发器 |
| **连接器** | 数据/Broker/模型连接器注册、策略包校验、环境感知健康检查 |
| **可观测性** | 平台事件总线（13 类事件）、系统健康矩阵、产物完整性检查（6 类） |
| **运维** | 监控、事件响应、审计、合规报告、备份恢复、维护 CLI |
| **鉴权与安全** | JWT 认证、AES-256-GCM broker 密钥加密、工作区 RBAC、机构级权限（9 动作 × 5 角色） |
| **图表** | lightweight-charts v5：权益曲线、K 线、信号柱状图 |
| **交互** | `Cmd+K` 命令面板、审批抽屉、Toast 通知 |

---

## 架构

```text
quantpilot/
├── apps/
│   ├── web/          React 18 SPA (Vite, vanilla-extract)
│   ├── api/          Node.js API 网关 (ESM + tsx)
│   └── worker/       后台任务运行器 (job handlers)
├── packages/
│   ├── trading-engine/          回测、风控策略、执行、策略生命周期、连接器
│   ├── task-workflow-engine/    工作流编排、Agent 审查工作流
│   ├── control-plane-runtime/  运行时上下文、事件总线、权限策略、连接器注册
│   ├── control-plane-store/    持久化：数据集、特征、实验、模型、组织、审计
│   ├── llm-provider/           LLM 抽象层
│   ├── shared-types/           前后端共享类型合同（14 个类型模块）
│   ├── ui/                     共享 UI 组件与设计 token
│   └── db/                     数据库适配 (SQLite + Drizzle)
├── docs/             架构、运维、部署
├── scripts/          工具和 CI 辅助
└── CONTRIBUTING.md
```

详细文档：[项目结构](./docs/architecture/project-structure.md) | [运维手册](./docs/operations-handbook.md) | [部署指南](./docs/deployment.md) | [协作指南](./CONTRIBUTING.md)

---

## 开发

```bash
# 开发服务器
npm run dev                  # Vite 开发服务器 (HMR)
npm run gateway              # API 网关
npm run worker               # 后台 Worker

# 测试
npm run test:web             # Vitest 前端测试
npm run test:api             # API 测试 (node --test)
npm run test:engine          # 交易和工作流引擎测试
npm run test:runtime         # 运行时测试
npm run test:control-plane   # 存储层测试
npm run test:worker          # Worker 测试

# 校验
npm run typecheck            # tsc --noEmit
npm run build                # 生产构建
npm run verify               # 完整校验 (lint + 测试 + typecheck + build)
```

Pre-push hook 自动执行 `verify`。

| 层级 | 选择 |
|------|------|
| 语言 | TypeScript 5 (TS-only 一手源码) |
| 前端 | React 18 + react-router-dom 6 |
| 构建 | Vite 5 + vanilla-extract |
| 后端 | Node.js ESM + tsx |
| 测试 | Vitest + node --test |
| 包管理 | npm workspaces |

---

## 未来方向

核心平台（领域契约到可观测性）已完成。下一步重点：真实数据库迁移（PostgreSQL）、生产 broker 多供应商集成、多租户工作区隔离。

---

## 许可证

[MIT](./LICENSE)
