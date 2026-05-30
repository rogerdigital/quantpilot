# 阶段 5 收官定义：Agent 受控协作落地

本文档定义 QuantPilot 在“阶段 5：Agent 受控协作落地”收官时应达到的能力边界、完成标准、非目标和进入阶段 6 的前置条件。

## 目标

阶段 5 的目标不是把 Agent 一次性做成高自主性执行体，而是把 Agent 从“前端对话感”和“只读工具演示”推进成“有正式合同、有工作台、有受控动作交接”的协作层。

收官时应满足以下判断：

- Agent 已具备正式的 `session / intent / plan / analysis run / action request` 合同，而不是前端临时状态。
- Agent workbench 已能围绕会话、解释、timeline 和 pending requests 组织真实协作，而不是只展示工具目录。
- Agent 产生的下一步建议，已能通过受控 handoff 进入 `action request -> approval -> downstream workflow` 链路，而不是只停留在 explanation 文案。
- Agent 的分析、请求、审批和下游动作都继续受 audit、risk、approval、execution 和 control-plane 边界约束。

## 完成定义

### 1. Agent Contracts

- 控制面已稳定持久化 `agent session / intent / plan / analysis run / action request`。
- session detail 至少覆盖 `latest plan / latest analysis run / latest action request / linked artifacts / timeline`。
- Agent 的关键对象都已具备正式的查询或写入语义，而不是只通过 audit metadata 回放。

### 2. Intent, Planning And Analysis

- prompt 已能稳定进入 `intent parsing -> plan creation -> read-only analysis run` 链路。
- plan steps 已能表达 `read / explain / request_action` 三类受控步骤。
- analysis run 已能沉淀 evidence、summary、explanation 和 recommended next step。

### 3. Collaboration Workbench

- Agent 页面已升级为正式 `agent collaboration workbench`。
- workbench 至少覆盖 `prompt studio / recent sessions / pending requests / explanation detail / operator timeline / tool allowlist / runbook`。
- workbench 不再依赖前端自行拼装 explanation、request queue 或 operator trail。

### 4. Controlled Action Handoff

- 已支持从完成的 session/analysis 正式发起 `controlled action request`，而不是只展示建议文案。
- handoff 至少覆盖 `execution prep / backtest review / risk explanation` 这三类可审动作。
- action request 的创建仍然必须经过已有 risk gate 和 operator approval，而不是直接写 execution、scheduler 或 workflow 状态。

### 5. Approval And Downstream Linking

- action request 被批准后，仍然只能走已有 downstream contracts，例如 `strategy execution workflow`。
- action request 的 metadata、session linkage 和 operator actions 已能把批准/拒绝结果回填到 session timeline。
- Agent 不存在绕过 `risk:review` 或 `execution:approve` 的平行动作通道。

### 6. 文档与验证

- README、`project-structure.md` 和本 closeout 文档对阶段 5 状态保持一致。
- `npm run verify` 继续作为阶段 5 的统一校验入口。
- 阶段 5 的专项测试至少覆盖 `intent / plan / analysis / workbench / controlled handoff / approval linkage`。

## 明确非目标

以下内容不属于阶段 5 收官要求：

- 高自主性 Agent 规划、长程记忆和多轮自反思系统
- 让 Agent 自动批准风险、自动批准执行或直接下单
- 生产级 LLM orchestration、模型路由和提示治理平台
- 多 Agent 并行协作框架和跨租户会话共享
- 生产级数据库、消息队列、缓存和实盘运维体系

## 进入阶段 6 的前置条件

当以下条件同时满足时，阶段 6 可以正式启动：

1. Agent 的 `session / intent / plan / analysis / action request / workbench` contracts 能稳定通过 `verify` 与阶段 5 专项测试。
2. Agent 的受控动作交接已经稳定落在既有 risk、approval 和 execution contracts 内，不需要返工阶段 5 的核心边界。
3. README、架构文档和当前研发重点已从“Agent 受控协作落地”转向“生产化与专业化”。
4. 阶段 6 的重点可以放在数据库、权限、可观测性和可运营性，而不是回头补 Agent 的最小闭环。

## 当前已达成的收官信号

截至当前仓库状态，以下信号已经出现：

- Agent 已具备正式的 session、intent、plan、analysis run 和 action request 对象流。
- Agent workbench 已可查看 recent sessions、structured explanations、pending action requests 和 operator timeline。
- 完成的 analysis session 已能正式发起 controlled action handoff，并把 metadata 带入 workflow、request 和 session linkage。
- action request 的 approve / reject 结果会继续沉淀到 operator history、audit、notification 和 session timeline 中。

## 剩余收官动作

阶段 5 的最小收官动作已经完成，后续重点应转向：

- 保持 Agent contracts 稳定，不在阶段 6 中返工 session、analysis 或 controlled handoff 语义。
- 在生产化建设中继续守住 `risk / approval / execution` guardrails，不让 Agent 扩展破坏既有中台边界。
- 把更高自主性能力放在阶段 6 之后，再建立新的非目标与进入条件。

## 验证基线

阶段 5 收官时默认应通过以下检查：

1. `npm run verify`
2. Agent 专项 API 与 workflow 基线测试
3. README、`project-structure.md`、`stage-1-closeout.md`、`stage-2-closeout.md`、`stage-3-closeout.md`、`stage-4-closeout.md` 和本 closeout 文档的一致性检查

阶段 5 收官后，新的 Agent、risk 或 execution 提交若破坏上述基线，应视为回归，而不是正常演进。
