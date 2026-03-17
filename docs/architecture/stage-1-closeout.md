# 阶段 1 收官定义：平台底座产品化

本文档定义 QuantPilot 在“阶段 1：平台底座产品化”收官时应达到的能力边界、完成标准、非目标和进入阶段 2 的前置条件。

## 目标

阶段 1 的目标不是把平台推进到可无人值守实盘，而是把“可演示原型”推进成“可持续研发的平台底座”。

收官时应满足以下判断：

- 平台基础对象已经从前端演示态迁移到稳定的服务边界。
- 控制面对象已经具备一致的查询、联动、留痕和处置入口。
- 运维与调查工作台已经能够支撑日常研发排查，而不是只展示静态信息。
- 前端页面的职责已经明显退回到状态消费与操作入口，核心编排留在后端和 worker。
- 阶段 2 所需的研究任务链、结果模型和审计链路已经有稳定入口，不需要再返工阶段 1 的基础对象。

## 完成定义

### 1. 账户与权限底座

- `auth / session / user-account / broker bindings` 已具备真实持久化读写边界。
- 设置页消费统一的 `account workspace` 快照，而不是散落的本地状态。
- 前后端对关键权限的判断、缺权限提示和 `403` 结构化错误语义一致。
- 账户、权限、券商绑定等关键变更具备最小审计留痕。

### 2. 控制面对象一致性

- `monitoring / notifications / audit / operator actions / scheduler / incidents` 已形成稳定的 list/detail/query pattern。
- 关键 feed 支持按时间窗口、级别、来源或阶段进行服务端查询，而不是纯前端本地筛选。
- 控制面视图具备跨面板联动、上下文聚焦和调查路径表达能力。
- 关键状态变更能在控制面历史中回看，不依赖单次页面状态。

### 3. Incident / Investigation 工作台

- 监控告警、控制面通知、审计、风控事件、工作流运行和执行计划可升级为 incident。
- incident 具备 evidence timeline、activity timeline、artifact inspector 和 response checklist。
- incident 队列具备 summary、owner load、aging、bulk actions 和运营视角。
- incident detail 具备基础 playbook tasks、owner/status 变更、备注留痕和证据聚合。

### 4. 运维工作台

- monitoring 已具备 status、snapshots、alerts 和 worker heartbeat 的历史来源。
- Overview 或 Notifications 中至少有一处可用的 operations workbench 聚合入口。
- 运维工作台能展示 runbook、热点泳道、最近信号和关键排查入口。
- 常见排查路径可通过 summary、timeline、board 和 evidence 直接下钻。

### 5. 研究与执行数据边界

- `strategy catalog / backtest runs / execution plans / execution runtime / account snapshots / execution ledger` 已具备结构化接口。
- 至少一批研究与执行页面已改为消费后端真实读写边界，而不再依赖纯前端示例状态。
- 工作流与执行记录能通过统一控制面对象联动追踪。

### 6. 工程化与验证

- `npm run verify` 是当前阶段的统一校验入口。
- 推送前通过 git hook 自动运行 `verify`，避免只在 CI 才暴露类型或构建错误。
- 阶段 1 的关键平台底座能力具备专项基线测试，能覆盖账户、权限、incident 和 operations workbench 这类核心接口。
- 阶段文档、README 和架构说明对“当前阶段”和“完成标准”的描述保持一致。

## 明确非目标

以下内容不属于阶段 1 收官要求：

- 多 broker 实盘执行闭环
- 真实订单状态机、成交回报与失败补偿体系
- 完整的组合级风控与熔断恢复系统
- Agent 的规划、记忆和工具编排闭环
- 租户、多用户隔离和生产级 RBAC
- 生产级数据库、缓存、对象存储和部署体系

## 进入阶段 2 的前置条件

当以下条件同时满足时，阶段 2 可以正式启动：

1. 阶段 1 的账户、权限、incident 和 operations workbench 能力已稳定通过 `verify` 和专项基线测试。
2. README、架构文档和当前研发重点已从“补底座”转向“研究与策略闭环”。
3. 回测、研究任务和工作流运行不再依赖临时页面拼装逻辑。
4. 研究结果、审计和控制面对象之间已有稳定的联动入口。

## 当前已达成的收官信号

截至当前仓库状态，以下信号已经出现：

- 账户域已统一到 `account workspace` 快照。
- 权限护栏已收敛到统一的后端 `403` 语义和前端 permission copy。
- incident / investigation 控制台已经形成证据、活动、批量处置和运营视角闭环。
- operations workbench 已能聚合 monitoring、incident、scheduler、connectivity 和 control-plane trail。
- risk console 已切到统一 `risk workbench` 聚合快照，能直接消费风险事件、执行复核、研究复核、风险 incident 和 broker live 暴露。
- 前后端验证链已经收敛到 `npm run verify` 和 `pre-push`。

## 剩余收官动作

阶段 1 的收官动作已经完成，后续重点应转向：

- 保持平台底座主链路稳定，不在阶段 2 中回补阶段 1 的基础对象。
- 让 README、架构说明和 closeout 文档继续随着阶段切换同步更新。
- 用专项基线测试守住核心对象契约，降低控制面接口漂移风险。

## 验证基线

阶段 1 收官时默认应通过以下检查：

1. `npm run verify`
2. 平台底座专项 API 基线测试
3. README、`project-structure.md` 和本 closeout 文档的一致性检查

阶段 1 收官后，新的大功能提交若破坏上述基线，应视为回归，而不是正常演进。
