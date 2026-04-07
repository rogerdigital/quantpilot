# QuantPilot 全面重构计划书

## 重构目标

| 目标 | 当前 | 预期结果 |
|---|---|---|
| TypeScript 占比 | 46.6% | ~97% |
| JavaScript 占比 | 50.6% | ~0% |
| CSS 占比 | 2.8% | ~1%（阶段一）→ 0%（阶段二） |
| 后端类型覆盖 | 0% | 渐进式提升，最终 strict |

---

## 技术决策

### JS → TS 核心方案

**运行时 loader：`tsx`**，不引入编译步骤，开发体验与现在相同。

```
当前：node apps/api/src/main.mjs
迁移后：node --import tsx/esm apps/api/src/main.ts
```

- 模块解析：`"NodeNext"`（`.ts` 源文件，import 写 `.js` 扩展名）
- 类型严格度：初期 `strict: false`，全量迁移完成后分批开严格模式
- 测试 runner：`node --import tsx/esm --test *.test.ts`
- 文件重命名规则：`.mjs` → `.ts`，import 路径 `'./foo.mjs'` → `'./foo.js'`

### CSS 核心方案

- **阶段一**：CSS Modules（`.module.css`），Vite 原生支持，零 runtime
- **阶段二**：Vanilla Extract（`.css.ts`），TypeScript 原生，CSS 占比归零

`style.css` 保留内容（约 350 行）：
- CSS Custom Properties（design tokens）
- Reset / base styles
- Animation keyframes
- 跨页面共享的设计系统原语（`panel`、`focus-row`、`hero-card` 等）

`.module.css` 承载内容（约 2600 行，拆到各组件）：
- 页面专属布局（`agent-*`、`overview-*`、`risk-*` 等约 120 个 class）
- 组件内部实现细节

---

## 文件规模总览

| 工作项 | 文件数 |
|---|---|
| 后端源文件（.mjs → .ts） | 144 个 |
| 后端测试文件（.mjs → .ts） | 17 个 |
| 脚本文件（scripts/*.mjs） | 7 个 |
| 前端 TSX/TS 文件 | 82 个（已是 TS，无需迁移） |
| CSS 页面专属 class（待拆） | ~120 个 |
| CSS 共享原语（留全局） | ~289 个 |

---

## 阶段划分与任务清单

---

### 阶段 A：TS 工具链搭建
> 前置条件：无。完成后所有后续 TS 迁移任务才能展开。

---

**A-1：安装 tsx，建根 tsconfig.node.json**

```
变更文件：
  package.json（devDependencies 加 tsx）
  tsconfig.node.json（新建，NodeNext 后端基础配置）

tsconfig.node.json 内容：
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": false,
    "noEmit": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  }
}

提交信息：chore: add tsx loader and tsconfig.node.json for backend TS migration
```

---

**A-2：更新所有 scripts 和 test runner**

```
变更文件：
  package.json（scripts 区域）

改动：
  "gateway": "node apps/api/src/main.mjs"
    → "node --import tsx/esm apps/api/src/main.ts"
  "worker": "node apps/worker/src/main.mjs"
    → "node --import tsx/esm apps/worker/src/main.ts"
  "test:api": "node --test apps/api/test/*.test.mjs"
    → "node --import tsx/esm --test apps/api/test/*.test.ts"
  "test:worker": "node --import tsx/esm --test apps/worker/test/*.test.ts"
  "test:engine": "node --import tsx/esm --test ..."
  "test:runtime": "node --import tsx/esm --test ..."
  "test:control-plane": "node --import tsx/esm --test ..."

注：此时源文件还是 .mjs，scripts 暂时不生效，等各包迁移后逐步切换
提交信息：chore: update scripts and test runners for tsx/esm loader
```

---

### 阶段 B：最小包迁移（4 commits）
> 优先迁移文件数最少的包，验证工具链，积累经验。

---

**B-1：迁移 packages/task-workflow-engine（1 个源文件 + 1 个测试）**

```
变更文件：
  packages/task-workflow-engine/src/index.mjs → index.ts
  packages/task-workflow-engine/test/index.test.mjs → index.test.ts
  packages/task-workflow-engine/package.json（加 tsconfig 引用）
  packages/task-workflow-engine/tsconfig.json（新建，extends tsconfig.node.json）

迁移步骤：
  1. 重命名文件
  2. import 路径后缀 .mjs → .js
  3. 为函数参数、返回值加基础类型注解
  4. 更新 package.json exports（.mjs → .js）

提交信息：feat(engine): migrate task-workflow-engine to TypeScript
```

---

**B-2：迁移 packages/control-plane-runtime（1 个源文件 + 1 个测试）**

```
变更文件：
  packages/control-plane-runtime/src/index.mjs → index.ts
  packages/control-plane-runtime/test/index.test.mjs → index.test.ts
  packages/control-plane-runtime/tsconfig.json（新建）

提交信息：feat(runtime): migrate control-plane-runtime to TypeScript
```

---

**B-3：迁移 packages/db（6 个源文件）**

```
变更文件：
  packages/db/src/*.mjs → *.ts（6 个文件）
  packages/db/tsconfig.json（新建）
  packages/db/package.json（更新 exports）

提交信息：feat(db): migrate db package to TypeScript
```

---

**B-4：迁移 scripts/（7 个脚本文件）**

```
变更文件：
  scripts/*.mjs → *.ts（7 个文件）
  package.json（scripts 里的 node scripts/xxx.mjs → node --import tsx/esm scripts/xxx.ts）

注：scripts 没有测试，迁移后运行 npm run check:workspaces 验证
提交信息：chore: migrate scripts to TypeScript
```

---

### 阶段 C：中等包迁移（2 commits）

---

**C-1：迁移 packages/trading-engine（15 个源文件）**

```
变更文件：
  packages/trading-engine/src/**/*.mjs → *.ts（15 个文件）
  packages/trading-engine/tsconfig.json（新建）
  packages/trading-engine/package.json（更新 exports）

子目录结构：
  src/strategy/*.mjs → *.ts
  src/execution/*.mjs → *.ts
  src/risk/*.mjs → *.ts
  src/runtime.mjs → runtime.ts（入口）

提交信息：feat(engine): migrate trading-engine to TypeScript
```

---

**C-2：迁移 packages/control-plane-store（37 个源文件 + 2 个测试）**

```
变更文件：
  packages/control-plane-store/src/**/*.mjs → *.ts（37 个文件）
  packages/control-plane-store/test/*.mjs → *.ts（2 个文件）
  packages/control-plane-store/tsconfig.json（新建）
  packages/control-plane-store/package.json（更新 exports）

建议按子目录分批 rename，一次提交：
  src/repositories/*.mjs → *.ts（~20 个文件）
  src/adapters/*.mjs → *.ts
  src/context.mjs → context.ts
  src/index.mjs → index.ts

提交信息：feat(store): migrate control-plane-store to TypeScript
```

---

### 阶段 D：Worker 迁移（2 commits）

---

**D-1：迁移 apps/worker/src（11 个源文件）**

```
变更文件：
  apps/worker/src/**/*.mjs → *.ts（11 个文件）
  apps/worker/tsconfig.json（新建，extends tsconfig.node.json）
  apps/worker/package.json

提交信息：feat(worker): migrate worker to TypeScript
```

---

**D-2：迁移 apps/worker/test（2 个测试文件）**

```
变更文件：
  apps/worker/test/*.test.mjs → *.test.ts（2 个文件）

验证：npm run test:worker 全部通过
提交信息：test(worker): migrate worker tests to TypeScript
```

---

### 阶段 E：API 迁移（4 commits）
> 最大工作量（73 源 + 11 测试），按目录分批提交。

---

**E-1：迁移 apps/api/src/domains/**（~30 个文件）**

```
变更文件：
  apps/api/src/domains/**/*.mjs → *.ts

目录结构：
  domains/agent/
  domains/execution/
  domains/research/
  domains/risk/
  domains/strategy/
  domains/backtest/

提交信息：feat(api): migrate api domain services to TypeScript
```

---

**E-2：迁移 apps/api/src/modules/**（~20 个文件）**

```
变更文件：
  apps/api/src/modules/**/*.mjs → *.ts

提交信息：feat(api): migrate api modules to TypeScript
```

---

**E-3：迁移 apps/api/src/app/** + gateways（~23 个文件）**

```
变更文件：
  apps/api/src/app/**/*.mjs → *.ts（routes, middleware, etc.）
  apps/api/src/gateways/*.mjs → *.ts
  apps/api/src/main.mjs → main.ts
  apps/api/tsconfig.json（新建）

提交信息：feat(api): migrate api gateway and app shell to TypeScript
```

---

**E-4：迁移 apps/api/test（11 个测试文件）**

```
变更文件：
  apps/api/test/*.test.mjs → *.test.ts（9 个测试 + 2 个 helper）

验证：npm run test:api 全部通过（134 个测试）
提交信息：test(api): migrate api tests to TypeScript
```

---

### 阶段 F：类型强化（3 commits）
> 全量迁移后，提升类型覆盖质量。

---

**F-1：为 shared-types 补充后端专用类型**

```
变更文件：
  packages/shared-types/src/trading.ts（补充后端业务类型）
  packages/shared-types/src/internal.ts（新建，内部服务类型）

内容：为 control-plane-store 仓储函数、API handler 补充参数/返回值类型
提交信息：feat(types): add backend domain types to shared-types
```

---

**F-2：为高频调用路径补充精确类型**

```
目标文件：
  packages/control-plane-runtime/src/index.ts
  apps/api/src/app/routes/*.ts
  apps/worker/src/tasks/*.ts

提交信息：refactor: add explicit types to high-traffic backend paths
```

---

**F-3：开启后端 noImplicitAny，修复所有隐式 any**

```
变更文件：
  tsconfig.node.json（"noImplicitAny": true）
  各后端文件（修复 TS 报错）

注：此步骤可能有较多改动，视实际报错量决定是否再拆分
提交信息：refactor: enable noImplicitAny across all backend packages
```

---

### 阶段 G：CSS 阶段一 — style.css 瘦身（2 commits）

---

**G-1：提取 design token 层，整理 style.css 结构**

```
变更文件：
  apps/web/src/app/styles/style.css（重新组织结构）

保留在 style.css：
  - Section 1: CSS Custom Properties（约 60 行）
  - Section 2: Reset / Base（约 30 行）
  - Section 3: Animation Keyframes（约 40 行）
  - Section 4: 跨页面共享设计原语
    panel / panel-grid / panel-head / panel-body
    focus-row / focus-list / focus-metric / symbol-cell
    hero-card / hero-grid / status-row / status-stack
    tab-panel / empty-state / field-label / badge-*
    （约 220 行）
  合计约 350 行

清除：
  - 页面专属 class 的占位注释和空行
  - 重复/冗余规则

提交信息：refactor(css): restructure style.css into design token and primitive layers
```

---

**G-2：建立 CSS Modules 基础设施**

```
变更文件：
  apps/web/src/app/styles/index.css（新建，只 @import design tokens）
  vite.config.ts（确认 CSS Modules 配置，Vite 默认支持无需改动）
  apps/web/src/components/layout/ConsoleChrome.module.css（新建，layout 样式）
  apps/web/src/components/layout/ConsoleChrome.tsx（使用 styles.xxx）

迁移的 class：
  .sidebar / .sidebar-nav / .topbar / .main-panel / .layout-shell
  .nav-item / .nav-icon / .console-logo

提交信息：feat(css): introduce CSS Modules for ConsoleChrome layout
```

---

### 阶段 H：CSS 阶段一 — 组件拆分（7 commits）

---

**H-1：AgentPage CSS Modules**

```
新建文件：apps/web/src/modules/agent/AgentPage.module.css
迁移 class（约 35 个）：
  agent-dual-view / agent-dialogue-stage / agent-chat-* 系列
  agent-insight-rail / agent-insight-card / agent-pulse-*
  agent-step-* / agent-handoff-* / agent-suggestion-*
  mode-stack / mode-pill / agent-stage-header

提交信息：refactor(css): extract AgentPage styles to CSS Module
```

---

**H-2：OverviewPage CSS Modules**

```
新建文件：apps/web/src/pages/console/routes/OverviewPage.module.css
迁移 class（约 20 个）：
  overview-hero-grid / overview-command-card / overview-kpi-card
  overview-desk-grid / overview-primary-panel / overview-side-panel
  overview-blotter-grid / overview-blotter-card / overview-blotter-list
  overview-ops-cluster / overview-inline-metrics / overview-inline-metric
  overview-panel-flow

提交信息：refactor(css): extract OverviewPage styles to CSS Module
```

---

**H-3：RiskPage CSS Modules**

```
新建文件：apps/web/src/pages/risk/RiskPage.module.css
迁移 class（约 15 个）：
  risk-timeline-* / risk-event-* 等页面专属样式

提交信息：refactor(css): extract RiskPage styles to CSS Module
```

---

**H-4：NotificationsPage CSS Modules**

```
新建文件：apps/web/src/pages/notifications/NotificationsPage.module.css
迁移 class（约 25 个）：
  incident-* / monitoring-* / notification-filter-* 等页面专属样式

提交信息：refactor(css): extract NotificationsPage styles to CSS Module
```

---

**H-5：Research / Backtest / Strategies / Execution 页面 CSS Modules**

```
新建文件：每个页面对应一个 .module.css
涉及页面：BacktestPage / StrategiesPage / ExecutionPage / ResearchPage

提交信息：refactor(css): extract research and execution page styles to CSS Modules
```

---

**H-6：SettingsPage CSS Modules**

```
新建文件：apps/web/src/pages/settings/SettingsPage.module.css
迁移 class：settings-* 系列中仅 settings 页面专属的部分

提交信息：refactor(css): extract SettingsPage styles to CSS Module
```

---

**H-7：删除 style.css 已迁移 class，验证无残留**

```
变更文件：apps/web/src/app/styles/style.css（删除已迁移的 class）
验证：
  npm run typecheck  → 无报错
  npm run test:web   → 62 个测试通过
  npm run build      → 生产构建成功，页面视觉无回归

提交信息：refactor(css): remove migrated classes from global style.css
```

---

### 阶段 I：CSS 阶段二 — Vanilla Extract（长期目标）
> 在阶段 H 完成后启动，可独立规划。

---

**I-1：安装 Vanilla Extract + Vite 插件**

```
npm install -D @vanilla-extract/css @vanilla-extract/vite-plugin
vite.config.ts 加入 vanillaExtractPlugin()

提交信息：chore: add vanilla-extract and vite plugin
```

---

**I-2 ~ I-N：逐组件将 .module.css → .css.ts**

```
每个组件一次提交，迁移顺序同阶段 H：
  ConsoleChrome.module.css → ConsoleChrome.css.ts
  AgentPage.module.css     → AgentPage.css.ts
  ...

最终：删除 style.css，全部 CSS 进入 TypeScript 体系
CSS 占比降至 0%，TS 占比进一步提升
```

---

## 提交总数预估

| 阶段 | commits |
|---|---|
| A 工具链 | 2 |
| B 最小包 | 4 |
| C 中等包 | 2 |
| D Worker | 2 |
| E API | 4 |
| F 类型强化 | 3 |
| G style.css 瘦身 | 2 |
| H CSS Modules | 7 |
| I Vanilla Extract | ~10 |
| **合计（阶段一完成）** | **~26** |
| **合计（阶段二完成）** | **~36** |

---

## 验证策略

每次提交前必须通过：
```bash
npm run typecheck    # 无 TS 错误
npm run test:web     # 62 个前端测试通过
npm run test:api     # 134 个 API 测试通过（阶段 E 后）
npm run test:worker  # 20 个 worker 测试通过（阶段 D 后）
npm run build        # 生产构建成功
```

完整验证（pre-push hook 自动运行）：
```bash
npm run verify
```

---

## 风险与注意事项

| 风险 | 说明 | 应对 |
|---|---|---|
| NodeNext import 路径 | `.mjs` → `.js` 后缀，所有 import 需同步修改 | 用 sed/正则批量替换，迁移后跑测试验证 |
| 测试快照 | `node --test` 测试依赖文件名，重命名后路径变 | 统一在 A-2 阶段更新 test scripts 里的 glob |
| CSS class 名 hash | CSS Modules 会给 class 加 hash，测试里的 class 断言会失效 | 检查 test:web 里是否有 class 断言，改为语义断言 |
| Vanilla Extract 范式跳跃 | .css.ts 写法与现有 CSS 差距大 | 阶段二可安排专项学习，不影响阶段一交付 |
| 类型噪音 | 初期大量 `any`，类型注解质量参差 | F 阶段统一清理，不阻塞迁移进度 |
