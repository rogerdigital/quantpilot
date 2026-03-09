# QuantPilot 分层架构

## 七层定义

**前端层**  
负责用户交互与可视化展示，承载仪表盘、策略管理、风控监控、执行控制、通知中心以及 Agent 协作界面，为用户提供统一的操作入口和状态观察窗口。

**后端层**  
负责 API 服务、身份鉴权、用户管理、任务编排、调度、通知、审计和日志监控，是整个平台的控制中枢，连接前端与各核心业务能力。

**数据层**  
负责统一管理市场数据、用户业务数据、交易数据、研究回测数据和系统事件数据，为策略、风控、执行和 Agent 提供可靠的数据基础与状态支撑。

**策略层**  
负责策略注册、信号生成、历史回测、参数优化和绩效评估，输出候选交易信号、目标仓位、调仓建议和策略评分，为下游决策提供依据。

**Agent 层**  
负责理解用户目标、规划任务、调用系统工具、分析结果并生成解释，在授权约束下提出操作建议或发起受控流程，但不直接绕过风控与执行边界。

**风控层**  
负责仓位限制、组合风险检查、回撤控制、波动保护、规则校验和紧急熔断，对策略输出和 Agent 发起的动作请求进行审核，是进入执行前的最终决策闸门。

**执行层**  
负责对接券商接口、订单管理、执行调度、成交处理和异常恢复，在风控放行和审批通过后，将结构化决策严格转换为真实交易动作。

## 核心协作关系

- `Strategy` 负责产出候选决策，不直接下单。
- `Agent` 负责理解目标、组织分析、解释结果，并发起受控动作请求。
- `Risk` 是所有执行动作的必经裁决层。
- `Execution` 是高可信落地层，只消费结构化、可审计的执行计划。

## 当前代码落点

- `apps/web` 承载前端层。
- `apps/api` 承载后端层和执行接入骨架，当前已经提供最小的 `auth / audit / notification / task-orchestrator` 控制面接口。
- `apps/worker` 承载后端异步任务进程骨架，用于承接未来从 API 进程迁出的任务编排、风险扫描、通知分发和执行补偿。
- `packages/shared-types` 承载共享模型。
- `packages/control-plane-store` 承载最小跨进程控制面存储，当前主要用于 notification outbox 和事件持久化。
- `packages/trading-engine` 承载市场、策略、风控、执行和控制面状态合并所需的共享 runtime，并已拆分为按职责划分的内部模块。
- `apps/web/src/store/trading-system/core/` 已完成第二轮切片，当前包含 `config / market / strategy / risk / execution / lifecycle / controlPlane / state / shared`，并主要作为共享 runtime 的前端封装层存在。
- `apps/web/src/store/trading-system/core.ts` 现在只保留兼容出口，避免页面层直接感知内部重构。
- `apps/web/src/store/trading-system/TradingSystemProvider.tsx` 当前会把本地状态快照提交到后端 `state run` 接口，并直接消费服务端返回的新周期状态。
- 远程 broker 的订单提交和状态同步已由后端 `cycle runner` 统一执行，前端不再在周期内直接调用 broker submit/sync。
- 市场数据拉取也已进入后端 `state runner`，前端不再在主周期里直接调用 market data provider。
- `state runner` 当前只负责服务端数据拉取、调用共享 runtime 推进状态、再交由控制面完成 broker 协调，前后端不再各自维护一份独立的交易周期实现。
- 通知链路当前已从 API 单进程内存改成 `API 入队 -> worker 分发 -> 前端拉取已分发事件`，为后续告警、邮件和 IM 通道扩展预留了后台执行边界。
