# QuantPilot 生产级加固与优化计划

> 日期: 2026-05-24
> 范围: 安全加固、类型安全、可观测性、测试覆盖、持久化、配置管理、性能优化、UI 布局、代码精简
> 原则: 每个提交独立可验证，不引入破坏性变更，先修后优化

---

## 一、改造总览

| # | 类别 | 优先级 | 影响范围 | 提交数 |
|---|------|--------|----------|--------|
| 1 | 安全: hasPermission 真实鉴权 | P0 | apps/api | 2 |
| 2 | 安全: CORS / rate limiting / debug_token / require() | P0 | apps/api | 2 |
| 3 | 类型安全: @ts-nocheck 清理 | P1 | apps/api, packages | 8 |
| 4 | 可观测性: 结构化日志 | P1 | apps/api | 2 |
| 5 | 测试覆盖: 关键路径补全 | P1 | apps/web, packages | 3 |
| 6 | 持久化: Auth 数据落盘 | P2 | apps/api | 1 |
| 7 | 配置管理: env 校验 + MFA 清理 | P2 | apps/api | 1 |
| 8 | Gateway 整合: 废弃 raw Node, 拆分 monolith | P2 | apps/api | 3 |
| 9 | 前端性能: 页面级 code splitting + 轮询优化 | P2 | apps/web | 2 |
| 10 | UI 布局优化 | P3 | apps/web | 4 |
| 11 | 代码精简: 去冗余、去死代码 | P3 | 全局 | 2 |
| 12 | 前端补充: 错误边界、骨架屏、空状态 | P3 | apps/web | 2 |

**总计: ~32 个提交**

---

## 二、提交清单

### Phase 1: 安全加固 (P0)

#### Commit 1.1 — hasPermission 真实 JWT 鉴权

**问题**: `apps/api/src/modules/auth/service.ts` 的 `hasPermission(_authHeader)` 完全忽略 auth header，直接从服务端默认状态读权限。

**改动**:
- `service.ts`: `getSession()` 从 `Authorization` header 提取 Bearer token，调用 `verifyToken()` 解析 JWT，从 JWT payload 获取 userId，再查 session/permissions
- `service.ts`: `hasPermission()` 接收 authHeader，传递给 `getSession()`
- `jwt-service.ts`: 移除 `@ts-nocheck`，添加类型注解
- 所有 router 中的 `hasPermission(authHeader, ...)` 调用确保传递了 request 的 Authorization header

**文件**:
- `apps/api/src/modules/auth/service.ts`
- `apps/api/src/modules/auth/jwt-service.ts`
- `apps/api/src/app/routes/routers/*.ts` (受影响的 router)

**验证**: `npm run test:api && npm run typecheck`

#### Commit 1.2 — 新增 auth 中间件提取用户身份

**改动**:
- 新建 `apps/api/src/middleware/auth.ts`: Hono 中间件，从 `Authorization` header 解析 JWT，将用户信息挂到 `c.set('user', ...)`，无效 token 返回 401
- 在 `hono-app.ts` 中注册全局 auth 中间件（排除 `/api/health`, `/api/auth/login` 等公开路由）
- 各 router 通过 `c.get('user')` 获取已认证用户

**文件**:
- `apps/api/src/middleware/auth.ts` (新建)
- `apps/api/src/app/hono-app.ts`
- `apps/api/src/app/routes/routers/*.ts`

**验证**: `npm run test:api && npm run typecheck`

#### Commit 1.3 — CORS 收窄 + 移除 debug_token + 修复 require()

**改动**:
- `hono-app.ts`: CORS origin 从 `*` 改为从 env 读取 `CORS_ORIGINS`（逗号分隔），默认 `http://localhost:8080`
- `auth-router.ts`: 移除 password reset 响应中的 `debug_token` 字段
- `auth-router.ts`: 第 345 行 `require('node:crypto')` 改为 ESM `import { randomBytes } from 'node:crypto'`（文件顶部已有 `import { createHash } from 'node:crypto'`，合并即可）
- `alpaca.ts`: 同步 CORS 配置

**文件**:
- `apps/api/src/app/hono-app.ts`
- `apps/api/src/app/routes/routers/auth-router.ts`
- `apps/api/src/gateways/alpaca.ts`
- `.env.example` (新增 `CORS_ORIGINS`)

**验证**: `npm run test:api && npm run build`

#### Commit 1.4 — Rate limiting

**改动**:
- 新建 `apps/api/src/middleware/rate-limit.ts`: 基于 IP 的滑动窗口 rate limiter（内存 Map，窗口 60s，默认 100 次/分钟）
- 在 `hono-app.ts` 注册全局中间件
- 可通过 `RATE_LIMIT_WINDOW_MS` 和 `RATE_LIMIT_MAX` 环境变量配置

**文件**:
- `apps/api/src/middleware/rate-limit.ts` (新建)
- `apps/api/src/app/hono-app.ts`
- `.env.example`

**验证**: `npm run test:api`

---

### Phase 2: 类型安全 (P1)

#### Commit 2.1 — 移除 auth 模块 @ts-nocheck (6 文件)

**改动**: 逐文件移除 `// @ts-nocheck`，添加类型注解：
- `apps/api/src/modules/auth/service.ts`
- `apps/api/src/modules/auth/jwt-service.ts`
- `apps/api/src/modules/auth/broker-key-service.ts`
- `apps/api/src/modules/auth/permission-catalog.ts`
- `apps/api/src/modules/auth/user-store.ts` (如存在)

**策略**: 移除 `@ts-nocheck` → `npm run typecheck` → 逐个修复报错 → 确认通过

**验证**: `npm run typecheck`

#### Commit 2.2 — 移除核心 router @ts-nocheck (5 文件)

**改动**: 优先处理权限敏感的 router：
- `trading-router.ts`
- `execution-router.ts`
- `risk-router.ts`
- `strategy-router.ts`
- `agent-router.ts`

**验证**: `npm run typecheck && npm run test:api`

#### Commit 2.3 — 移除 domain services @ts-nocheck (批次 1: agent + risk)

**改动**:
- `apps/api/src/domains/agent/services/*.ts` (6 文件)
- `apps/api/src/domains/risk/services/*.ts` (6 文件)

**验证**: `npm run typecheck`

#### Commit 2.4 — 移除 domain services @ts-nocheck (批次 2: execution + strategy + backtest)

**改动**:
- `apps/api/src/domains/execution/services/*.ts` (5 文件)
- `apps/api/src/domains/strategy/services/*.ts` (4 文件)
- `apps/api/src/domains/backtest/services/*.ts` (3 文件)
- `apps/api/src/domains/research/services/*.ts` (4 文件)

**验证**: `npm run typecheck`

#### Commit 2.5 — 移除剩余 router @ts-nocheck

**改动**: 剩余 18 个 router 文件批量清理

**验证**: `npm run typecheck`

#### Commit 2.6 — 移除 modules 层 @ts-nocheck

**改动**:
- `apps/api/src/modules/sse/sse-manager.ts`
- `apps/api/src/modules/registry.ts`
- `apps/api/src/modules/notification/service.ts`
- `apps/api/src/modules/operations/*.ts`
- `apps/api/src/modules/user-account/service.ts`
- `apps/api/src/modules/scheduler/service.ts`
- `apps/api/src/modules/incidents/service.ts`
- `apps/api/src/modules/audit/service.ts`
- `apps/api/src/modules/monitoring/service.ts`

**验证**: `npm run typecheck`

#### Commit 2.7 — 移除 control-plane + gateway + docs @ts-nocheck

**改动**:
- `apps/api/src/control-plane/task-orchestrator/*.ts` (5 文件)
- `apps/api/src/gateways/alpaca.ts`
- `apps/api/src/docs/openapi.ts`
- `apps/api/src/app/routes/hono/execution-hono-router.ts`

**验证**: `npm run typecheck`

#### Commit 2.8 — 移除 packages 层 @ts-nocheck

**改动**:
- `packages/db/src/*.ts` (5 文件)
- `packages/trading-engine/src/**/*.ts` (12 文件)

**验证**: `npm run typecheck && npm run test:engine && npm run test:control-plane`

---

### Phase 3: 可观测性 (P1)

#### Commit 3.1 — 引入 pino 结构化日志

**改动**:
- 安装 `pino` 和 `pino-pretty`（dev）
- 新建 `apps/api/src/lib/logger.ts`: 创建 pino 实例，JSON 格式，支持 `LOG_LEVEL` 环境变量
- 替换 `apps/api/src/main.ts` 中的 `console.log`
- 替换 `hono-app.ts` 中的 error handler 日志
- 替换所有 `apps/api/src/domains/*/services/*.ts` 中的 `console.error` / `console.log`

**文件**:
- `apps/api/src/lib/logger.ts` (新建)
- `apps/api/src/main.ts`
- `apps/api/src/app/hono-app.ts`
- `apps/api/src/domains/agent/services/*.ts` (3+ 文件有 console 调用)

**验证**: `npm run gateway` 启动确认日志格式正确

#### Commit 3.2 — 请求级 request-id + 错误分类

**改动**:
- 新建 `apps/api/src/middleware/request-id.ts`: 从 `X-Request-Id` header 读取或生成 UUID，挂到 context
- `hono-app.ts` 的 `onError` handler: 区分 4xx/5xx，5xx 不泄露内部错误细节给客户端
- pino logger 配合 request-id，在每个日志行中附加 `reqId`

**文件**:
- `apps/api/src/middleware/request-id.ts` (新建)
- `apps/api/src/app/hono-app.ts`
- `apps/api/src/lib/logger.ts`

**验证**: `npm run test:api`

---

### Phase 4: 测试覆盖 (P1)

#### Commit 4.1 — llm-provider 测试

**改动**:
- 新建 `packages/llm-provider/test/llm-provider.test.ts`
- 测试 Claude 和 OpenAI provider 的 `chat()` 和 `chatWithTools()` 接口（mock HTTP）
- 测试 factory 的 provider 选择逻辑
- 测试 graceful degradation（无 API key 时返回 null）

**文件**:
- `packages/llm-provider/test/llm-provider.test.ts` (新建)

**验证**: `npm run test:engine`（或新增 test:llm 脚本）

#### Commit 4.2 — db 包测试

**改动**:
- 新建 `packages/db/test/sqlite-adapter.test.ts`
- 新建 `packages/db/test/collection-store.test.ts`
- 测试 SQLite adapter 的 CRUD、WAL 模式、JSON 序列化
- 测试 collection store 的读写、命名空间隔离

**文件**:
- `packages/db/test/sqlite-adapter.test.ts` (新建)
- `packages/db/test/collection-store.test.ts` (新建)

**验证**: `npm run test:control-plane`

#### Commit 4.3 — 前端关键路径测试

**改动**:
- 新建 `apps/web/src/store/trading-system/TradingSystemProvider.test.tsx`: 测试 context 初始化、state cycle、SSE 事件处理
- 新建 `apps/web/src/hooks/useSSE.test.ts`: 测试连接、重连、事件分发
- 扩展 `apps/web/src/modules/risk/risk-workbench.test.tsx` 覆盖更多场景

**文件**:
- `apps/web/src/store/trading-system/TradingSystemProvider.test.tsx` (新建)
- `apps/web/src/hooks/useSSE.test.ts` (新建)

**验证**: `npm run test:web`

---

### Phase 5: 持久化 (P2)

#### Commit 5.1 — Auth 数据迁移至控制面存储

**改动**:
- `user-store.ts`: 将 `Map` 存储替换为控制面 store 的 `readObject`/`writeObject`
- `team-store.ts`: 同上
- `risk-router.ts`: `riskPolicies` 内存数组改为控制面持久化
- 启动时自动 seed 默认 admin 用户（如不存在）

**文件**:
- `apps/api/src/modules/auth/user-store.ts`
- `apps/api/src/modules/auth/team-store.ts` (如存在)
- `apps/api/src/app/routes/routers/risk-router.ts`

**验证**: `npm run test:api`，重启后数据不丢失

---

### Phase 6: 配置管理 (P2)

#### Commit 6.1 — env 校验 + MFA 清理 + 自定义 .env parser 替换

**改动**:
- 安装 `zod` + `@t3-oss/env-core`（或直接用 zod）
- 新建 `apps/api/src/lib/env.ts`: zod schema 校验所有必需 env vars，启动时 fail-fast
- 移除 `alpaca.ts` 中的自定义 `loadEnvFile()`，改用标准 `dotenv` 或 Node.js 原生 `--env-file`（Node 20.6+）
- `user-store.ts`: 移除 MFA stub（`verifyMfa` 永远返回 true），如不做真实 MFA 则删除 MFA 相关代码
- `auth-router.ts`: 移除 MFA challenge endpoint 中接受任意 6 位数的逻辑

**文件**:
- `apps/api/src/lib/env.ts` (新建)
- `apps/api/src/main.ts`
- `apps/api/src/gateways/alpaca.ts`
- `apps/api/src/modules/auth/user-store.ts`
- `apps/api/src/app/routes/routers/auth-router.ts`
- `package.json` (新增依赖)

**验证**: `npm run gateway` 启动确认 env 校验生效，缺必需变量时报错退出

---

### Phase 7: Gateway 整合 (P2)

#### Commit 7.1 — 统一 Hono，废弃 raw Node gateway

**改动**:
- `apps/api/src/main.ts`: 移除 `USE_HONO` 条件分支，始终使用 Hono
- 删除 `apps/api/src/gateways/alpaca.ts` 中的 HTTP server 代码，仅保留 Alpaca API 客户端逻辑
- `apps/api/src/app/index.ts`: 如仅导出 `startGatewayServer`，则标记废弃或删除

**文件**:
- `apps/api/src/main.ts`
- `apps/api/src/gateways/alpaca.ts`
- `apps/api/src/app/index.ts`

**验证**: `npm run gateway` 启动正常，所有 API 端点可用

#### Commit 7.2 — 拆分 alpaca.ts (739 行 → 3 个模块)

**改动**:
- `apps/api/src/gateways/alpaca-client.ts`: Alpaca API 客户端（行情、下单、账户查询）
- `apps/api/src/gateways/alpaca-config.ts`: Alpaca 配置加载
- `apps/api/src/gateways/alpaca.ts`: 保留为 re-export barrel

**文件**:
- `apps/api/src/gateways/alpaca-client.ts` (新建)
- `apps/api/src/gateways/alpaca-config.ts` (新建)
- `apps/api/src/gateways/alpaca.ts` (重构)

**验证**: `npm run test:api && npm run typecheck`

#### Commit 7.3 — 路由全面迁移至 Hono

**改动**:
- 将所有 router 从 raw Node handler 迁移为 Hono router 格式
- 在 `hono-app.ts` 中统一挂载所有路由
- 删除旧的路由分发机制

**文件**:
- `apps/api/src/app/hono-app.ts`
- `apps/api/src/app/routes/routers/*.ts`

**验证**: `npm run gateway` + `npm run test:api`

---

### Phase 8: 前端性能 (P2)

#### Commit 8.1 — 页面级 code splitting

**改动**:
- `console.routes.tsx`: 每个路由组件改为 `React.lazy()` 导入
- 在 `<Routes>` 外层加 `<Suspense>` 带骨架屏 fallback
- 确认 `ExecutionPage.tsx` (130KB) 和 `SettingsPage.tsx` (70KB) 被独立 chunk

**文件**:
- `apps/web/src/modules/console/console.routes.tsx`
- `apps/web/src/components/layout/ConsoleChrome.tsx` (如需调整 Suspense 边界)

**验证**: `npm run build`，检查 dist 输出确认 chunk 拆分

#### Commit 8.2 — 轮询优化: SSE 优先 + 降频

**改动**:
- `TradingSystemProvider.tsx`: SSE 连接成功时暂停 polling，断开时恢复
- `VITE_REFRESH_MS` 默认值从 1800 改为 5000（SSE 覆盖实时推送，polling 仅作兜底）
- `runStateCycle` 增加 stale check: 如果 SSE 刚推送过，跳过本次 polling

**文件**:
- `apps/web/src/store/trading-system/TradingSystemProvider.tsx`
- `.env.example`

**验证**: 浏览器 DevTools Network 确认 SSE 连接时 polling 停止

---

### Phase 9: UI 布局优化 (P3)

#### Commit 9.1 — 全局布局: 主面板响应式 + 侧边栏改进

**改动**:
- `layout.css.ts`: 主面板 max-width 从 1480px 改为 1600px（更多数据展示空间）
- 侧边栏折叠态显示图标 tooltip（当前折叠后只有图标无提示）
- 全局 toolbar 高度统一为 48px，移动端 44px
- 720px 断点以下侧边栏默认折叠

**文件**:
- `apps/web/src/app/styles/layout.css.ts`
- `apps/web/src/components/layout/ConsoleChrome.tsx`
- `apps/web/src/components/layout/ConsoleChrome.css.ts`

**验证**: 浏览器响应式测试 1440px / 1024px / 768px / 375px

#### Commit 9.2 — OverviewPage: 信息密度提升

**改动**:
- 结果横幅区域: NAV / P&L / 持仓 / 信号 / 待审批 → 2 行 3 列网格（大屏），1 列堆叠（小屏）
- KPI 卡片统一高度，数值用 `--font-data` 等宽字体
- Agent 日报卡片: 折叠态只显示摘要行，展开显示详情
- 信号列表: 增加分数条可视化

**文件**:
- `apps/web/src/pages/console/routes/OverviewPage.tsx`
- `apps/web/src/pages/console/routes/OverviewPage.css.ts`

**验证**: 浏览器视觉检查

#### Commit 9.3 — SettingsPage: 分组折叠 + 表单优化

**改动**:
- 1827 行的 SettingsPage 拆分为独立 section 组件:
  - `SystemModeSection.tsx`
  - `AccountSection.tsx`
  - `AccessPolicySection.tsx`
  - `RiskParamsSection.tsx`
  - `IntegrationsSection.tsx`
  - `BrokerBindingsSection.tsx`
- 每个 section 可折叠，默认展开 SystemMode 和 RiskParams
- 表单输入统一宽度，label 位置一致

**文件**:
- `apps/web/src/pages/console/routes/SettingsPage.tsx` (重构)
- `apps/web/src/pages/console/routes/settings/*.tsx` (新建 6 个 section 组件)

**验证**: `npm run build && npm run typecheck`

#### Commit 9.4 — ExecutionPage: 布局重构

**改动**:
- 130KB 的 ExecutionPage 拆分为:
  - `ExecutionPlansPanel.tsx` — 执行计划列表
  - `ExecutionDetailPanel.tsx` — 选中项详情
  - `ExecutionAuditPanel.tsx` — 审计日志
  - `ExecutionWorkbench.tsx` — 工作台主布局
- 三栏布局: 左侧计划列表(300px) | 中间详情(flex) | 右侧审计(280px)
- 移动端: 堆叠布局，tab 切换

**文件**:
- `apps/web/src/pages/console/routes/ExecutionPage.tsx` (重构)
- `apps/web/src/pages/console/routes/execution/*.tsx` (新建 4 个组件)

**验证**: `npm run build && npm run typecheck`

---

### Phase 10: 代码精简 (P3)

#### Commit 10.1 — 删除冗余和死代码

**改动**:
- 删除未使用的路由别名（如果有不再需要的 redirect）
- 删除 `apps/api/src/modules/auth/` 中的 MFA 相关死代码（如果 Commit 6.1 未完全清理）
- 清理未使用的 CSS class（通过 Biome/ESLint dead code detection）
- 删除 `packages/shared-types/` 中未被引用的类型导出

**文件**: 视具体发现而定

**验证**: `npm run lint && npm run typecheck && npm run build`

#### Commit 10.2 — import 路径规范化

**改动**:
- `analysis-service.ts` 等文件中的深度相对路径 `../../../../../../packages/...` 改为 workspace alias
- 在 `tsconfig.json` 中配置 `@control-plane-runtime`, `@llm-provider` 等 path alias
- 全局替换相关 import

**文件**:
- `tsconfig.base.json` / `tsconfig.node.json`
- 受影响的 service 文件

**验证**: `npm run typecheck && npm run build`

---

### Phase 11: 前端补充 (P3)

#### Commit 11.1 — 全局错误边界 + 骨架屏

**改动**:
- 检查现有 `ErrorBoundary` 组件覆盖范围，确保每个页面级路由都有错误边界
- 为关键页面添加骨架屏:
  - OverviewPage: KPI 卡片骨架 + 图表骨架
  - MarketPage: 行情表骨架
  - AgentPage: 聊天区域骨架
- 网络错误时显示 retry 按钮而非空白页

**文件**:
- `apps/web/src/app/routes/AppRouter.tsx`
- `apps/web/src/components/Skeleton.tsx` (新建通用骨架组件)
- 各页面组件

**验证**: 浏览器断网测试 + 慢网络模拟

#### Commit 11.2 — 空状态统一 + 加载态优化

**改动**:
- 统一使用 `ConsoleChrome.EmptyState` 组件（已有）
- 各页面空数据态: icon + 中英文提示 + 引导操作按钮
- 加载态: 使用 Suspense fallback 替代自定义 loading state
- 错误态: 统一 ErrorCard 组件

**文件**:
- 各页面组件
- `apps/web/src/components/layout/ConsoleChrome.tsx` (EmptyState 已存在)

**验证**: 浏览器视觉检查

---

## 三、执行顺序与依赖关系

```
Phase 1 (安全) ──→ Phase 2 (类型) ──→ Phase 3 (日志)
                                      ↓
                               Phase 4 (测试)
                                      ↓
Phase 5 (持久化) ←── Phase 6 (配置)
                                      ↓
                               Phase 7 (Gateway)
                                      ↓
Phase 8 (前端性能) ──→ Phase 9 (UI布局) ──→ Phase 10 (精简) ──→ Phase 11 (补充)
```

**并行策略**:
- Phase 1-3 可交替进行（安全改动不阻塞类型清理）
- Phase 5-6 可并行（持久化和配置独立）
- Phase 8-11 可并行（前端改动互不依赖）

---

## 四、验证矩阵

每个提交完成后执行:

| 验证步骤 | 命令 |
|----------|------|
| 类型检查 | `npm run typecheck` |
| Lint | `npm run lint` |
| 后端测试 | `npm run test:api` |
| 引擎测试 | `npm run test:engine` |
| 控制面测试 | `npm run test:control-plane` |
| 前端测试 | `npm run test:web` |
| 构建 | `npm run build` |
| 完整验证 | `npm run verify` |

Phase 1-2 完成后: 全量 `npm run verify`
Phase 3-7 完成后: 全量 `npm run verify`
Phase 8-11 完成后: 全量 `npm run verify` + 手动浏览器测试

---

## 五、风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| @ts-nocheck 移除引入大量类型报错 | 逐文件处理，每个提交独立可验证 |
| hasPermission 改动影响现有 API 行为 | 先添加 auth 中间件，再修改 hasPermission，保持渐进式 |
| Gateway 统一可能导致路由遗漏 | 逐个路由迁移，每批跑完整测试 |
| 前端 code splitting 可能破坏动态 import | 构建后检查 chunk 输出，手动验证每个页面 |
| SettingsPage 拆分可能丢失状态 | 拆分时保持共享 state 在父组件，子组件通过 props 接收 |

---

## 六、不做的事

- **不上 OpenTelemetry 全套** — 结构化日志 + request-id 够用
- **不重构 SQLite schema** — 文档存储模式对当前规模够用
- **不引入 zod 做全量输入验证** — 仅用于 env 校验，路由层手动验证够用
- **不重写 i18n 系统** — 当前 `copy[locale]` 模式轻量够用
- **不引入 Redux/Zustand** — React Context + SSE 模式对当前规模合理
