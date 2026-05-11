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
- `packages/shared-types` 承载共享模型（含 AI Research、Data Science、Experiments、Lifecycle、Organization、Compute、Connectors、Risk Policy、Strategy Package、Platform Events）。
- `packages/db` 承载底层存储适配接口，当前提供 `collection/kv` 抽象和文件型 adapter，为从原型期 JSON 存储迁移到数据库预留边界。
- `packages/control-plane-store` 承载最小跨进程控制面存储，当前包含 notification outbox、risk scan outbox、通知事件、风险事件、scheduler ticks、audit records、cycle records、operator actions、dataset registry、feature registry、experiment registry、model registry、research workspaces、compute jobs、organization/workspace/team、audit reports 和 artifact integrity 持久化。
- `packages/control-plane-runtime` 承载控制面共享服务装配层，统一封装 audit、notification、risk、scheduler、cycles、workflow runs、permission policies、connector registry 和 platform event bus。
- `packages/trading-engine` 承载市场、策略、风控、执行和控制面状态合并所需的共享 runtime，包含 backtest engine (commission/slippage models, regime/sector/signal/turnover attribution, robustness diagnostics)、strategy lifecycle (promotion gates)、risk policy engine、order lifecycle state machine、recovery workflows、connectors (data/broker) 和 strategy package validator。
- `packages/task-workflow-engine` 承载 task workflow shared execution layer，包含 cycle/state/manual-review workflow executors 和 review workflows (5 types: research critique, overfit review, risk violation, promotion memo, incident summary)。
