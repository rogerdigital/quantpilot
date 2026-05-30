# 阶段 7 收官定义：Agent 治理骨架 P0

本文档定义 QuantPilot 在"阶段 7：Agent 治理骨架 P0"收官时应达到的能力边界、完成标准、非目标和后续扩展前提。

## 目标

阶段 7 的目标不是交付完整的 Agent 自主交易能力，而是为后续自主扩展建立稳定的治理基线：策略驱动的授权模式、Operator 每日运营指令、混合触发的 Agent 每日运行记录，以及可见的授权状态和 daily bias UI 展示。

收官时应满足以下判断：

- 治理权限记录可通过 API 配置，并按「最严格策略优先」逻辑聚合出有效授权模式。
- risk_off / critical anomaly 等系统状态可强制降级授权模式至 `stopped`，warn 状态可降至 `ask_first`。
- Operator 通过 `/api/agent/instructions` 提交的 daily bias 指令在当天 23:59:59 前持续生效，并已注入分析结论的 rationale。
- Agent daily run 可通过 schedule 或 event 触发，状态经 `queued → running → completed` 生命周期流转，并由 worker 执行。
- Agent 工作台（`/api/agent/workbench`）已汇总 `authorityState / dailyBias / authorityEvents / dailyRuns`，并在 AgentPage 的 Governance 面板中展示。
- SettingsPage 已暴露 `AgentGovernanceSettingsPanel`，展示当前策略和 daily bias 摘要。

## 完成定义

### 1. Control-Plane Governance Repositories

- `agent_policy`：账户 / 策略 / 动作类型 × paper/live 环境的授权规则记录，支持 upsert 和列表查询。
- `agent_instruction`：Operator chat 衍生的当天运营指令，按 `activeUntil` 字段过滤 active 记录。
- `agent_daily_run`：Scheduled 和 event-triggered Agent 运行记录，支持 append 和状态更新。
- `agent_authority_event`：授权降级、停机和恢复的审计记录。

### 2. Authority Resolution Service

- `resolveAgentAuthority` 按「最严格策略优先」聚合匹配策略，默认 `manual_only`。
- `riskMode=risk_off` 或 `anomalyMode=critical` 强制 `stopped`。
- `anomalyMode=warn` 且 baseMode 宽于 `ask_first` 时降至 `ask_first`。

### 3. API Governance Endpoints

- `GET /api/agent/authority` 返回有效授权模式及推理依据。
- `POST /api/agent/policies` 保存策略记录。
- `POST /api/agent/instructions` 创建每日运营指令。
- `GET /api/agent/workbench` 已包含 `authorityState / dailyBias / authorityEvents / dailyRuns`。

### 4. Worker Daily Run Workflow

- `queueAgentDailyRun` 将 `task-orchestrator.agent-daily-run` 工作流入队。
- workflow engine 中新增分支处理器，将 run 状态从 `queued` 推进至 `completed`。
- worker e2e 测试覆盖完整 queued → completed 路径。

### 5. UI Surfacing

- `AgentPage` 新增 `Agent Governance` 面板，展示 authority mode 和 daily bias 指令列表。
- `SettingsPage` 新增 `AgentGovernanceSettingsPanel`，展示策略数量、授权模式和活跃指令。
- `AgentWorkbenchPayload` 类型已扩展 governance 字段，TypeScript 通过。

### 6. Verification And Baseline Contracts

- `apps/api/test/stage-7-agent-governance-baseline.test.mjs` 覆盖三个治理合同测试。
- `apps/web/src/modules/agent/agent-governance.test.tsx` 覆盖两个 UI 渲染测试。
- `apps/web/src/pages/settings-page.test.tsx` 覆盖两个 Settings 面板测试。
- `npm run verify` 通过全套验证（129 API + 16 worker + 60 web 测试 + typecheck + build）。
- 文档一致性脚本已把阶段 7 closeout 纳入校验范围。

## 明确非目标

- 真实的 Agent 自主交易执行（P1/P2 阶段）。
- 细粒度 per-strategy / per-symbol 授权 UI 编辑界面。
- live 模式下的 authority 限制执行（当前只记录，不拦截）。
- anomaly 信号的真实来源接入（当前通过 query param 传入，尚未与 risk 监控系统联动）。
- daily run 的真实市场任务编排（当前只记录 pre_market kind，尚未调用分析或决策链路）。

## 后续扩展前提

进入阶段 8（Agent 自主扩展 P1）之前，以下前提需要满足：

1. authority 模式已能在执行决策路径中实际生效（ask_first 模式下请求人工确认）。
2. anomaly mode 已与 risk workbench 或 monitoring 状态实时联动。
3. daily run 已能触发真实的市场分析和决策编排任务。
4. daily bias 指令已被 Agent 分析流程在 rationale 外更广泛地消费。
