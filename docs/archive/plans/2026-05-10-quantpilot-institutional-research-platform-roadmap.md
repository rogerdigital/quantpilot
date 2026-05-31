# QuantPilot Institutional Research Platform Roadmap

> Archived after core-console simplification; not active product scope.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` for independent implementation streams, or `superpowers:executing-plans` for inline execution with checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 QuantPilot 从“量化交易平台骨架”改造成“AI-native quantitative research and execution control plane”，覆盖研究组织、数据科学、实验复现、策略生命周期、算力调度、风控执行、Agent 协作和机构级运营闭环。

**Architecture:** 采用分阶段演进：先建立统一领域模型和审计地基，再实现研究/数据/回测/模型/风控/执行闭环，最后扩展到任务调度、AI 研究平台、多账户机构化和插件生态。所有阶段都以当前 monorepo 为边界：`packages/*` 承载核心领域能力，`apps/api` 暴露控制平面，`apps/worker` 执行异步任务，`apps/web` 提供操作台。

**Tech Stack:** TypeScript ES2022, React 18, Vite, Vanilla Extract, Node.js ESM, npm workspaces, `node --test`, Vitest, SQLite/file adapters, existing `@quantpilot/*` packages.

---

## 0. 产品定位与平台原则

### 0.1 平台能力边界

QuantPilot 的长期能力方向：

- AI 量化研究：使用机器学习、深度学习和自然语言模型辅助特征挖掘、策略解释、研究复盘和风险审查。
- 模型驱动交易研究：把传统因子、统计模型、树模型、时序神经网络和 LLM 辅助分析纳入统一实验、评估和审批链路。
- 数据科学：长期积累行情、tick、基本面、宏观、新闻、另类数据和投资运行数据，并持续追踪质量、版本、血缘和 freshness。
- 研发平台：统一研究、训练、回测、报告和执行任务，强调任务级资源共享、快速调度、高性能计算、分布式扩展和 artifact 管理。
- 组织能力：策略、AI 算法、软件硬件、数据工程、交易执行共同构成研究生产系统。

QuantPilot 不承诺 Alpha、收益、资金规模或无人值守实盘能力；平台只提供可控研究、验证、风控和执行基础设施。

核心平台原则：

- 数据是 Alpha 的根本资产。
- 实验速度决定研究吞吐。
- 回测、训练、模型、数据版本必须可复现。
- 交易执行必须受控，Agent 不直接绕过风险边界。
- 平台要服务研究员和操盘员的工作流，而不是做散户荐股工具。

### 0.2 QuantPilot 目标定位

QuantPilot 不应定位为“AI 炒股工具”或“自动荐股 App”。

目标定位：

> AI-native quantitative research and execution control plane.

产品对象：

- 量化研究员：提出假设、构造特征、训练模型、评估策略。
- 投资/策略负责人：比较策略、审查上线条件、控制组合风险。
- 交易/执行负责人：审批计划、管理订单、处理异常、恢复执行。
- 风控负责人：定义风险边界、监控敞口、阻断违规行为。
- 平台工程师：管理数据、任务、模型、审计、运行状态。

### 0.3 总体阶段划分

1. Foundation: 统一领域模型、数据契约、审计和文档。
2. Data Science Platform: 数据资产、数据质量、特征库和数据版本。
3. Research OS: 研究假设、实验注册、模型注册、研究任务流。
4. Backtest Lab: 可复现回测、成本模型、归因、压力测试。
5. Strategy Lifecycle: 策略从想法到上线的完整状态机。
6. Risk Control Plane: 组合风险、策略风险、上线 gate、kill switch。
7. Execution Control Plane: paper/live 强隔离、订单状态机、成交质量。
8. Compute and Job Platform: 任务调度、资源抽象、异步运行和 artifact。
9. Agent Collaboration: 研究、风控、执行、运营 Agent 的受控协作。
10. Institutional Operations: 多账户、多租户、权限、合规、报表。
11. Open Ecosystem: 插件、数据接入、broker 接入、策略包市场。
12. Hardening: 安全、性能、可观测性、部署和发布治理。

---

## 1. 当前代码基线映射

### 1.1 当前可复用模块

- `packages/trading-engine`: 已有 strategy/backtest/risk/execution/market/analytics 子域，是后续核心计算层。
- `packages/control-plane-store`: 已有持久化抽象，可承载研究、任务、审计、artifact 元数据。
- `packages/control-plane-runtime`: 已有运行时上下文，可承载 gateway/worker/web 的共享运行状态。
- `packages/task-workflow-engine`: 可扩展为研究、回测、训练、审批、执行的工作流引擎。
- `packages/db`: 已有 JSON/file/SQLite adapter，可演进为统一 storage provider。
- `packages/shared-types`: 适合沉淀跨包领域契约。
- `packages/llm-provider`: 可承载 LLM/Agent provider 抽象，但不应直接拥有交易权限。
- `apps/api`: 已有 gateway route 层，适合承载 control-plane API。
- `apps/worker`: 已有后台任务入口，适合承载 job runner。
- `apps/web/src/modules/research`: 已有研究相关 UI 模块，可扩展为 Research OS。
- `apps/web/src/modules/console`: 已有执行控制台模块，可扩展为 Execution Control Plane。
- `apps/web/src/modules/risk`: 已有风险 UI hook，可扩展为 Risk Workbench。
- `apps/web/src/modules/agent`: 已有 Agent 页面和治理测试，可扩展为 Agent Collaboration。

### 1.2 当前约束

- 第一方源码必须保持 TypeScript。
- 样式必须使用 `.css.ts` / Vanilla Extract。
- `npm run verify` 是最终质量门。
- `simulated | paper | live` 交易模式必须继续保持显式、强隔离。
- Agent 不能绕过审批、风控和服务器侧执行网关。

---

## 2. 目标领域模型

### 2.1 新增核心实体

这些实体应优先进入 `packages/shared-types/src/`，再由 store/API/UI 逐步使用：

- `ResearchIdea`: 研究假设。
- `ResearchWorkspace`: 研究工作区。
- `Dataset`: 数据资产。
- `DatasetVersion`: 数据快照版本。
- `DataQualityReport`: 数据质量报告。
- `FeatureSet`: 特征集合。
- `FeatureVersion`: 特征版本。
- `Experiment`: 实验定义。
- `ExperimentRun`: 单次实验运行。
- `ModelArtifact`: 模型产物。
- `ModelVersion`: 模型版本。
- `BacktestSpec`: 回测规格。
- `BacktestRun`: 回测运行记录。
- `BacktestArtifact`: 回测产物。
- `StrategyCandidate`: 策略候选。
- `StrategyVersion`: 策略版本。
- `PromotionRequest`: 上线请求。
- `RiskPolicy`: 风险策略。
- `RiskAssessment`: 风险评估。
- `ExecutionPlan`: 执行计划。
- `OrderLifecycleEvent`: 订单生命周期事件。
- `ComputeJob`: 计算任务。
- `ComputeArtifact`: 任务产物。
- `AgentReview`: Agent 审查记录。
- `DecisionRecord`: 人类/系统/Agent 决策记录。

### 2.2 状态机

Research lifecycle:

```text
idea -> dataset_selected -> features_defined -> experiment_running
-> experiment_reviewed -> strategy_candidate -> backtest_ready
-> risk_review -> paper_ready -> live_review -> live_enabled
-> monitored -> retired
```

Compute job lifecycle:

```text
queued -> scheduled -> running -> artifact_persisted
-> succeeded | failed | cancelled | timed_out
```

Promotion lifecycle:

```text
draft -> submitted -> agent_reviewed -> risk_reviewed
-> approved_for_paper -> paper_observed -> approved_for_live
-> live_limited -> live_expanded -> suspended | retired
```

Execution lifecycle:

```text
planned -> precheck_passed -> approved -> submitted
-> acknowledged -> partially_filled -> filled
-> reconciled -> closed
```

Failure states:

```text
precheck_failed -> rejected
submit_failed -> recoverable | unrecoverable
reconcile_mismatch -> investigation_required
risk_breach -> suspended
```

---

## 3. Stage 0 - Program Groundwork

目标：先把宏大改造拆成可执行计划和治理边界，避免后续阶段互相踩踏。

### Commit 0.1: Add transformation roadmap

**Files:**

- Create: `docs/plans/2026-05-10-quantpilot-institutional-research-platform-roadmap.md`
- Modify later: `README.md`
- Modify later: `README.zh-CN.md`
- Modify later: `docs/architecture/project-structure.md`

**Steps:**

- [ ] 确认计划中每个阶段都能独立验证。
- [ ] 在 README roadmap 里新增一句长期方向：`AI-native quantitative research and execution control plane`。
- [ ] 不在 README 中承诺“自动荐股”或“无人值守实盘赚钱”。
- [ ] 运行 `npm run lint`，确保文档格式不触发 Biome 问题。
- [ ] Commit: `docs: add quant research platform transformation plan`

### Commit 0.2: Define no-go product boundaries

**Files:**

- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `docs/operations-handbook.md`

**Deep points:**

- QuantPilot 不是荐股工具。
- Agent 不直接下实盘单。
- `live` 模式必须由服务器端风险/审批/ack 控制。
- 所有策略上线必须有研究记录、回测记录、风险记录和执行记录。

**Validation:**

- [ ] README safety boundaries 包含 research/backtest/risk/execution 四类证据。
- [ ] `npm run lint`
- [ ] Commit: `docs: clarify controlled research platform boundaries`

---

## 4. Stage 1 - Domain Contracts and Storage Foundation

目标：先建立跨模块契约，避免 UI/API/worker 各自发明字段。

### Commit 1.1: Add research domain shared types

**Files:**

- Create: `packages/shared-types/src/research.ts`
- Modify: `packages/shared-types/src/index.ts`
- Test: `packages/control-plane-store/test/research-contracts.test.ts`

**Types to define:**

- `ResearchIdea`
- `ResearchWorkspace`
- `ResearchHypothesis`
- `ResearchStatus`
- `ResearchDecisionRecord`
- `ResearchOwnerRole`

**Required fields:**

- `id`
- `workspaceId`
- `title`
- `hypothesis`
- `market`
- `assetUniverse`
- `timeHorizon`
- `createdAt`
- `updatedAt`
- `owner`
- `status`
- `decisionRecords`

**Validation:**

- [ ] Type tests compile through `npm run typecheck`.
- [ ] Store test serializes/deserializes one `ResearchWorkspace`.
- [ ] Commit: `feat: add research domain contracts`

### Commit 1.2: Add dataset and feature contracts

**Files:**

- Create: `packages/shared-types/src/data-science.ts`
- Modify: `packages/shared-types/src/index.ts`
- Test: `packages/control-plane-store/test/data-science-contracts.test.ts`

**Types to define:**

- `Dataset`
- `DatasetVersion`
- `DataSource`
- `DataQualityReport`
- `FeatureSet`
- `FeatureVersion`
- `FeatureLineage`

**Deep points:**

- Dataset identity must be separated from dataset version.
- Feature identity must be separated from feature version.
- Feature lineage must record source dataset versions.
- Data quality must record freshness, missing ratio, duplicate ratio, schema drift, outlier summary.

**Validation:**

- [ ] Store test persists a feature version linked to two dataset versions.
- [ ] `npm run test:control-plane`
- [ ] Commit: `feat: add data science contracts`

### Commit 1.3: Add experiment and model registry contracts

**Files:**

- Create: `packages/shared-types/src/experiments.ts`
- Modify: `packages/shared-types/src/index.ts`
- Test: `packages/control-plane-store/test/experiment-contracts.test.ts`

**Types to define:**

- `Experiment`
- `ExperimentRun`
- `ExperimentParameter`
- `ExperimentMetric`
- `ModelArtifact`
- `ModelVersion`
- `ModelEvaluation`

**Deep points:**

- Experiment config must be immutable after run starts.
- Model artifact must carry training dataset version, feature version, code version, metrics, and approval state.
- Metrics must support scalar, distribution, confusion matrix, time-series, and custom JSON.

**Validation:**

- [ ] Test prevents mutation of a completed run snapshot.
- [ ] `npm run test:control-plane`
- [ ] Commit: `feat: add experiment and model registry contracts`

### Commit 1.4: Add lifecycle and promotion contracts

**Files:**

- Create: `packages/shared-types/src/lifecycle.ts`
- Modify: `packages/shared-types/src/index.ts`
- Test: `packages/control-plane-store/test/lifecycle-contracts.test.ts`

**Types to define:**

- `StrategyCandidate`
- `StrategyVersion`
- `PromotionRequest`
- `PromotionGate`
- `PromotionDecision`
- `DecisionRecord`

**Deep points:**

- Promotion must explicitly separate paper approval and live approval.
- Every promotion decision must record actor, role, reason, timestamp, and evidence links.
- Rejection must be first-class, not absence of approval.

**Validation:**

- [ ] Test paper-approved strategy cannot be marked live-approved without live gate evidence.
- [ ] `npm run test:control-plane`
- [ ] Commit: `feat: add strategy lifecycle contracts`

---

## 5. Stage 2 - Data Science Platform

目标：把“数据是 Alpha 的根本来源”产品化。先不做海量存储，先做数据资产、版本、质量、血缘、更新状态。

### Commit 2.1: Add dataset registry store

**Files:**

- Create: `packages/control-plane-store/src/dataset-registry.ts`
- Modify: `packages/control-plane-store/src/index.ts`
- Test: `packages/control-plane-store/test/dataset-registry.test.ts`

**Capabilities:**

- Register dataset.
- Create dataset version.
- Mark version as active.
- Attach quality report.
- List stale datasets.

**Deep points:**

- 支持 market data、tick、fundamental、macro、alternative、news 六类数据。
- 记录 ingestion frequency、last successful ingestion、source license、owner。
- 对每个 version 记录 schema hash，避免回测时用到漂移数据。

**Validation:**

- [ ] `npm run test:control-plane`
- [ ] Commit: `feat: add dataset registry store`

### Commit 2.2: Add data quality engine

**Files:**

- Create: `packages/trading-engine/src/data-quality/types.ts`
- Create: `packages/trading-engine/src/data-quality/checks.ts`
- Create: `packages/trading-engine/src/data-quality/index.ts`
- Modify: `packages/trading-engine/src/index.ts`
- Test: `packages/trading-engine/test/data-quality.test.ts`

**Checks:**

- Missing values.
- Duplicate timestamp rows.
- Timestamp monotonicity.
- Stale data.
- Extreme return spikes.
- Schema mismatch.
- Symbol coverage drop.

**Deep points:**

- Quality check output should be deterministic.
- Check severity: `info | warning | blocker`.
- `blocker` quality reports must prevent strategy promotion.

**Validation:**

- [ ] `npm run test:engine`
- [ ] Commit: `feat: add data quality checks`

### Commit 2.3: Add feature registry

**Files:**

- Create: `packages/control-plane-store/src/feature-registry.ts`
- Test: `packages/control-plane-store/test/feature-registry.test.ts`
- Create: `packages/trading-engine/src/features/feature-lineage.ts`
- Test: `packages/trading-engine/test/feature-lineage.test.ts`

**Capabilities:**

- Register feature set.
- Create feature version.
- Link feature version to dataset versions.
- Compute lineage hash.
- Compare feature versions.

**Deep points:**

- Feature formula/code fingerprint must be stored.
- Feature version must include lookback window, rebalance cadence, and leakage prevention flags.
- A feature version with future leakage risk must be blocked from promotion.

**Validation:**

- [ ] `npm run test:control-plane`
- [ ] `npm run test:engine`
- [ ] Commit: `feat: add feature registry and lineage`

### Commit 2.4: Add data API routes

**Files:**

- Create: `apps/api/src/app/routes/routers/data-router.ts`
- Modify: `apps/api/src/app/routes/platform-routes.ts`
- Test: `apps/api/test/data-routes.test.ts`

**Routes:**

- `GET /api/data/datasets`
- `POST /api/data/datasets`
- `GET /api/data/datasets/:id/versions`
- `POST /api/data/datasets/:id/versions`
- `GET /api/data/quality`
- `GET /api/data/features`
- `POST /api/data/features`

**Deep points:**

- API responses must use shared types.
- Route tests must cover malformed JSON and missing required fields.
- No broker secrets or provider keys in data responses.

**Validation:**

- [ ] `npm run test:api`
- [ ] Commit: `feat: expose data science registry routes`

### Commit 2.5: Add Data Console

**Files:**

- Create: `apps/web/src/modules/data/data.service.ts`
- Create: `apps/web/src/modules/data/useDataConsole.ts`
- Create: `apps/web/src/modules/data/DataQualityPanel.tsx`
- Create: `apps/web/src/modules/data/DatasetRegistryPanel.tsx`
- Create: `apps/web/src/modules/data/FeatureRegistryPanel.tsx`
- Create: `apps/web/src/pages/data/DataPage.tsx`
- Create: `apps/web/src/pages/data/DataPage.css.ts`
- Modify: `apps/web/src/app/routes/*`
- Test: `apps/web/src/modules/data/data-console.test.tsx`

**UX requirements:**

- Dataset list must show freshness, quality severity, active version, owner.
- Feature list must show lineage status and leakage risk.
- Quality blockers must be visually distinct and actionable.

**Validation:**

- [ ] `npm run test:web`
- [ ] `npm run build`
- [ ] Commit: `feat: add data science console`

---

## 6. Stage 3 - Research OS

目标：把 QuantPilot 从页面集合升级成研究组织系统，让每个策略从假设开始就可追踪。

### Commit 3.1: Add research workspace store

**Files:**

- Create: `packages/control-plane-store/src/research-workspace-store.ts`
- Test: `packages/control-plane-store/test/research-workspace-store.test.ts`

**Capabilities:**

- Create research workspace.
- Attach research ideas.
- Move idea through lifecycle.
- Attach datasets/features/experiments/backtests.
- Record decisions.

**Deep points:**

- Research hypothesis must be explicit.
- Every status transition must record reason.
- Decisions must be append-only.

**Validation:**

- [ ] `npm run test:control-plane`
- [ ] Commit: `feat: add research workspace store`

### Commit 3.2: Add experiment registry store

**Files:**

- Create: `packages/control-plane-store/src/experiment-registry.ts`
- Test: `packages/control-plane-store/test/experiment-registry.test.ts`

**Capabilities:**

- Register experiment.
- Create immutable run snapshot.
- Attach metrics and artifacts.
- Compare runs.
- Mark candidate run.

**Deep points:**

- Runs must capture dataset version, feature version, code version, parameters, seed, runtime environment.
- Comparison must normalize metrics direction: higher-is-better, lower-is-better.
- A candidate run must reference exact artifacts, not free text.

**Validation:**

- [ ] `npm run test:control-plane`
- [ ] Commit: `feat: add experiment registry`

### Commit 3.3: Add model registry store

**Files:**

- Create: `packages/control-plane-store/src/model-registry.ts`
- Test: `packages/control-plane-store/test/model-registry.test.ts`

**Capabilities:**

- Register model artifact.
- Version model.
- Link model to experiment run.
- Mark status: `draft | validated | rejected | deprecated`.
- Attach evaluation reports.

**Deep points:**

- Model registry is not limited to neural networks.
- LLM-generated research notes must not be treated as model artifacts.
- Model approval is separate from strategy promotion.

**Validation:**

- [ ] `npm run test:control-plane`
- [ ] Commit: `feat: add model registry`

### Commit 3.4: Add research workflow API

**Files:**

- Modify: `apps/api/src/app/routes/routers/research-router.ts`
- Test: `apps/api/test/research-workspace-routes.test.ts`

**Routes:**

- `GET /api/research/workspaces`
- `POST /api/research/workspaces`
- `GET /api/research/workspaces/:id`
- `POST /api/research/workspaces/:id/ideas`
- `POST /api/research/ideas/:id/transitions`
- `POST /api/research/ideas/:id/decisions`
- `GET /api/research/experiments`
- `POST /api/research/experiments`
- `POST /api/research/experiments/:id/runs`

**Validation:**

- [ ] `npm run test:api`
- [ ] Commit: `feat: expose research workspace workflow`

### Commit 3.5: Rebuild Research UI around lifecycle

**Files:**

- Modify: `apps/web/src/modules/research/useResearchWorkspaceData.ts`
- Modify: `apps/web/src/modules/research/ResearchStatusPanel.tsx`
- Modify: `apps/web/src/modules/research/ResearchCollectionPanel.tsx`
- Create: `apps/web/src/modules/research/ResearchIdeaLifecyclePanel.tsx`
- Create: `apps/web/src/modules/research/ResearchEvidencePanel.tsx`
- Create: `apps/web/src/modules/research/ExperimentComparisonPanel.tsx`
- Test: `apps/web/src/modules/research/research-panels.test.tsx`

**UX requirements:**

- First screen should show research pipeline health, not a generic dashboard.
- Every strategy candidate must expose its evidence chain.
- Users should be able to answer: this strategy came from which hypothesis, data, feature, experiment, model, and backtest.

**Validation:**

- [ ] `npm run test:web`
- [ ] `npm run build`
- [ ] Commit: `feat: organize research console around lifecycle`

---

## 7. Stage 4 - Backtest Lab

目标：把回测从“结果展示”升级为可复现实验室，覆盖成本、滑点、归因、压力测试、阶段表现和过拟合风险。

### Commit 4.1: Add reproducible backtest specs

**Files:**

- Create: `packages/shared-types/src/backtest.ts`
- Modify: `packages/shared-types/src/index.ts`
- Modify: `packages/trading-engine/src/backtest/types.ts`
- Test: `packages/trading-engine/test/backtest-spec.test.ts`

**Deep points:**

- Backtest spec must include dataset version, feature version, strategy version, benchmark, time range, rebalance cadence, cost model, slippage model, risk constraints.
- Spec hash must be deterministic.
- Completed run must store spec snapshot.

**Validation:**

- [ ] `npm run test:engine`
- [ ] Commit: `feat: make backtests reproducible by spec`

### Commit 4.2: Expand cost and slippage models

**Files:**

- Modify: `packages/trading-engine/src/backtest/commission.ts`
- Modify: `packages/trading-engine/src/backtest/slippage.ts`
- Test: `packages/trading-engine/test/backtest-costs.test.ts`

**Models:**

- Fixed bps commission.
- Per-share commission.
- Minimum fee.
- Spread-based slippage.
- Volume participation slippage.
- Volatility-adjusted slippage.

**Validation:**

- [ ] Tests cover small orders, large orders, zero volume, minimum fee.
- [ ] `npm run test:engine`
- [ ] Commit: `feat: expand backtest transaction cost models`

### Commit 4.3: Add regime and attribution analysis

**Files:**

- Modify: `packages/trading-engine/src/backtest/attribution.ts`
- Create: `packages/trading-engine/src/backtest/regime.ts`
- Test: `packages/trading-engine/test/backtest-attribution.test.ts`

**Capabilities:**

- Bull/bear/sideways regime buckets.
- Volatility regime buckets.
- Sector/style attribution.
- Signal contribution.
- Turnover attribution.

**Validation:**

- [ ] `npm run test:engine`
- [ ] Commit: `feat: add backtest regime attribution`

### Commit 4.4: Add overfit and robustness diagnostics

**Files:**

- Create: `packages/trading-engine/src/backtest/robustness.ts`
- Test: `packages/trading-engine/test/backtest-robustness.test.ts`

**Diagnostics:**

- Parameter sensitivity.
- Walk-forward split.
- In-sample/out-of-sample comparison.
- Drawdown clustering.
- Turnover explosion.
- Low trade count warning.

**Deep points:**

- Diagnostics output must be used by promotion gates.
- High Sharpe alone must never be sufficient for promotion.

**Validation:**

- [ ] `npm run test:engine`
- [ ] Commit: `feat: add backtest robustness diagnostics`

### Commit 4.5: Upgrade Backtest UI

**Files:**

- Modify: `apps/web/src/pages/backtest/BacktestPage.tsx`
- Create: `apps/web/src/modules/research/BacktestEvidencePanel.tsx`
- Create: `apps/web/src/modules/research/BacktestRobustnessPanel.tsx`
- Create: `apps/web/src/modules/research/BacktestAttributionPanel.tsx`
- Test: `apps/web/src/pages/research-pages.test.tsx`

**UX requirements:**

- Show result, assumptions, and warnings together.
- Make spec hash visible.
- Show paper/live promotion eligibility based on diagnostics.

**Validation:**

- [ ] `npm run test:web`
- [ ] `npm run build`
- [ ] Commit: `feat: add reproducible backtest lab panels`

---

## 8. Stage 5 - Strategy Lifecycle and Promotion Gates

目标：策略不是代码片段，而是经过证据链、回测、风控、paper 观察、live 审批的生命周期对象。

### Commit 5.1: Add strategy lifecycle engine

**Files:**

- Create: `packages/trading-engine/src/strategy/lifecycle.ts`
- Create: `packages/trading-engine/src/strategy/promotion-gates.ts`
- Modify: `packages/trading-engine/src/strategy/index.ts`
- Test: `packages/trading-engine/test/strategy-lifecycle.test.ts`

**Gates:**

- Research evidence present.
- Dataset quality pass.
- Feature leakage check pass.
- Backtest reproducibility pass.
- Robustness diagnostics pass.
- Risk assessment pass.
- Paper observation pass.
- Live acknowledgement present.

**Validation:**

- [ ] Test each missing gate blocks promotion.
- [ ] `npm run test:engine`
- [ ] Commit: `feat: add strategy lifecycle gates`

### Commit 5.2: Add promotion store and API

**Files:**

- Create: `packages/control-plane-store/src/promotion-store.ts`
- Test: `packages/control-plane-store/test/promotion-store.test.ts`
- Create: `apps/api/src/app/routes/routers/promotion-router.ts`
- Modify: `apps/api/src/app/routes/platform-routes.ts`
- Test: `apps/api/test/promotion-routes.test.ts`

**Routes:**

- `POST /api/promotions`
- `GET /api/promotions`
- `GET /api/promotions/:id`
- `POST /api/promotions/:id/submit`
- `POST /api/promotions/:id/approve-paper`
- `POST /api/promotions/:id/approve-live`
- `POST /api/promotions/:id/reject`
- `POST /api/promotions/:id/suspend`

**Validation:**

- [ ] `npm run test:control-plane`
- [ ] `npm run test:api`
- [ ] Commit: `feat: add strategy promotion workflow`

### Commit 5.3: Add Strategy Lifecycle UI

**Files:**

- Modify: `apps/web/src/pages/strategies/StrategyDetailPage.tsx`
- Create: `apps/web/src/modules/research/StrategyPromotionPanel.tsx`
- Create: `apps/web/src/modules/research/PromotionGateChecklist.tsx`
- Create: `apps/web/src/modules/research/DecisionRecordTimeline.tsx`
- Test: `apps/web/src/modules/research/research-panels.test.tsx`

**UX requirements:**

- Strategy detail page must show lifecycle state first.
- Promotion action buttons must explain blockers.
- Rejection and suspension must require explicit reason.

**Validation:**

- [ ] `npm run test:web`
- [ ] `npm run build`
- [ ] Commit: `feat: add strategy lifecycle controls`

---

## 9. Stage 6 - Risk Control Plane

目标：把风险从指标展示升级为交易和上线的强制控制面。

### Commit 6.1: Add risk policy domain

**Files:**

- Create: `packages/shared-types/src/risk-policy.ts`
- Modify: `packages/shared-types/src/index.ts`
- Create: `packages/trading-engine/src/risk/policy.ts`
- Test: `packages/trading-engine/test/risk-policy.test.ts`

**Policy dimensions:**

- Max gross exposure.
- Max net exposure.
- Max single-name weight.
- Max sector exposure.
- Max leverage.
- Max drawdown.
- Max daily loss.
- Max turnover.
- Max order notional.
- Allowed asset universe.
- Allowed trading modes.

**Validation:**

- [ ] Test policy blocks violating portfolio and order plan.
- [ ] `npm run test:engine`
- [ ] Commit: `feat: add explicit risk policy engine`

### Commit 6.2: Add pre-trade and pre-promotion assessment

**Files:**

- Create: `packages/trading-engine/src/risk/assessment.ts`
- Test: `packages/trading-engine/test/risk-assessment.test.ts`

**Capabilities:**

- Assess strategy promotion.
- Assess execution plan.
- Assess order batch.
- Produce machine-readable blockers and warnings.

**Deep points:**

- Risk assessment result must be immutable evidence.
- `warning` allows review; `blocker` prevents state transition.
- Live trading must use stricter policy than paper.

**Validation:**

- [ ] `npm run test:engine`
- [ ] Commit: `feat: add risk assessment outputs`

### Commit 6.3: Add risk policy API

**Files:**

- Modify: `apps/api/src/app/routes/routers/risk-router.ts`
- Test: `apps/api/test/risk-policy-routes.test.ts`

**Routes:**

- `GET /api/risk/policies`
- `POST /api/risk/policies`
- `POST /api/risk/assess/promotion`
- `POST /api/risk/assess/execution`
- `POST /api/risk/kill-switch`

**Validation:**

- [ ] Test kill switch blocks execution routes.
- [ ] `npm run test:api`
- [ ] Commit: `feat: expose risk policy controls`

### Commit 6.4: Upgrade Risk Workbench UI

**Files:**

- Modify: `apps/web/src/pages/risk/RiskPage.tsx`
- Modify: `apps/web/src/modules/risk/useRiskWorkbench.ts`
- Create: `apps/web/src/modules/risk/RiskPolicyEditor.tsx`
- Create: `apps/web/src/modules/risk/RiskAssessmentPanel.tsx`
- Create: `apps/web/src/modules/risk/KillSwitchPanel.tsx`
- Test: `apps/web/src/modules/risk/risk-workbench.test.tsx`

**UX requirements:**

- Risk page must clearly separate monitoring, policy, assessments, and emergency controls.
- Kill switch must require explicit typed confirmation.
- Live mode controls must visibly differ from simulated/paper.

**Validation:**

- [ ] `npm run test:web`
- [ ] `npm run build`
- [ ] Commit: `feat: add risk control plane UI`

---

## 10. Stage 7 - Execution Control Plane

目标：把执行系统做成“计划、审批、提交、成交、对账、恢复”的可追踪闭环。

### Commit 7.1: Expand execution plan model

**Files:**

- Modify: `packages/shared-types/src/trading.ts`
- Modify: `packages/trading-engine/src/execution/order-lifecycle.ts`
- Test: `packages/trading-engine/test/order-lifecycle.test.ts`

**Deep points:**

- Execution plan must link to strategy version, promotion request, risk assessment, broker account, trading mode.
- Each order must have lifecycle events.
- Reconciliation mismatch must be first-class state.

**Validation:**

- [ ] `npm run test:engine`
- [ ] Commit: `feat: link execution plans to strategy evidence`

### Commit 7.2: Add broker adapter boundary

**Files:**

- Create: `packages/trading-engine/src/execution/broker-adapter.ts`
- Create: `packages/trading-engine/src/execution/simulated-broker-adapter.ts`
- Test: `packages/trading-engine/test/broker-adapter.test.ts`

**Capabilities:**

- Submit order.
- Cancel order.
- Fetch order status.
- Fetch positions.
- Fetch account.
- Reconcile fills.

**Deep points:**

- Adapter must not read browser-side credentials.
- Live adapter must refuse to start without server-side environment validation.
- Simulated adapter must be deterministic in tests.

**Validation:**

- [ ] `npm run test:engine`
- [ ] Commit: `feat: define broker adapter boundary`

### Commit 7.3: Add execution recovery workflow

**Files:**

- Modify: `packages/trading-engine/src/execution/retry-handler.ts`
- Create: `packages/trading-engine/src/execution/recovery.ts`
- Test: `packages/trading-engine/test/execution-recovery.test.ts`

**Cases:**

- Submit failed before broker acknowledgement.
- Broker acknowledgement lost.
- Partial fill.
- Cancel rejected.
- Position mismatch.
- Gateway restart during order flow.

**Validation:**

- [ ] `npm run test:engine`
- [ ] Commit: `feat: add execution recovery workflows`

### Commit 7.4: Upgrade Execution Console

**Files:**

- Modify: `apps/web/src/modules/console/useExecutionConsoleData.ts`
- Modify: `apps/web/src/modules/console/executionCollectionConfigs.ts`
- Modify: `apps/web/src/modules/console/executionInspectionConfigs.ts`
- Create: `apps/web/src/modules/console/ExecutionEvidencePanel.tsx`
- Create: `apps/web/src/modules/console/ExecutionRecoveryPanel.tsx`
- Test: `apps/web/src/modules/console/execution-panels.test.ts`

**UX requirements:**

- Show plan -> approval -> risk -> broker -> reconciliation chain.
- Recovery actions must be explicit and auditable.
- Failed execution must guide next action, not just display red text.

**Validation:**

- [ ] `npm run test:web`
- [ ] `npm run build`
- [ ] Commit: `feat: add execution evidence and recovery controls`

---

## 11. Stage 8 - Compute and Job Platform

目标：先把研究、回测、训练、报告和数据质量检查统一成可调度、可追踪、可复现的 job，再根据真实负载扩展计算资源。

### Commit 8.1: Add compute job contracts

**Files:**

- Create: `packages/shared-types/src/compute.ts`
- Modify: `packages/shared-types/src/index.ts`
- Test: `packages/control-plane-store/test/compute-job-contracts.test.ts`

**Types:**

- `ComputeJob`
- `ComputeQueue`
- `ComputeResourceRequest`
- `ComputeArtifact`
- `ComputeWorkerHeartbeat`
- `ComputeJobLogEvent`

**Deep points:**

- Resource request supports CPU, memory, GPU count, estimated duration, priority.
- Job links to research/workspace/backtest/model/promotion when applicable.
- Logs are append-only and queryable.

**Validation:**

- [ ] `npm run test:control-plane`
- [ ] Commit: `feat: add compute job contracts`

### Commit 8.2: Add job scheduler store

**Files:**

- Create: `packages/control-plane-store/src/compute-job-store.ts`
- Test: `packages/control-plane-store/test/compute-job-store.test.ts`

**Capabilities:**

- Enqueue job.
- Lease job.
- Heartbeat job.
- Append log.
- Attach artifact.
- Mark completion/failure/timeout.

**Validation:**

- [ ] Test expired lease can be recovered.
- [ ] `npm run test:control-plane`
- [ ] Commit: `feat: add compute job store`

### Commit 8.3: Extend worker into job runner

**Files:**

- Modify: `apps/worker/src/config.ts`
- Modify: `apps/worker/src/main.ts`
- Create: `apps/worker/src/job-runner.ts`
- Create: `apps/worker/src/job-handlers/backtest-job-handler.ts`
- Create: `apps/worker/src/job-handlers/data-quality-job-handler.ts`
- Create: `apps/worker/src/job-handlers/report-job-handler.ts`
- Test: `apps/worker/test/compute-job-runner.test.ts`

**Deep points:**

- Worker must remain sequential by default unless a handler declares safe concurrency.
- Job timeout and `continueOnTaskFailure` behavior from current worker resilience should be preserved.
- Each handler writes artifacts through store, not ad hoc files.

**Validation:**

- [ ] `npm run test:worker`
- [ ] Commit: `feat: run compute jobs through worker`

### Commit 8.4: Add compute API and UI

**Files:**

- Create: `apps/api/src/app/routes/routers/compute-router.ts`
- Modify: `apps/api/src/app/routes/platform-routes.ts`
- Test: `apps/api/test/compute-routes.test.ts`
- Create: `apps/web/src/modules/operations/useComputeJobs.ts`
- Create: `apps/web/src/modules/operations/ComputeQueuePanel.tsx`
- Create: `apps/web/src/modules/operations/ComputeArtifactPanel.tsx`
- Test: `apps/web/src/modules/operations/compute-jobs.test.tsx`

**UX requirements:**

- Show queued/running/failed/succeeded jobs.
- Expose resource request, runtime, owner, linked entity, latest log.
- Allow retry only when job handler declares retry-safe.

**Validation:**

- [ ] `npm run test:api`
- [ ] `npm run test:web`
- [ ] Commit: `feat: add compute operations console`

---

## 12. Stage 9 - AI Research Platform Layer

目标：把“AI 能力”放在正确位置：辅助研究、解释、审查、生成实验，不让 LLM 无约束直接交易。

### Commit 9.1: Add AI research task contracts

**Files:**

- Create: `packages/shared-types/src/ai-research.ts`
- Modify: `packages/shared-types/src/index.ts`
- Test: `packages/control-plane-store/test/ai-research-contracts.test.ts`

**Types:**

- `ResearchAssistantTask`
- `AgentResearchSuggestion`
- `AgentRiskReview`
- `AgentExecutionReview`
- `AgentEvidenceCitation`
- `AgentActionBoundary`

**Deep points:**

- Agent output must cite platform evidence: dataset, experiment, backtest, risk assessment, execution record.
- Agent cannot be final approver for live trading.
- Agent suggestions are advisory until accepted by a human or policy.

**Validation:**

- [ ] `npm run test:control-plane`
- [ ] Commit: `feat: add AI research task contracts`

### Commit 9.2: Add governed Agent tools

**Files:**

- Modify: `packages/llm-provider/src/types.ts`
- Create: `packages/control-plane-runtime/src/agent-tool-policy.ts`
- Test: `packages/control-plane-runtime/test/agent-tool-policy.test.ts`
- Modify: `apps/api/src/app/routes/routers/agent-router.ts`
- Test: `apps/api/test/agent-governance-routes.test.ts`

**Tools:**

- Read research workspace.
- Summarize dataset quality.
- Compare experiment runs.
- Explain backtest diagnostics.
- Draft promotion review.
- Draft risk review.
- Draft execution recovery memo.

**Forbidden tools:**

- Direct live order placement.
- Direct live approval.
- Secret read.
- Risk policy bypass.
- Audit deletion.

**Validation:**

- [ ] Tests prove forbidden tools are rejected server-side.
- [ ] `npm run test:runtime`
- [ ] `npm run test:api`
- [ ] Commit: `feat: govern agent research tools`

### Commit 9.3: Add Agent review workflows

**Files:**

- Create: `packages/task-workflow-engine/src/agent-review-workflows.ts`
- Test: `packages/task-workflow-engine/test/agent-review-workflows.test.ts`
- Modify: `apps/worker/src/job-handlers/report-job-handler.ts`
- Modify: `apps/api/src/app/routes/routers/agent-router.ts`

**Workflows:**

- Research idea critique.
- Backtest overfit review.
- Risk policy violation explanation.
- Promotion memo draft.
- Execution incident summary.

**Validation:**

- [ ] `npm run test:engine`
- [ ] `npm run test:worker`
- [ ] Commit: `feat: add governed agent review workflows`

### Commit 9.4: Upgrade Agent Console

**Files:**

- Modify: `apps/web/src/modules/agent/AgentPage.tsx`
- Modify: `apps/web/src/modules/agent/useAgentTools.ts`
- Create: `apps/web/src/modules/agent/AgentReviewQueue.tsx`
- Create: `apps/web/src/modules/agent/AgentEvidenceCard.tsx`
- Create: `apps/web/src/modules/agent/AgentBoundaryPanel.tsx`
- Test: `apps/web/src/modules/agent/agent-governance.test.tsx`

**UX requirements:**

- Show what Agent can and cannot do.
- Show evidence citations for every review.
- Approval actions must remain human/policy controlled.

**Validation:**

- [ ] `npm run test:web`
- [ ] `npm run build`
- [ ] Commit: `feat: add governed agent collaboration console`

---

## 13. Stage 10 - Institutional Operations

目标：把平台从单用户演示工具升级为可承载团队协作和机构运营的控制面。

### Commit 10.1: Add organization and account model

**Files:**

- Create: `packages/shared-types/src/organization.ts`
- Modify: `packages/shared-types/src/index.ts`
- Create: `packages/control-plane-store/src/organization-store.ts`
- Test: `packages/control-plane-store/test/organization-store.test.ts`

**Entities:**

- `Organization`
- `Workspace`
- `Team`
- `UserRole`
- `BrokerAccount`
- `StrategyAllocation`
- `AccountRiskLimit`

**Validation:**

- [ ] `npm run test:control-plane`
- [ ] Commit: `feat: add organization account model`

### Commit 10.2: Add fine-grained permission policies

**Files:**

- Modify: `apps/web/src/modules/permissions/permissionCopy.ts`
- Create: `packages/control-plane-runtime/src/permission-policy.ts`
- Test: `packages/control-plane-runtime/test/permission-policy.test.ts`
- Modify: `apps/api/src/app/routes/routers/auth-router.ts`

**Permissions:**

- Read research.
- Modify research.
- Run backtest.
- Approve paper.
- Approve live.
- Edit risk policy.
- Trigger kill switch.
- Manage broker credentials.
- Export audit report.

**Validation:**

- [ ] `npm run test:runtime`
- [ ] `npm run test:api`
- [ ] `npm run test:web`
- [ ] Commit: `feat: add institutional permission policies`

### Commit 10.3: Add compliance and audit reports

**Files:**

- Create: `packages/control-plane-store/src/audit-report-store.ts`
- Create: `apps/api/src/app/routes/routers/compliance-router.ts`
- Test: `apps/api/test/compliance-routes.test.ts`
- Create: `apps/web/src/modules/audit/AuditReportPanel.tsx`
- Test: `apps/web/src/modules/audit/audit-report.test.tsx`

**Reports:**

- Strategy promotion report.
- Live trading approval report.
- Risk breach report.
- Execution incident report.
- Agent action report.
- Dataset lineage report.

**Validation:**

- [ ] `npm run test:api`
- [ ] `npm run test:web`
- [ ] Commit: `feat: add compliance audit reports`

---

## 14. Stage 11 - Open Ecosystem and Connectors

目标：把 QuantPilot 扩展为可接入不同数据源、broker、策略包和研究工具的平台，但保持安全边界。

### Commit 11.1: Add connector contracts

**Files:**

- Create: `packages/shared-types/src/connectors.ts`
- Create: `packages/control-plane-runtime/src/connector-registry.ts`
- Test: `packages/control-plane-runtime/test/connector-registry.test.ts`

**Connector types:**

- Market data connector.
- Fundamental data connector.
- News/NLP connector.
- Broker connector.
- Model provider connector.
- Report export connector.

**Validation:**

- [ ] `npm run test:runtime`
- [ ] Commit: `feat: add connector registry contracts`

### Commit 11.2: Add data connector runtime

**Files:**

- Create: `packages/trading-engine/src/connectors/data-connector.ts`
- Test: `packages/trading-engine/test/data-connector.test.ts`
- Create: `apps/worker/src/job-handlers/data-ingestion-job-handler.ts`
- Test: `apps/worker/test/data-ingestion-job.test.ts`

**Deep points:**

- Connector must emit dataset version.
- Ingestion must run data quality checks automatically.
- Failed ingestion must not replace active dataset version.

**Validation:**

- [ ] `npm run test:engine`
- [ ] `npm run test:worker`
- [ ] Commit: `feat: add data ingestion connector runtime`

### Commit 11.3: Add broker connector runtime

**Files:**

- Modify: `packages/trading-engine/src/execution/broker-adapter.ts`
- Create: `packages/trading-engine/src/connectors/broker-connector.ts`
- Test: `packages/trading-engine/test/broker-connector.test.ts`

**Deep points:**

- Broker connectors must declare supported order types, asset classes, trading modes.
- Live connector requires runtime env validation.
- Connector health must feed execution console.

**Validation:**

- [ ] `npm run test:engine`
- [ ] Commit: `feat: add broker connector runtime`

### Commit 11.4: Add Strategy Package manifest

**Files:**

- Create: `packages/shared-types/src/strategy-package.ts`
- Create: `packages/trading-engine/src/strategy/package-validator.ts`
- Test: `packages/trading-engine/test/strategy-package-validator.test.ts`

**Manifest fields:**

- Name/version/owner.
- Required datasets.
- Required features.
- Supported markets.
- Risk requirements.
- Backtest specs.
- Expected artifacts.
- Permissions requested.

**Validation:**

- [ ] Invalid package requesting live execution by default is rejected.
- [ ] `npm run test:engine`
- [ ] Commit: `feat: add strategy package manifest`

---

## 15. Stage 12 - Observability, Reliability, and Deployment Hardening

目标：每个研究、任务、交易、Agent 行为都可追踪；失败能恢复；上线可审计。

### Commit 12.1: Add structured platform events

**Files:**

- Create: `packages/shared-types/src/platform-events.ts`
- Create: `packages/control-plane-runtime/src/platform-event-bus.ts`
- Test: `packages/control-plane-runtime/test/platform-event-bus.test.ts`

**Events:**

- Dataset ingested.
- Data quality failed.
- Experiment started/completed.
- Backtest completed.
- Promotion submitted/approved/rejected.
- Risk breach detected.
- Execution plan submitted.
- Order lifecycle changed.
- Agent review produced.
- Kill switch triggered.

**Validation:**

- [ ] `npm run test:runtime`
- [ ] Commit: `feat: add structured platform events`

### Commit 12.2: Add observability dashboard

**Files:**

- Modify: `apps/web/src/modules/operations/useOperationsWorkbench.ts`
- Create: `apps/web/src/modules/operations/PlatformEventStream.tsx`
- Create: `apps/web/src/modules/operations/SystemHealthMatrix.tsx`
- Create: `apps/web/src/modules/operations/ArtifactIntegrityPanel.tsx`
- Test: `apps/web/src/modules/operations/operations-observability.test.tsx`

**UX requirements:**

- Show service health, job health, data freshness, broker health, risk status.
- Show incident links and latest platform events.
- Distinguish degraded, blocked, and healthy states.

**Validation:**

- [ ] `npm run test:web`
- [ ] `npm run build`
- [ ] Commit: `feat: add platform observability dashboard`

### Commit 12.3: Add artifact integrity checks

**Files:**

- Create: `packages/control-plane-store/src/artifact-integrity.ts`
- Test: `packages/control-plane-store/test/artifact-integrity.test.ts`
- Modify: `scripts/control-plane-maintenance.ts`

**Checks:**

- Missing artifact metadata.
- Missing artifact payload.
- Hash mismatch.
- Orphaned artifacts.
- Stale active dataset version.
- Promotion missing evidence.

**Validation:**

- [ ] `npm run test:control-plane`
- [ ] `npm run control-plane:maintenance`
- [ ] Commit: `feat: add artifact integrity maintenance`

### Commit 12.4: Update full documentation set

**Files:**

- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `docs/architecture/project-structure.md`
- Modify: `docs/architecture/layered-architecture.md`
- Modify: `docs/operations-handbook.md`
- Modify: `docs/deployment.md`
- Modify: `.env.example`

**Deep points:**

- Document research lifecycle.
- Document data lifecycle.
- Document strategy promotion.
- Document paper/live boundaries.
- Document Agent boundaries.
- Document job runner and artifacts.
- Document operational recovery.

**Validation:**

- [ ] `npm run lint`
- [ ] `npm run verify`
- [ ] Commit: `docs: document quant research control plane`

---

## 16. Recommended Branch and PR Strategy

不要把全部阶段塞进一个 PR。建议按阶段拆成独立分支：

1. `roadmap/institutional-research-platform`
2. `platform/domain-contracts`
3. `platform/data-science-registry`
4. `platform/research-os`
5. `platform/backtest-lab`
6. `platform/strategy-lifecycle`
7. `platform/risk-control-plane`
8. `platform/execution-control-plane`
9. `platform/compute-jobs`
10. `platform/agent-collaboration`
11. `platform/institutional-ops`
12. `platform/connectors`
13. `platform/observability-hardening`

每个 PR 的最低标准：

- 包含相关 shared types。
- 包含 store/API/engine/UI 中至少一个完整闭环。
- 包含对应测试。
- 更新相关文档。
- `npm run verify` 通过，或明确说明预期失败原因。

---

## 17. Verification Matrix

每个阶段至少运行：

```bash
npm run check:workspaces
npm run check:lockfile
npm run check:no-js-source
npm run lint
npm run typecheck
```

按改动范围追加：

```bash
npm run test:control-plane
npm run test:runtime
npm run test:engine
npm run test:api
npm run test:worker
npm run test:web
npm run build
```

阶段合并前运行：

```bash
npm run verify
```

特殊验证：

- `simulated` 模式必须通过 `npm run check:runtime-env`。
- `paper` / `live` 模式在缺少凭证或确认变量时失败是预期行为，需要在 PR 说明中写清。
- 风控/执行相关改动必须有阻断路径测试，而不只测成功路径。
- Agent 相关改动必须有 forbidden action 测试。

---

## 18. Highest-Risk Areas

### 18.1 数据和回测可复现性

风险：只记录回测结果，不记录输入版本，导致后续无法复现。

防线：

- Spec hash。
- Dataset version。
- Feature version。
- Code version。
- Cost/slippage model snapshot。
- Artifact integrity check。

### 18.2 Agent 权限边界

风险：Agent 工具越权，绕过审批或风控。

防线：

- Server-side tool policy。
- Forbidden action tests。
- Human/policy final approval。
- Audit event append-only。

### 18.3 Live trading 安全

风险：paper 和 live 路径混用。

防线：

- `TradingRuntimeMode` 继续保持显式。
- Live broker adapter 需要 server env validation。
- Live promotion gate 与 paper promotion gate 分离。
- Kill switch 服务器侧强制阻断。

### 18.4 计划过大导致失控

风险：领域太大，一个 PR 做太多。

防线：

- 每阶段独立分支。
- 每个 commit 单一责任。
- 先 shared types，再 store/engine，再 API，再 UI。
- 每个阶段都能独立验证。

---

## 19. Implementation Order Summary

推荐总顺序：

1. 写入并确认本计划。
2. 更新 README 边界和定位。
3. 建 shared types。
4. 建 store registries。
5. 建 data quality/feature lineage。
6. 建 research workspace。
7. 建 experiment/model registry。
8. 建 reproducible backtest。
9. 建 lifecycle gates。
10. 建 risk policy/assessment。
11. 建 execution evidence/recovery。
12. 建 compute job runner。
13. 建 governed Agent workflows。
14. 建 institutional permissions/audit。
15. 建 connectors。
16. 建 observability/integrity。
17. 全量文档同步。
18. 全量 `npm run verify`。

---

## 20. Internal Use Notes

本路线图是 QuantPilot 的内部产品和工程规划文档。它描述机构级量化研究平台应具备的能力边界、演进顺序、提交粒度和验证方式，不包含第三方产品归因或非公开交易系统假设。

公开版本、PR 描述和 README 只应使用中性表述：`institutional research platform`、`research and execution control plane`、`controlled quantitative trading workflow`。避免依附式产品叙事。
