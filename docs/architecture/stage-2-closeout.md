# 阶段 2 收官定义：研究与策略闭环

本文档定义 QuantPilot 在“阶段 2：研究与策略闭环”收官时应达到的能力边界、完成标准、非目标和进入阶段 3 的前置条件。

## 目标

阶段 2 的目标不是把执行层推进到真实订单状态机，而是把研究链路从“能看结果”推进成“可任务化、可治理、可回放、可交接”的正式闭环。

收官时应满足以下判断：

- 研究任务、回测结果、研究评估和研究报告已经形成统一的异步骨架。
- 策略页、回测页和研究工作台之间存在稳定的深链和对象流，而不是页面内临时拼接。
- 研究资产已经具备比较、治理和回放能力，能支撑晋级和执行准备决策。
- execution candidate handoff 已经成为研究到执行前的正式交接对象。
- 阶段 3 所需的 execution handoff、execution prep 和风险承接入口已经稳定，不需要返工阶段 2 的研究对象契约。

## 完成定义

### 1. Research Task Backbone

- `strategy / backtest / report` 已进入统一任务协议和 worker 异步执行模型。
- 回测运行、研究报告和研究任务之间具备稳定的 `task / workflow / run` 联动。
- 研究任务能通过统一研究总览和详情入口回看，不依赖单页局部状态。

### 2. 结果、评估与报告模型

- 回测结果已具备独立持久化、版本化和详情查询边界。
- 研究评估已具备 verdict、readiness、recommendedAction 和 summary 等正式字段。
- 研究报告已沉淀为可查询、可回放、可作为晋级依据的研究资产。
- 回测页和策略页能稳定消费 `latest result / evaluations / reports`，而不是回退到 audit metadata 拼装。

### 3. Research Governance Workbench

- 研究工作台已具备 `summary / lanes / promotion queue / comparisons / coverage / governance actions` 等治理对象。
- baseline、champion 和 comparison insight 已成为正式治理锚点。
- 批量晋级、补跑回测、补做评估等研究治理动作已具备统一留痕。
- 研究治理动作能够在 operator action、audit 或 notification 历史中回看。

### 4. Replay And Traceability

- 策略详情已具备统一的 `replayTimeline / replaySummary`，覆盖注册、任务、工作流、回测、结果、评估、报告、治理和执行交接。
- 研究工作台与详情页之间具备稳定深链，可以从工作台跳回策略或回测对象继续处置。
- 研究链路中的关键时间线对象已具备统一字段语义，不需要页面自行猜测上下游关系。

### 5. Execution Candidate Handoff

- `execution candidate handoff` 已成为研究侧正式对象，而不是执行页本地拼装结果。
- 策略页可创建 handoff，执行页可查看并排队 handoff 进入 execution workflow。
- research hub、策略详情和执行工作台能以一致的方式展示 handoff 状态、风险态和审批态。
- execution handoff 已成为阶段 3 执行闭环的稳定入口对象。

### 6. 工程化与验证

- `npm run verify` 继续作为阶段 2 的统一校验入口。
- 阶段 2 的专项基线测试覆盖 research hub、strategy replay、governance 和 execution handoff 合同。
- README、`project-structure.md` 和本 closeout 文档对当前阶段、完成定义和下一阶段入口保持一致。
- 阶段 2 新增对象契约若破坏上述基线，应视为回归，而不是正常演进。

## 明确非目标

以下内容不属于阶段 2 收官要求：

- 真实 broker 订单状态机与成交回报
- 多 broker 执行适配与环境切换
- 完整的持仓同步、账户权益同步和失败补偿体系
- 组合级风险控制、熔断恢复和盘中调度中台
- Agent 的规划、记忆和工具编排闭环
- 生产级数据库、缓存、对象存储和部署体系

## 进入阶段 3 的前置条件

当以下条件同时满足时，阶段 3 可以正式启动：

1. 研究任务、结果、评估、报告、治理和 handoff 能稳定通过 `verify` 与阶段 2 基线测试。
2. README、架构文档和当前研发重点已从“研究闭环”转向“执行闭环与交易中台”。
3. execution handoff 已经成为研究到执行前的标准交接对象，而不是页面内临时状态。
4. 策略详情和研究工作台已具备稳定 replay 能力，可支撑后续执行排查和风险追踪。

## 当前已达成的收官信号

截至当前仓库状态，以下信号已经出现：

- 回测任务、结果、评估、报告和治理动作已形成统一的研究异步骨架。
- baseline / champion / comparison insight 已进入研究工作台。
- 策略详情已具备 research replay timeline，并开始纳入 execution handoff 事件。
- 策略页可创建正式 execution handoff，执行页可直接接手并排队进入 execution workflow。
- research hub 已开始统一暴露研究总结、治理动作和 handoff 快照，减少页面层自拼装逻辑。

## 剩余收官动作

阶段 2 的收官动作已经完成，后续重点应转向：

- 保持研究对象契约稳定，不在阶段 3 中返工 research hub、replay 和 handoff 边界。
- 用专项基线测试守住研究总览、策略详情和 execution handoff 合同。
- 让执行、风险和调度侧继续围绕 execution handoff 对象扩展，而不是重新发明交接模型。

## 验证基线

阶段 2 收官时默认应通过以下检查：

1. `npm run verify`
2. 研究闭环专项 API 基线测试
3. README、`project-structure.md`、`stage-1-closeout.md` 和本 closeout 文档的一致性检查

阶段 2 收官后，新的执行闭环提交若破坏上述基线，应视为回归，而不是正常演进。
