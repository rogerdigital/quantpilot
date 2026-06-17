# QuantPilot

> 本地优先量化研究与执行控制台，React 18 + TypeScript + Vite monorepo，覆盖策略研究、行情、回测、执行、风控和设置管理。

## Project Overview

- **Purpose**: 面向量化交易的核心控制台，包含 Web 控制台、API 网关、共享类型、交易引擎和共享 UI 组件
- **Author**: Roger Deng
- **License**: MIT
- **Runtime**: Node.js >=20.19.0 (ESM)，前端 React SPA

## Tech Stack

| Layer | Tech |
|-------|------|
| Language | TypeScript (ES2022)，前后端全量 `.ts` |
| Frontend | React 18, react-router-dom v6 |
| Bundler | Vite 8 (`@vitejs/plugin-react` + `@vanilla-extract/vite-plugin`) |
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
│       ├── modules/     功能模块 (console, research, risk, permissions...)
│       ├── pages/       路由页面 (Dashboard, Market, Trading, Strategies,
│       │                Backtest, Execution, Risk, Settings)
│       ├── services/    API 服务层
│       ├── store/       状态管理 (TradingSystemProvider)
│       └── hooks/       React hooks

packages/
├── shared-types/             共享 TypeScript 类型
├── trading-engine/           交易引擎
└── ui/                       共享 Vanilla Extract UI 组件
```

路径别名: `@shared-types` → `packages/shared-types/src/`

## Commands

```bash
# 开发
npm run dev              # Vite dev server (0.0.0.0:8080, /api 代理到 8787)
npm run gateway          # 启动 API 网关

# 测试
npm run test:web         # Vitest web 测试
npm run test:api         # API 测试 (node --test)
npm run test:engine      # 交易引擎测试

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
- **TypeScript**: `strict: true`, `target: ES2022`, Web 使用 `moduleResolution: Bundler`，Node 包使用 `NodeNext`
- **JSX**: `react-jsx` 自动转换，无需手动 import React
- **CSS**: 所有样式使用 Vanilla Extract (`.css.ts`)；`globalStyle` 用于全局类名，`style()` 用于组件级作用域
- **i18n**: `LocaleProvider` 提供 zh/en 双语，`copy[locale]` 模式访问文案

## Important Guardrails

- 样式改动在对应的 `.css.ts` 文件中进行（`apps/web/src/app/styles/` 或组件同目录），不引入任何 `.css` 文件
- Canvas 图表颜色硬编码在 `ConsoleChrome.tsx` 的 `ChartCanvas` 中
- `.env` / `.env.local` 不提交，参考 `.env.example`
- 测试中避免硬编码时间戳，使用 `new Date().toISOString()` 防止日期漂移
- pre-push hook 会运行完整验证，确保提交前本地通过
