# 阶段 3 收官定义：执行闭环与交易中台

本文档定义 QuantPilot 在“阶段 3：执行闭环与交易中台”收官时应达到的能力边界、完成标准、非目标和进入阶段 4 的前置条件。

## 目标

阶段 3 的目标不是一次性做完多 broker 生产接入，而是把执行链路从“研究 handoff 之后的一组静态计划对象”推进成“可路由、可承接、可对账、可恢复、可运营”的正式执行闭环。

收官时应满足以下判断：

- `execution handoff -> workflow -> plan -> run -> order state -> broker event -> reconciliation -> compensation -> recovery -> incident` 已形成稳定对象流。
- 执行台不再只是查看单条计划，而是具备队列化运营、批量处置和 incident 联动能力。
- broker 回报、账户快照、执行 runtime 和 execution incident 已具备统一查询与回放语义。
- 阶段 4 所需的风险、调度和更深 broker 抽象可以围绕现有 execution 对象扩展，而不需要返工阶段 3 的核心执行契约。

## 完成定义

### 1. Execution Lifecycle Backbone

- `execution candidate handoff` 已能稳定转换为 execution workflow、execution plan 和 execution run。
- 执行计划、执行运行和订单状态之间具备正式关联字段，而不是页面内拼接关系。
- 执行详情、执行账本和执行工作台都能稳定展示同一条 lifecycle 主链路。

### 2. Order State Machine And Broker Events

- 订单状态机已具备 `awaiting_approval / submitted / acknowledged / partial_fill / filled / cancelled / failed` 等核心状态语义。
- broker `acknowledged / partial fill / filled / rejected / cancelled` 回报已沉淀为结构化事件，并驱动订单与执行运行状态更新。
- execution plan detail、execution ledger 和 broker event history 能一致展示 broker 回报上下文。

### 3. Reconciliation, Compensation And Recovery

- 执行对账已覆盖 `orders / fills / positions / cash / buyingPower / equity / capital cadence` 等核心信号。
- 异常策略已具备正式的 `exceptionPolicy / compensation / recovery` 合同，而不是页面侧临时判断。
- 执行台可直接发起 `reconcile / compensate / recover`，并把结果留痕到 operator action、audit、notification 或 incident。
- 账户级对账缺失值、快照节奏和异常漂移已具备稳定 guardrail，不会因数据缺口误报为正常 drift。

### 4. Execution Operations Console

- execution workbench 已具备 `summary / queues / ownerLoad / nextActions` 等正式运营台结构。
- 执行台可按审批、重试、补偿、自动补偿、incident 和活跃路由等队列聚焦账本。
- 批量处置能力已覆盖至少 `approve / reconcile / compensate / recover` 等核心动作。
- execution incident 已能在执行台中直接认领、推进、关闭并记录备注，不需要完全跳转到其他控制台才能处置。

### 5. Traceability And Contracts

- execution workbench、execution detail、broker events、execution incidents 和相关 control-plane feed 已具备稳定查询合同。
- README、`project-structure.md` 和本 closeout 文档对阶段 3 状态、完成定义和阶段 4 入口保持一致。
- 阶段 3 新增执行对象若破坏上述合同，应视为回归，而不是正常演进。

### 6. 工程化与验证

- `npm run verify` 继续作为阶段 3 的统一校验入口。
- 阶段 3 的专项基线测试覆盖 execution workbench、execution detail、broker events、compensation、recovery 和 incident triage 合同。
- queue focus、bulk actions 和 execution incident triage 至少有前端辅助测试或契约测试兜底。

## 明确非目标

以下内容不属于阶段 3 收官要求：

- 多 broker 的生产级真实下单接入
- 生产级资金账户、清算、结算和券商对账
- 组合级和账户级高级风险中台
- 盘中调度编排、预开盘/盘后恢复和日终批处理体系
- Agent 主动发单、自动规划和无人值守实盘
- 生产级数据库、消息队列、缓存和部署体系

## 进入阶段 4 的前置条件

当以下条件同时满足时，阶段 4 可以正式启动：

1. execution workbench、execution detail、broker events、reconciliation、compensation 和 recovery 能稳定通过 `verify` 与阶段 3 基线测试。
2. README、架构文档和当前研发重点已从“执行闭环与交易中台”转向“风险与调度中台深化”。
3. execution incident、批量处置和 queue-based operations 已形成稳定交互，不需要再回退到逐条页面处理。
4. 阶段 4 的风险和调度扩展将围绕当前 execution contracts 演进，而不是重新发明 execution handoff、plan、run 或 broker event 模型。

## 当前已达成的收官信号

截至当前仓库状态，以下信号已经出现：

- execution handoff 已稳定进入 execution workflow、execution plan、execution run 和 order lifecycle 主链路。
- broker execution events 已具备独立持久化与查询边界，并进入 execution detail 与 execution console。
- execution reconciliation 已覆盖账户和持仓级信号，包含 cash、buying power、equity、deployed capital、residual capital 和 snapshot cadence。
- exception policy、compensation automation、recovery posture 和 execution incident 联动已进入执行台。
- execution operations console 已具备 queue focus、bulk actions、owner load 和 execution incident triage。

## 剩余收官动作

阶段 3 的收官动作已经完成，后续重点应转向：

- 保持 execution contracts 稳定，不在阶段 4 中返工 execution handoff、lifecycle、broker events 和 reconciliation 语义。
- 用专项基线测试守住 execution workbench、incident triage 和 compensation/recovery 合同。
- 让风险和调度的深化继续围绕 execution workbench 与 incident/feed 对象扩展，而不是绕开阶段 3 的执行中台边界。

## 验证基线

阶段 3 收官时默认应通过以下检查：

1. `npm run verify`
2. 执行闭环专项 API 基线测试
3. README、`project-structure.md`、`stage-1-closeout.md`、`stage-2-closeout.md` 和本 closeout 文档的一致性检查

阶段 3 收官后，新的风险、调度或 broker 适配提交若破坏上述基线，应视为回归，而不是正常演进。
