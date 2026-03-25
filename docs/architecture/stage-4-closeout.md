# 阶段 4 收官定义：风控与调度中台深化

本文档定义 QuantPilot 在“阶段 4：风控与调度中台深化”收官时应达到的能力边界、完成标准、非目标和进入阶段 5 的前置条件。

## 目标

阶段 4 的目标不是把所有风控和调度自动化一次性做满，而是把风险与调度从“事件列表和节拍记录”推进成“有共享上下文、有中台快照、有可执行动作”的正式中间件层。

收官时应满足以下判断：

- 风控台与调度台都已具备正式的 `workbench + runbook + queue + linkage` 结构，而不是仅靠前端拼装多个 feed。
- `risk / scheduler / linkage / incident / operator action / notification` 之间已形成稳定的共享上下文和动作留痕语义。
- 风控动作和调度动作都可从控制台直接执行，并写入控制面，而不是只做筛选与跳转。
- 阶段 5 所需的 Agent 受控协作能力，可以围绕当前 risk/scheduler contracts 扩展，而不需要返工阶段 4 的中台边界。

## 完成定义

### 1. Risk Governance Workbench

- 风控页已稳定消费统一的 `risk workbench` 聚合快照。
- `risk workbench` 至少覆盖 `risk events / execution review / backtest review / incidents / portfolio exposure / drawdown / compliance / emergency posture / scheduler attention`。
- 风控页中的 `reviewQueue`、`recent` 和 `runbook` 已形成一致的中台交互语义，而不是分散的局部面板。

### 2. Scheduler Operations Workbench

- 调度侧已稳定消费统一的 `scheduler workbench` 聚合快照。
- `scheduler workbench` 至少覆盖 `scheduler windows / cycle drift / incidents / notifications / risk signals / linkage`。
- 调度台中的 `lanes / runbook / queue / recent` 已形成稳定合同，能支持盘前、盘中、盘后和 off-hours 的统一查看。

### 3. Risk And Scheduler Linkage

- risk 与 scheduler 已共享同一份 linkage snapshot，而不是各自重复聚合同一类上下文。
- linkage 至少覆盖 `linked risk events / linked scheduler ticks / linked incidents / linked notifications / cycle attention / active phase`。
- risk 页面与 notifications 页面都能围绕同一条 linkage 路径进行聚焦和排查。

### 4. Middleware Actions

- `scheduler orchestration actions` 已可从控制台直接执行，并将动作沉淀到 operator action、scheduler tick、cycle record、notification 和 incident triage。
- `risk middleware policy actions` 已可从风控台直接执行，并将动作沉淀到 operator action、risk-policy event、notification 和 incident triage。
- 风控与调度动作都具备正式 API 合同，而不是仅存在于页面级本地逻辑。

### 5. Contracts And Traceability

- risk workbench、scheduler workbench、risk policy action、scheduler orchestration action 这几条合同已具备稳定的查询或写入语义。
- README、`project-structure.md` 和本 closeout 文档对阶段 4 状态、完成定义和阶段 5 入口保持一致。
- 阶段 4 若破坏上述 contracts，应视为回归，而不是正常演进。

### 6. 工程化与验证

- `npm run verify` 继续作为阶段 4 的统一校验入口。
- 阶段 4 的专项 API 基线测试至少覆盖 `risk workbench / risk actions / scheduler workbench / scheduler actions / linkage` 合同。
- README、架构文档与 closeout 文档的一致性已被脚本校验兜住。

## 明确非目标

以下内容不属于阶段 4 收官要求：

- 生产级组合风险引擎和多资产风险建模
- 真实交易所日历、盘中批处理和生产级调度基础设施
- 多 broker 风险语义统一和清算级调度编排
- Agent 自动审批、自动处置和无人值守执行
- 生产级数据库、消息队列、缓存和运维体系
- 完整的策略资金分配、保证金和清算模型

## 进入阶段 5 的前置条件

当以下条件同时满足时，阶段 5 可以正式启动：

1. risk workbench、scheduler workbench、risk policy actions 和 scheduler orchestration actions 能稳定通过 `verify` 与阶段 4 基线测试。
2. README、架构文档和当前研发重点已从“风控与调度中台深化”转向“Agent 受控协作落地”。
3. 风控与调度动作已形成稳定留痕，不需要回退到只做前端聚焦和手工排查。
4. 阶段 5 的 Agent 动作将围绕现有 risk/scheduler contracts 受控扩展，而不是重新发明 risk middleware 或 scheduler orchestration 语义。

## 当前已达成的收官信号

截至当前仓库状态，以下信号已经出现：

- 风控台已具备风险治理工作台，覆盖 review queue、live exposure、合规提示、应急姿态和风险联动。
- 调度台已具备 scheduler operations workbench，覆盖窗口姿态、cycle drift、notification 压力、incident 和风险联动。
- risk/scheduler linkage 已形成共享上下文，两个控制台都可以围绕同一条 linkage path 联动查看。
- scheduler orchestration actions 已从 notifications 页面直接驱动 control-plane 写入。
- risk middleware policy actions 已从 risk 页面直接驱动 operator history、risk-policy event、notification 和 incident triage。

## 剩余收官动作

阶段 4 的收官动作已经完成，后续重点应转向：

- 保持 risk/scheduler contracts 稳定，不在阶段 5 中返工 workbench、linkage 或 action 语义。
- 用专项基线测试守住风险与调度中台边界。
- 让 Agent 受控协作继续围绕 risk/scheduler/action contracts 扩展，而不是绕开阶段 4 的中台层。

## 验证基线

阶段 4 收官时默认应通过以下检查：

1. `npm run verify`
2. 风控与调度中台专项 API 基线测试
3. README、`project-structure.md`、`stage-1-closeout.md`、`stage-2-closeout.md`、`stage-3-closeout.md` 和本 closeout 文档的一致性检查

阶段 4 收官后，新的 Agent、risk 或 scheduler 提交若破坏上述基线，应视为回归，而不是正常演进。
