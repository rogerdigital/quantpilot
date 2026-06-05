# UI Design Overhaul Plan

> 基于前端巡检和设计审查，覆盖排版、可读性、一致性、信息层级、交互反馈和移动端体验的全面优化计划。

## 目标

将 QuantPilot 从"功能完整的工程原型"提升为"设计精良的专业级产品"，在不改变功能的前提下提升视觉品质和用户体验。

---

## Phase 1: Design Foundations (设计基础)

### PR 1.1: Typography System Cleanup

**目标**：建立严格的字体使用规则，解决 `--font-data` 滥用和中英混排问题。

#### 改动清单

1. **字体角色重新定义**
   - `--font-display` (Sora): 仅用于 h1、hero metric value
   - `--font-ui` (Inter): 所有 UI 文字 — 按钮、标签、描述、面板标题、中文内容
   - `--font-data` (JetBrains Mono): 仅限英文数字数据 — 价格、百分比、表格数字列、代码片段、英文 eyebrow uppercase 标签

2. **需要修改的文件**
   - `apps/web/src/app/styles/layout.css.ts` — `.eyebrow` font 改为条件：英文保持 `--font-data`，取消对面板标题的 mono 应用
   - `apps/web/src/app/styles/panels.css.ts` — `.metric-card span` (label) 改为 `--font-ui`
   - `apps/web/src/app/styles/tables.css.ts` — `th` 改为 `--font-ui` + 600 weight
   - `apps/web/src/pages/trading/TradingPage.css.ts` — 按钮相关 class 的 fontFamily 改为 `--font-ui`
   - `apps/web/src/components/trading/QuickOrderBar.tsx` — inline style 中按钮 fontFamily 改为 `--font-ui`
   - `apps/web/src/app/styles/settings.css.ts` — `.mode-pill` 保持 `--font-data` (纯英文 uppercase)
   - `apps/web/src/components/layout/ConsoleChrome.css.ts` — `bottomNavItem` fontFamily 改为 `--font-ui`

3. **中文 fallback 优化**
   - `--font-display` 的 fallback 调整为: `"Sora", "Inter", "Noto Sans SC", "PingFang SC", sans-serif` — 加入 Inter 作为 h1 中英混排的过渡

---

### PR 1.2: Type Scale Standardization

**目标**：建立规则的字号谱系，消除任意字号。

#### Type Scale 定义

```
11px — xs (最小可用字号，替代当前 10px)
13px — sm (表格数据、辅助信息)
15px — md (正文、按钮)
18px — lg (面板标题)
22px — xl (section heading、重要 metric)
28px — 2xl (hero secondary)
36px — 3xl (h1 max)
52px — hero (旗舰数字)
```

#### 改动清单

1. **新增 token** — 在 `theme.css.ts` 中添加 `--text-xs` 到 `--text-hero` CSS variables
2. **最小字号 10→11px** — 全局搜索 `fontSize: '10px'` 和 `font:.*10px`，逐一替换为 11px
   - `panels.css.ts` — `.metric-card span`, `.overview-stat span`, `.overview-brief-card span`
   - `tables.css.ts` — `th` (10px → 11px)
   - `layout.css.ts` — `.eyebrow`
   - `ConsoleChrome.css.ts` — `bottomNavItem` (9px → 11px)
   - `TradingPage.css.ts` — `tradePanelTitle`, `tradeInputLabel`, `chartTimeframeBtn`, `watchlistHead`, 所有 10px 实例
3. **描述文本宽度限制** — 为面板内描述 copy 添加 `max-width: 560px`
   - `.status-copy`, `.mini-copy`, panel 内的 `<p>` 描述

---

### PR 1.3: Spacing Grid Alignment

**目标**：将所有间距值对齐到 4px grid 或现有 spacing scale。

#### 替换规则

| 当前值 | 替换为 | 对应 token |
|--------|--------|-----------|
| 14px gap | 16px | space-4 |
| 22px padding | 20px | space-5 |
| 28px marginTop | 32px | space-7 |
| 18px marginTop | 20px | space-5 |

#### 改动清单

1. `panels.css.ts`:
   - `.metrics-grid` gap 14px → 16px
   - `.hero-grid` marginTop 28px → 32px
   - `.panel-grid` marginTop 28px → 32px
   - `.terminal-strip` gap 14px → 16px, marginTop 24px (已对齐 space-6 ✅)
   - `.metric-card` padding 14px 16px → 16px (统一)
   - `.hero-card` padding 22px → 24px (space-6)
   - `.overview-kpi-title` marginTop 不变 (8px ✅)

2. `layout.css.ts`:
   - `.topbar` padding `22px 24px 18px` → `24px 24px 20px`
   - `.mode-stack` marginTop 14px → 16px

3. `tables.css.ts`:
   - `.focus-row` gap 12px ✅
   - `.log-item` gap 12px ✅

---

### PR 1.4: Color Contrast & Muted Text Enhancement

**目标**：提升小字号文字的对比度，达到 WCAG AA 4.5:1。

#### 改动清单

1. **暗色模式** `theme.css.ts`:
   - `--muted`: `#9ca3af` → `#a1a8b4` (提升到 4.8:1 on `--panel`)
   - 新增 `--muted-data`: `#8b95a5` — 专用于大字号数据标签（18px+ 只需 3:1）

2. **所有 10→11px 的元素** (已在 PR 1.2 处理字号) 同时将 color 从 `--muted` 改为 `--muted-strong` (#d1d5db):
   - eyebrow labels
   - 表头 th
   - metric card label span
   - stat labels

---

## Phase 2: Component Consistency (组件一致性)

### PR 2.1: Badge System Unification

**目标**：将 5+ 种 badge 风格收敛为 3 种标准形态。

#### Badge 形态定义

1. **StatusDot** — 圆点 + 文字，用于连接/运行状态
   - 样式: 8px 圆点 (绿/红/amber) + 12px text
   - 使用场景: toolbar "行情源 在线", "Broker 在线"

2. **LabelBadge** — 灰框 uppercase，用于分类标签
   - 样式: padding 5px 10px, border 1px solid var(--line), radius-sm, font-data 10px uppercase
   - 使用场景: "MARKET", "SIGNAL", "PARAMS", "EXECUTION", "BACKTEST", "LOCAL"

3. **ValueBadge** — 带色背景，用于动态值/状态
   - 变体: accent (紫), success (绿), warning (amber), danger (红), neutral (灰)
   - 样式: padding 5px 12px, background: semantic-color 8%, color: semantic-color, border 1px solid semantic-color 15%, radius-sm
   - 使用场景: "自动", "正常", "启动中", "healthy", "在线"

#### 改动清单

1. 新建 `apps/web/src/components/common/Badge.tsx` — 导出 `StatusDot`, `LabelBadge`, `ValueBadge`
2. 新建 `apps/web/src/components/common/Badge.css.ts` — 统一样式
3. 逐页替换 inline badge 实现:
   - `ConsoleChrome.tsx` — toolbar status pills → `StatusDot`
   - 各 Page 的 panel header badge → `LabelBadge`
   - TopMeta 中的 "正常/启动中/自动" → `ValueBadge`
4. 删除 `panels.css.ts` 和 `tables.css.ts` 中分散的 badge 样式 (`.panel-badge`, `.badge-*`)，统一到新文件

---

### PR 2.2: Panel Header Standardization

**目标**：定义 2 种标准面板头部，消除临时组合。

#### 组件定义

1. **PanelHeader** — 完整头部
   ```tsx
   <PanelHeader
     title="监控列表"
     badge={<LabelBadge>10 SYMBOLS</LabelBadge>}
     description="查看价格、评分和当前决策方向。"
   />
   ```
   - 样式: title 18px font-display 700 + optional badge right-aligned + optional description 13px muted max-w-560

2. **PanelHeaderCompact** — 紧凑头部
   ```tsx
   <PanelHeaderCompact title="下单" />
   ```
   - 样式: title 11px font-data uppercase letterSpacing 0.12em, paddingBottom 12px, borderBottom

#### 改动清单

1. 新建 `apps/web/src/components/common/PanelHeader.tsx`
2. 新建 `apps/web/src/components/common/PanelHeader.css.ts`
3. 逐页替换（分批）:
   - Batch A: Dashboard (OverviewPage) — 6 个面板头部
   - Batch B: Market + Strategies — 4 个
   - Batch C: Backtest + Risk + Execution — 6 个
   - Batch D: Settings + Trading — 4 个

---

### PR 2.3: Border Radius Nesting Rules

**目标**：建立嵌套圆角递减规则。

#### 规则

- 页面级容器 (topbar): `--radius-xl` (18px)
- 面板级 (.panel, .hero-card): `--radius-lg` (14px)
- 内部元素 (metric-card, table-wrap, input): `--radius` (10px)
- 最小元素 (badge, button, pill): `--radius-sm` (6px)

#### 改动清单

1. 审查并修复不符合规则的 radius 使用：
   - signal tag / badge 使用 radius-sm ✅
   - `metric-card` 当前 `--radius` (10px) — 在 panel (14px) 内 ✅
   - `tab-panel-tab` 当前无 radius — 保持
   - `.inline-action` 当前 `--radius-sm` ✅

---

## Phase 3: Visual Hierarchy (视觉层级)

### PR 3.1: Hero Metric Emphasis

**目标**：每页定义一个视觉主角，打破所有面板等权重的问题。

#### 改动清单

1. **Dashboard (OverviewPage)**:
   - 总资产 "¥236,229" 放大为 hero-level (52→64px)，加 subtle text-shadow
   - 其他两个 KPI (盈亏%, 持仓数) 缩小为 22px 辅助行
   - 三个 hero-card 改为 1+2 布局：主卡 60% 宽度，右侧两个 stack

2. **Risk 页**:
   - "组合风险 healthy" 升级为 hero card with colored left bar
   - 其余 7 个 metric tile 缩为 2 行 4 列 compact 卡片

3. **Execution 页**:
   - 上方空白区域压缩 — 日志面板在无大量日志时减小 minHeight
   - 数据面板加 `minHeight: 0` 让内容决定高度

4. **Trading 页**:
   - Header 的 symbol + price 已经是主角 ✅ 无需调整

---

### PR 3.2: Empty State & Skeleton Design

**目标**：空数据不再显示空白/黑洞，提供占位视觉。

#### 改动清单

1. **Chart 空状态**:
   - 新建 `apps/web/src/components/charts/ChartSkeleton.tsx`
   - 显示 animated gradient pulse 模拟 K 线/折线轮廓
   - 在 Market, Strategies, Trading 的 chart panel 中使用

2. **表格空状态**:
   - 已有 `EmptyState` 组件 ✅ 检查所有表格是否正确使用
   - 表格加载中状态: 3 行 skeleton rows with pulse animation

3. **面板空状态**:
   - "STRATEGY REGISTRY" 等内容为空的面板使用虚线边框 + 40% opacity
   - CSS: `.panel-empty { border-style: dashed; opacity: 0.6; }`

4. **Skeleton token** — 在 `animations.css.ts` 添加:
   ```css
   @keyframes skeleton-pulse {
     0%, 100% { opacity: 0.4; }
     50% { opacity: 0.15; }
   }
   ```

---

### PR 3.3: Color Depth Enhancement

**目标**：丰富色彩层次，引入 amber/warning，为 hero 添加深度。

#### 改动清单

1. **新增色彩 token** — `theme.css.ts`:
   - `--warning`: amber 色用于"需注意"状态 (已有 `--hold` #fbbf24 可复用)
   - `--accent-subtle`: `rgba(99, 102, 241, 0.06)` — 用于 hover/active 背景
   - `--gradient-hero`: subtle radial gradient for hero cards

2. **应用场景**:
   - 待审批/需注意的 badge → amber ValueBadge
   - Dashboard hero card → `background: linear-gradient(135deg, var(--panel) 0%, var(--panel-frame) 100%)`
   - Risk "NORMAL" → green ValueBadge with success variant
   - Execution "启动中" → accent ValueBadge

---

## Phase 4: Interaction & Feedback (交互反馈)

### PR 4.1: Hover & Active States Refinement

**目标**：提升交互反馈质感。

#### 改动清单

1. **面板 hover**:
   - 现有: `borderColor: var(--line-strong), boxShadow: var(--shadow-panel-hover)`
   - 优化: 添加 `transform: translateY(-1px)` + 增强 shadow 到 `0 8px 24px rgba(0,0,0,0.12)`
   - 文件: `panels.css.ts` — `.panel:hover`

2. **表格行 hover**:
   - 移除 `transform: translateX(2px)` (在数据密集表中 jarring)
   - 保留 background 变化 + 左侧 accent bar 渐显 (opacity 0→0.8)
   - 文件: `tables.css.ts` — `.focus-row:hover`

3. **按钮 press state**:
   - 所有按钮 `:active` 添加 `transform: scale(0.97)` (部分已有)
   - 统一检查 `.inline-action`, `.settings-button`, `.mode-pill`, toolbar buttons

4. **Loading skeleton** — 通用 skeleton class:
   ```css
   .skeleton {
     background: linear-gradient(90deg, var(--panel-2) 25%, var(--panel-3) 50%, var(--panel-2) 75%);
     background-size: 200% 100%;
     animation: skeleton-sweep 1.5s ease infinite;
     border-radius: var(--radius-sm);
   }
   ```

---

### PR 4.2: Navigation Enhancement

**目标**：强化侧栏当前位置感知 + route badges。

#### 改动清单

1. **Active state 强化** — `ConsoleChrome.css.ts`:
   - 现有: accent 色文字
   - 添加: left 3px accent bar + `background: rgba(99, 102, 241, 0.06)` + `border-radius: var(--radius)`

2. **Route badges**:
   - 在 `listSidebarRoutes()` 返回值中支持 optional `badge` 字段
   - Execution: 显示待审批数
   - Risk: 显示风险级别 (normal/warning/critical)
   - 实现: 小圆点或数字 badge 在 nav item 右侧

3. **侧栏底部系统摘要**:
   - 添加 compact status strip 在侧栏底部 (固定位置)
   - 显示: 连接状态圆点 + 风险级别 + 模式 (auto/manual)
   - 尺寸: 高度 40px, font 11px

---

### PR 4.3: Toolbar Simplification

**目标**：顶部 toolbar 精简，腾出空间给核心操作。

#### 改动清单

1. **现有内容处理**:
   - "行情源 在线" + "Broker 在线" → 缩小为 StatusDot 组件，移到 toolbar 右侧
   - 语言切换 → 移入 Settings 页或侧栏底部（减少顶栏噪音）
   - 暗色模式切换 → 保留在右上角

2. **新增内容**:
   - 左侧: 面包屑或当前 desk 名称（从 page topbar 复用 eyebrow）
   - 中间: 全局搜索入口 (Cmd+K) — 已有 CommandPalette 组件，增加 toolbar trigger

3. **文件**:
   - `ConsoleChrome.tsx` — GlobalToolbar 组件重构
   - `ConsoleChrome.css.ts` — toolbar 样式调整

---

## Phase 5: Data Readability (数据可读性)

### PR 5.1: Table Enhancement

**目标**：提升数据表格的可读性和扫描效率。

#### 改动清单

1. **Zebra striping**:
   ```css
   .table-wrap tr:nth-child(even) td {
     background: rgba(34, 38, 58, 0.3); /* --panel-2 at 30% */
   }
   ```

2. **列对齐规则**:
   - 数字列 (价格、涨跌、评分): `text-align: right`
   - 文字列 (股票名、信号、动作): `text-align: left`
   - 文件: `ConsoleTables.tsx` — 修改 `<th>` 和 `<td>` 的 align
   - `tables.css.ts` — 新增 `.td-numeric { text-align: right; }`

3. **表头增强**:
   - 字号 10→11px (PR 1.2 已处理)
   - 加固定 sticky top (在 scroll 场景中保持表头可见)
   - `th { position: sticky; top: 0; z-index: 1; }`

4. **行高调整**:
   - `td` padding: `11px 12px` → `12px 14px` (稍增呼吸感)

---

### PR 5.2: Number Formatting & Display

**目标**：大数字可读性优化。

#### 改动清单

1. **Y 轴数字格式**:
   - 金额 > 10000: 显示为 "¥15.0万" 或 "150K"
   - 文件: `apps/web/src/modules/console/console.utils.ts` — `fmtCurrency` 函数添加 compact 模式
   - 图表 Y 轴 formatter 使用 compact 模式

2. **中英混排数字间距**:
   - 中文与数字之间自动加 thin space (U+2009) 或通过 CSS `word-spacing`
   - 主要在描述性文案中应用

---

### PR 5.3: Trading Page Density Optimization

**目标**：优化 Trading 页三栏布局的信息密度。

#### 改动清单

1. **Watchlist 行高**:
   - `watchlistItem` padding: `10px 14px` → `12px 14px` (+4px 总高)
   - active item: 加 subtle accent glow (`box-shadow: inset 3px 0 0 var(--accent)` 替代整行背景)

2. **Order panel 分区**:
   - 表单区 (type tabs + inputs) / 按钮区 / 信息区之间加 `16px gap + 1px border`
   - `tradePanel` 内部用 section divider 分隔

3. **Header stats 降级**:
   - `tradingHeaderStats` 的 5 个指标视觉权重降低
   - 字号从 13px → 12px，gap 从 24px → 16px
   - 或移入 chart panel 头部作为 inline metadata

---

## Phase 6: Settings & Specialized Pages

### PR 6.1: Settings Page Restructure

**目标**：按功能分组，提升设置页可用性。

#### 改动清单

1. **Tab 分组**:
   - 系统 (模式切换、引擎开关)
   - 账户 (个人资料、邮箱、角色)
   - 安全 (权限、访问策略)
   - 高级 (风控参数、Agent Governance)

2. **引擎开关区域**:
   - 改为 switch 组件 + 状态指示灯 (绿点/灰点)
   - 替代当前 checkbox 样式

3. **账户信息**:
   - 改为 profile card 布局 (avatar placeholder + name + role badge)
   - 不再是 key-value 表格

---

## Phase 7: Mobile Polish

### PR 7.1: Mobile-Specific Refinements

**目标**：在已修复的响应式基础上进一步优化移动端体验。

#### 改动清单

1. **移动端字号调整** (≤640px):
   - h1: max 28px (不再到 36px)
   - hero-value: max 36px (不再到 52px)
   - 面板 padding: 16px (从 20px 缩减)

2. **移动端面板间距**:
   - grid gap: 12px (从 16px)
   - section marginTop: 20px (从 32px)

3. **触摸目标**:
   - 所有可点击元素最小 44×44px 触摸区域
   - bottomNavItem: 确保高度 ≥44px ✅ (当前 56px nav / 8 items)
   - 表格行 action 按钮: padding 增加到至少 8px 12px

4. **底部导航视觉增强**:
   - Active item 加 top 2px accent bar (在底部导航上方)
   - 添加 subtle backdrop-filter blur 到底部导航背景

---

## Commit Strategy (提交策略)

### 分支命名

```
design/phase-1-typography       (PR 1.1 + 1.2 + 1.3 + 1.4)
design/phase-2-components       (PR 2.1 + 2.2 + 2.3)
design/phase-3-hierarchy        (PR 3.1 + 3.2 + 3.3)
design/phase-4-interaction      (PR 4.1 + 4.2 + 4.3)
design/phase-5-readability      (PR 5.1 + 5.2 + 5.3)
design/phase-6-settings         (PR 6.1)
design/phase-7-mobile           (PR 7.1)
```

### 提交粒度

每个 PR 编号对应一个 commit。每个 Phase 合为一个 PR 提交到 main。

### 执行顺序与依赖

```
Phase 1 (无依赖) ─────────────────────────────────────────────────
   │
Phase 2 (依赖 Phase 1 的字体/字号变更) ────────────────────────────
   │
Phase 3 (依赖 Phase 2 的组件) ─────── Phase 4 (可与 Phase 3 并行)
   │                                      │
Phase 5 (依赖 Phase 1+2) ─────────────────┘
   │
Phase 6 (依赖 Phase 2 组件) ──── Phase 7 (可与 Phase 6 并行)
```

---

## Verification Checklist (验证清单)

每个 Phase PR 合并前需通过:

- [ ] `npm run typecheck` 无新错误
- [ ] `npm run build` 成功
- [ ] `npm run verify` 完整通过
- [ ] 桌面 1440px: 所有 8 路由视觉回归检查
- [ ] 移动 390px: 所有路由无溢出 + 单列布局正确
- [ ] 对比度: 最小文字在暗色面板上 ≥4.5:1 (WCAG AA)
- [ ] 无功能性回归 (按钮可点击、表格可滚动、导航正常)

---

## Success Metrics (成功指标)

| 指标 | 当前 | 目标 |
|------|------|------|
| 字体族使用一致性 | 3 种混用 | 每种有明确职责 |
| 最小字号 | 9-10px | 11px |
| 间距 off-grid 值 | 12+ 处 | 0 |
| Badge 样式变体 | 5+ 种 | 3 种标准 |
| 面板头部模式 | 4+ 种 | 2 种标准 |
| 表格列对齐 | 全部左对齐 | 数字右对齐 |
| 空状态处理 | 黑洞/空白 | Skeleton + placeholder |
| 对比度最低值 | 4.2:1 (10px muted) | ≥4.5:1 (11px muted-strong) |
| 移动端不可达路由 | 3 个 | 0 |
