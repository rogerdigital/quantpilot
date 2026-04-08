# QuantPilot

> AI-native 量化交易平台，React 18 + TypeScript + Vite monorepo，覆盖策略研究、回测、执行、风控、Agent 协作全链路。

## Project Overview

- **Purpose**: 面向量化交易的全栈平台，包含 Web 控制台、API 网关、后台 Worker、共享引擎和存储层
- **Author**: Roger Deng
- **License**: MIT
- **Runtime**: Node.js >=20.5.0 (ESM)，前端 React SPA

## Tech Stack

| Layer | Tech |
|-------|------|
| Language | TypeScript (ES2022)，前后端全量 `.ts` |
| Frontend | React 18, react-router-dom v6 |
| Bundler | Vite 5 (`@vitejs/plugin-react` + `@vanilla-extract/vite-plugin`) |
| Test | Vitest (web), `node --test` (backend) |
| Module | ESM (`"type": "module"` 全局) |
| Styling | Vanilla Extract (`.css.ts`)，无任何 `.css` 文件 |
| Fonts | Sora (UI) + JetBrains Mono (data) |
| Deploy | Vercel (SPA rewrites) |
| CI | GitHub Actions (Ubuntu, Node 22) |
| Package Manager | npm workspaces |

## Monorepo Structure

```
apps/
├── api/        @quantpilot/api      API 网关 (Node.js .ts)
├── web/        @quantpilot/web      React SPA (Vite)
│   └── src/
│       ├── app/         App shell、全局样式
│       ├── components/  共享 UI 组件 (ConsoleChrome 等)
│       ├── modules/     功能模块 (agent, console, research, risk, permissions...)
│       ├── pages/       路由页面 (9 页: Dashboard, Market, Strategies, Backtest,
│       │                Execution, Risk, Agent, Notifications, Settings)
│       ├── services/    API 服务层
│       ├── store/       状态管理 (TradingSystemProvider)
│       └── hooks/       React hooks
└── worker/     @quantpilot/worker   后台 Worker (Node.js .ts)

packages/
├── control-plane-runtime/    运行时上下文
├── control-plane-store/      持久化存储
├── db/                       数据库适配
├── shared-types/             共享 TypeScript 类型
├── task-workflow-engine/     工作流引擎
└── trading-engine/           交易引擎
```

路径别名: `@shared-types` → `packages/shared-types/src/`

## Commands

```bash
# 开发
npm run dev              # Vite dev server (0.0.0.0:8080, /api 代理到 8787)
npm run gateway          # 启动 API 网关
npm run worker           # 启动后台 Worker

# 测试
npm run test:web         # Vitest web 测试
npm run test:api         # API 测试 (node --test)
npm run test:engine      # 工作流引擎测试
npm run test:runtime     # 运行时测试
npm run test:control-plane  # 存储层测试
npm run test:worker      # Worker 测试

# 构建 & 验证
npm run typecheck        # tsc --noEmit
npm run build            # Vite production build
npm run verify           # 完整验证 (所有检查 + 所有测试 + typecheck + build)
```

**Pre-push hook**: `npm run verify` 在每次 push 前自动运行。

## Code Conventions

- **缩进**: 2 spaces
- **分号**: 使用
- **引号**: 单引号 (JSX 属性用双引号)
- **模块**: ESM imports/exports
- **TypeScript**: `strict: false`, `target: ES2022`, `moduleResolution: Bundler`
- **JSX**: `react-jsx` 自动转换，无需手动 import React
- **CSS**: 所有样式使用 Vanilla Extract (`.css.ts`)；`globalStyle` 用于全局类名，`style()` 用于组件级作用域
- **i18n**: `LocaleProvider` 提供 zh/en 双语，`copy[locale]` 模式访问文案

## Important Guardrails

- 样式改动在对应的 `.css.ts` 文件中进行（`apps/web/src/app/styles/` 或组件同目录），不引入任何 `.css` 文件
- Canvas 图表颜色硬编码在 `ConsoleChrome.tsx` 的 `ChartCanvas` 中
- `.env` / `.env.local` 不提交，参考 `.env.example`
- 测试中避免硬编码时间戳，使用 `new Date().toISOString()` 防止日期漂移
- pre-push hook 会运行完整验证，确保提交前本地通过
