# QuantPilot 全面改造计划

> 分支：`feat/platform-overhaul`
> 目标：将 QuantPilot 从功能 demo 改造为真实可用的 AI-native 个人量化交易协作平台

---

## 产品方向确认

| 维度 | 决策 |
|------|------|
| 用户定位 | 个人用户，无需专业量化/交易知识，依赖 Agent 辅助决策 |
| Agent 定位 | 核心价值，真实 LLM 驱动决策和自主执行 |
| 交互主线 | 自然语言描述策略 → LLM 分析 → 可操作建议 → 执行 |
| 结果呈现 | 收益/结果为主视图，图表醒目直接 |
| LLM | Claude API + OpenAI 双支持，Settings 可切换 |
| Broker | Alpaca（Paper 全自动，Live 必须手动审批） |
| 市场数据 | Alpaca Market Data API（替换 mock 数据） |
| 资产类型 | 美股（US Stocks） |
| UI 风格 | 全面重设计，轻量消费级但专业 |
| 风控 | 默认仓位占比 5% + 日亏损 5% 止停，用户可在 Settings 自定义 |

---

## 改造优先级总览

### P0 — 核心价值补全（Agent + LLM + 数据真实化）
- [ ] P0-1: LLM Provider 抽象层（Claude / OpenAI 双支持，可切换）
- [ ] P0-2: Agent 意图理解 → LLM 驱动重写（intent-service）
- [ ] P0-3: Agent 规划 → LLM 驱动重写（planning-service）
- [ ] P0-4: Agent 分析 → LLM 驱动重写（analysis-service，工具调用）
- [ ] P0-5: Agent 写操作 Tools 扩展（执行、下单）
- [ ] P0-6: Alpaca Market Data API 集成（替换合成 OHLCV 数据）
- [ ] P0-7: 回测引擎对接真实历史数据（移除 mock metrics）

### P1 — Agent 页面完全重设计
- [ ] P1-1: Agent 页面架构重设计（三步主流程：自然语言 → 分析 → 操作建议）
- [ ] P1-2: 策略建议卡片（Insight Card）设计和实现
- [ ] P1-3: 执行路径 UI（一键下单 / 发起审批）
- [ ] P1-4: Agent 会话历史和策略管理

### P1 — 风控体系
- [ ] P1-5: 默认风控规则实现（仓位占比 5%、日亏损 5% 止停）
- [ ] P1-6: Live 下单手动审批强制流程
- [ ] P1-7: Settings 风控参数自定义面板

### P2 — Dashboard 全面重设计
- [ ] P2-1: Dashboard 以收益结果为主视图重设计
- [ ] P2-2: 权益曲线图表增强（基准对比、信号标注）
- [ ] P2-3: KPI 卡片醒目化（字号、对比度、颜色编码）

### P2 — UI 整体风格重设计
- [ ] P2-4: 设计系统重建（颜色系统、字体、间距、组件库）
- [ ] P2-5: 导航栏/侧边栏重设计
- [ ] P2-6: 表格和列表组件现代化
- [ ] P2-7: 图表增强（技术指标、信号箭头）

### P2 — 状态管理迁移
- [ ] P2-8: Zustand 替换 React Context（TradingSystemProvider 拆分）

### P3 — 交互体验提升
- [ ] P3-1: 全局 Command Palette（/ 快捷键）
- [ ] P3-2: 全局审批抽屉（任何页面触发）
- [ ] P3-3: 操作反馈体系（Toast + 确认弹窗 + Loading 状态）
- [ ] P3-4: 键盘导航（表格 j/k，Enter 展开，Esc 关闭）

### P3 — 代码质量
- [ ] P3-5: shared-types 按领域拆分
- [ ] P3-6: mock 数据统一标记和清理
- [ ] P3-7: 统一 API 错误模型

---

## 详细规划

### P0-1: LLM Provider 抽象层

**目标**：在后端建立可插拔的 LLM Provider 接口，支持 Claude API 和 OpenAI，通过环境变量或 Settings 切换。

**技术方案**：
```
packages/llm-provider/        新包
  src/
    types.ts                  LLMMessage, LLMTool, LLMResponse 接口定义
    provider.ts               LLMProvider 抽象接口
    claude-provider.ts        Claude API 实现（@anthropic-ai/sdk）
    openai-provider.ts        OpenAI 实现（openai SDK）
    factory.ts                根据 env QUANTPILOT_LLM_PROVIDER 构造
    index.ts                  导出
```

**接口设计**：
```typescript
interface LLMProvider {
  chat(messages: LLMMessage[], options?: ChatOptions): Promise<LLMResponse>;
  chatWithTools(messages: LLMMessage[], tools: LLMTool[], options?: ChatOptions): Promise<LLMToolResponse>;
  model: string;
  provider: 'claude' | 'openai';
}
```

**环境变量**：
- `QUANTPILOT_LLM_PROVIDER=claude|openai`
- `ANTHROPIC_API_KEY=...`
- `OPENAI_API_KEY=...`
- `QUANTPILOT_LLM_MODEL=...`（可选，默认 claude-sonnet-4-6）

**验证**：`packages/llm-provider/src/__tests__/` 单元测试（mock HTTP 调用）

---

### P0-2: Agent 意图理解 → LLM 重写（intent-service）

**目标**：用 LLM 替换正则关键词匹配，理解用户自然语言输入，提取结构化意图。

**当前问题**：`parseAgentIntent` 用正则匹配 `risk/risk_explanation/backtest` 等关键词，无法理解复杂自然语言。

**改造方案**：
1. 构建 system prompt：描述可用意图类型（request_execution_prep / request_backtest_review / request_risk_explanation / general_analysis / build_strategy / execute_trade）
2. 新增意图类型 `build_strategy`（自然语言构建策略）和 `execute_trade`（触发自主交易）
3. LLM 以 JSON 格式返回结构化 intent：kind / targetType / targetId / urgency / requiresApproval / requestedMode / extractedStrategy

**System Prompt 设计**：
- 角色：量化交易分析助手
- 可用意图类型说明
- 输出格式：JSON schema
- 示例对话（few-shot）

**Fallback**：LLM 调用失败时回退到规则引擎（保持现有逻辑作为 fallback）

---

### P0-3: Agent 规划 → LLM 重写（planning-service）

**目标**：用 LLM 生成动态 plan steps，而非硬编码 switch-case。

**改造方案**：
1. LLM 根据解析出的 intent，结合可用 tools 清单，生成执行步骤列表
2. 每个 step 包含：description / toolName / toolParams / expectedOutput
3. LLM 以 JSON array 返回 steps

**可用 Tools 清单注入到 Prompt**：
- 只读类：strategy.catalog.list / backtest.summary.get / risk.events.list / market.quotes.get / market.history.get（新增）
- 写操作类：execution.create / order.submit（需权限且需审批）

---

### P0-4: Agent 分析 → LLM 驱动重写（analysis-service）

**目标**：LLM 基于工具调用结果进行真实推理，生成结构化分析报告。

**改造方案**：

Phase 1（工具调用循环）：
1. 将用户意图 + plan + 工具结果注入到 LLM 上下文
2. LLM 使用 function calling / tool use 按需调用数据工具
3. 循环直到 LLM 决定停止调用工具

Phase 2（报告生成）：
1. LLM 基于所有工具结果，生成结构化报告
2. 输出格式：
   ```typescript
   interface AnalysisReport {
     thesis: string;          // 一句话核心结论
     rationale: string[];     // 支撑论点（3-5 条）
     warnings: string[];      // 风险警告
     strategy?: {             // 如果是 build_strategy 意图
       name: string;
       description: string;
       signals: string[];
       riskLevel: 'low' | 'medium' | 'high';
       suggestedPositionSize: number;  // 占比 %
       symbols: string[];
     };
     recommendedNextStep: string;
     requiresAction: boolean;
     actionType?: 'paper_trade' | 'live_trade_request' | 'backtest_request';
   }
   ```

---

### P0-5: Agent 写操作 Tools 扩展

**目标**：让 LLM 具备触发交易的能力（Paper 自动执行，Live 需审批）。

**新增 Tools**：

`execution.paper.submit`：提交 paper trading 订单
- 参数：symbol / side (buy|sell) / qty / orderType / price?
- Paper 模式：LLM 调用后直接执行，无需审批
- 返回：order confirmation

`execution.live.request`：请求 live trading 审批
- 参数：同上 + rationale（LLM 的决策理由）
- 触发 operator 审批工作流
- 返回：approval request ID

`strategy.backtest.queue`：队列一个新的回测任务
- 参数：strategyDescription / symbols / dateRange / initialCapital
- LLM 构建策略后可直接触发回测

**安全边界**：
- Paper 写操作：所有治理模式下均可（full_auto / bounded_auto）
- Live 写操作：仅 full_auto / ask_first，且必须走审批流

---

### P0-6: Alpaca Market Data API 集成

**目标**：用真实历史和实时数据替换合成价格数据。

**改造范围**：
1. `apps/api/src/gateways/alpaca.ts` 扩展市场数据方法：
   - `getHistoricalBars(symbol, timeframe, start, end)` → Alpaca `/v2/stocks/{symbol}/bars`
   - `getLatestBars(symbols)` → Alpaca `/v2/stocks/bars/latest`
   - `getMultiBars(symbols, timeframe, start, end)`
2. Worker `runSchedulerTickTask` 中市场数据获取从 gateway 读取，替换 `generateSyntheticQuotes`
3. `packages/trading-engine/src/backtest/data.ts` 中 `generateHistoricalOhlcv` 改为调用 Alpaca API

**注意**：Alpaca Paper Trading 账户包含免费市场数据订阅，不需要额外付费。

---

### P0-7: 回测引擎真实数据对接

**目标**：回测使用真实历史价格数据，指标计算结果真实可信。

**改造范围**：
1. `packages/task-workflow-engine/src/index.ts` 中 `executeBacktestWorkflow` 走真实引擎路径，移除 `buildMockBacktestMetrics` 调用
2. `packages/trading-engine/src/backtest/engine.ts` 中 `BacktestEngine.run()` 使用从 Alpaca 获取的真实 OHLCV 数据
3. 保留 mock 路径作为 `QUANTPILOT_USE_MOCK_DATA=true` 的开关（用于 CI 测试）

---

### P1-1: Agent 页面完全重设计

**目标**：重新设计 Agent 页面，以「自然语言 → 分析 → 可操作建议」三步为主交互主线。

**新页面布局**：

```
┌─────────────────────────────────────────────────────────┐
│  Agent 工作台                              [历史会话 ▼]   │
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│  左侧：对话 + 输入区   │  右侧：分析结果主视图             │
│                      │                                  │
│  [当前会话消息列表]    │  ┌─ 核心结论 ──────────────────┐ │
│                      │  │  [一句话 thesis，大字号]      │ │
│                      │  └─────────────────────────────┘ │
│  [用户输入框]         │  ┌─ 策略详情 ──────────────────┐ │
│  "我想买入科技股..."  │  │  Symbol / 仓位 / 方向        │ │
│                      │  │  风险评级 / 建议持仓时长      │ │
│  [发送 / 快捷策略建议] │  └─────────────────────────────┘ │
│                      │  ┌─ 支撑依据 ──────────────────┐ │
│                      │  │  ① 理由一                   │ │
│                      │  │  ② 理由二                   │ │
│                      │  │  ⚠ 风险警告                 │ │
│                      │  └─────────────────────────────┘ │
│                      │  ┌─ 执行操作 ──────────────────┐ │
│                      │  │  [Paper 执行] [申请 Live]   │ │
│                      │  │  [加入回测队列]              │ │
│                      │  └─────────────────────────────┘ │
└──────────────────────┴──────────────────────────────────┘
```

**关键 UI 元素**：
- 快捷策略建议（预设 prompt chips）：「分析当前市场走势」「推荐本周机会」「评估我的持仓风险」
- 分析进度展示（步骤 indicator）：理解中 → 分析中 → 生成建议
- 策略卡片：symbol tags / 方向 badge / 仓位占比 / 风险等级
- 执行按钮：Paper（绿，立即执行）/ Live（橙，需审批）/ 回测（蓝，入队）

---

### P1-5: 风控体系

**默认规则**（开箱即用）：
- 单笔仓位占比上限：总资产 5%
- 当日最大亏损：总资产 5%（触发后 Agent 自动停止当日所有交易）
- Live 下单：必须经过 operator 手动审批
- Paper 下单：全自动执行

**实现位置**：
1. `packages/trading-engine/src/risk/` 新增 `risk-guards.ts`
   - `checkPositionSizeLimit(account, symbol, qty, price)`
   - `checkDailyLossLimit(account, dailyPnL)`
2. `packages/control-plane-runtime/src/` 风控检查注入执行路径
3. Agent 调用 `execution.paper.submit` 前自动运行风控检查，拦截超限操作

**Settings 自定义面板**：
- `maxPositionPercent`（默认 5%）
- `maxDailyLossPercent`（默认 5%）
- 每项带「恢复默认」按钮和说明文字

---

### P2-1: Dashboard 重设计

**目标**：以收益结果为核心，让用户第一眼看到「当前赚了多少、趋势如何」。

**新布局**：
```
┌──────── Hero KPI ─────────────────────────────────────────┐
│  总资产: $128,450    今日收益: +$1,240 (+0.97%)  周收益: +2.3%  │
│  [月收益图：迷你折线]  [风险等级：NORMAL 绿标]              │
└───────────────────────────────────────────────────────────┘
┌── 权益曲线（主图，占 60% 宽度）──┐ ┌── Agent 最新建议 ──┐
│  Paper + Live 双曲线             │ │  [最近一次分析结论] │
│  基准（SPY）对比线               │ │  [一键查看详情]    │
│  月/周/日 切换                   │ └────────────────────┘
└──────────────────────────────────┘ ┌── 持仓快照 ────────┐
                                     │  top 3 持仓        │
                                     │  % change + PnL    │
                                     └────────────────────┘
```

---

### P2-4: 设计系统重建

**颜色系统**（从金融终端风格转向轻量专业）：
- 背景层级：`#0a0a0f`（最深） → `#111118`（卡片） → `#1a1a24`（悬浮）
- 强调色：`#6366f1`（主品牌，indigo）替换橙色
- 成功/收益：`#22c55e`（绿）
- 危险/亏损：`#ef4444`（红）
- 警告：`#f59e0b`（琥珀）
- 文字：`#f8fafc`（主）→ `#94a3b8`（次）→ `#475569`（辅助）
- 边框：`#1e293b`

**字体**：
- UI 文字：Inter（替换 Sora，更现代可读）
- 数据/Mono：JetBrains Mono（保留）

**组件规范**：
- 卡片：`border-radius: 12px`，`border: 1px solid #1e293b`，`backdrop-filter` 效果
- 按钮：3 个尺寸（sm/md/lg），4 个变体（primary/secondary/ghost/danger）
- 徽章/标签：统一 status badge 系统
- 进度指示器：步骤 indicator 组件

---

### P2-8: Zustand 状态管理迁移

**目标**：将 `TradingSystemProvider`（Context + useState）迁移到 Zustand，按更新频率拆分 store。

**Store 拆分**：
```
apps/web/src/stores/
  trading-store.ts      股票行情、账户数据（高频，SSE 驱动）
  session-store.ts      用户会话、权限（低频）
  agent-store.ts        Agent 会话状态、分析结果（中频）
  ui-store.ts           Modal、Toast、选中状态（UI 局部）
```

**迁移策略**：
1. 保持现有 Context API 的外部接口不变（向后兼容）
2. 内部替换为 Zustand，逐步移除 Context wrapper
3. 高频数据（stockStates）使用细粒度选择器防止整树重渲染

---

### P3-1: Command Palette

**触发**：`/` 或 `Cmd+K`

**功能**：
- 快速导航（Go to Dashboard / Agent / Risk...）
- 快速操作（New Agent Analysis / Approve Pending / Risk Off...）
- 符号搜索（Search AAPL...）

**实现**：全局浮层组件，注册到 `AppRouter` 层，通过 `ui-store` 控制显示。

---

## 实施顺序（按阶段提交）

```
Phase 1 (P0 后端核心)
  Commit 1: feat: add llm-provider package with Claude and OpenAI support
  Commit 2: feat: rewrite agent intent-service with LLM reasoning
  Commit 3: feat: rewrite agent planning-service with LLM tool planning
  Commit 4: feat: rewrite agent analysis-service with LLM tool-use loop
  Commit 5: feat: add agent write tools (paper trade, live trade request)
  Commit 6: feat: integrate Alpaca market data API
  Commit 7: feat: connect backtest engine to real market data

Phase 2 (P1 Agent 页面 + 风控)
  Commit 8: feat: redesign AgentPage with 3-step interaction flow
  Commit 9: feat: implement risk guards with default thresholds
  Commit 10: feat: add risk settings panel with customizable thresholds

Phase 3 (P2 UI 重设计)
  Commit 11: feat: rebuild design system (colors, fonts, components)
  Commit 12: feat: redesign Dashboard with result-first layout
  Commit 13: feat: enhance charts (benchmark, signals, indicators)
  Commit 14: feat: modernize navigation and layout shell
  Commit 15: feat: migrate state management to Zustand

Phase 4 (P3 交互体验)
  Commit 16: feat: add global Command Palette
  Commit 17: feat: add global approval drawer
  Commit 18: feat: add unified feedback system (toast, confirm, loading)
  Commit 19: feat: add keyboard navigation for tables
  Commit 20: refactor: split shared-types and unify API error model
```

---

## 风险和依赖

| 风险 | 影响 | 缓解 |
|------|------|------|
| LLM API 延迟（2-10s） | Agent 交互体验差 | 流式输出 + 步骤进度展示 |
| Alpaca 数据限速 | 回测慢 | 本地缓存 + 增量更新 |
| UI 全面重设计工作量大 | 进度风险 | 复用现有 Vanilla Extract 体系，只替换 token 值 |
| Zustand 迁移 | 潜在状态 bug | 逐步迁移，保持接口兼容 |

---

## 状态

- [x] 需求确认
- [x] 计划制定
- [ ] Phase 1: P0 后端核心
- [ ] Phase 2: P1 Agent + 风控
- [ ] Phase 3: P2 UI 重设计
- [ ] Phase 4: P3 交互体验
