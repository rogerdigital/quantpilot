# Backend Modules

`apps/api/src/modules/` 现在主要承担 2 个角色：

- 对外稳定导出入口
- 尚未完全迁移到 `domains/` 或 `control-plane/` 的兼容壳层

当前仓库已经不再把 `modules/` 视作唯一实现目录。真实实现正在逐步迁到：

- `apps/api/src/domains/`
- `apps/api/src/control-plane/`

因此，这里的职责重点已经从“承载全部后端实现”转为“维持模块边界稳定、避免目录演进打断主链路”。

当前模块边界：

- `api-gateway/`: REST、WebSocket、限流、入口编排
- `auth/`: 登录、鉴权、令牌、权限模型
- `user-account/`: 用户资料、账户状态、券商绑定
- `task-orchestrator/`: 回测、优化、Agent、执行等异步任务编排入口，真实服务已迁到 `control-plane/task-orchestrator/`
- `notification/`: 站内信、邮件、IM 告警
- `risk/`: 风险扫描、风险事件流、审批前风险结论，真实服务已迁到 `domains/risk/`
- `audit/`: 审计日志、操作留痕、执行理由
- `monitoring/`: 日志、指标、运行健康监控
- `scheduler/`: 定时任务、盘前盘后批处理

当前已实现的最小接口：

- `auth/service.mjs`: `GET /api/auth/session`
- `user-account/service.mjs`: `GET /api/user-account`、`GET /api/user-account/profile`、`POST /api/user-account/profile`、`POST /api/user-account/preferences`、`GET /api/user-account/broker-bindings`、`GET /api/user-account/broker-bindings/runtime`、`POST /api/user-account/broker-bindings`、`POST /api/user-account/broker-bindings/sync`
- `audit/service.mjs`: `GET /api/audit/records`、`POST /api/audit/records`
- `notification/service.mjs`: `GET /api/notification/events`
- `risk/service.mjs`: `GET /api/risk/events`
- `scheduler/service.mjs`: `GET /api/scheduler/ticks`
- `task-orchestrator/service.mjs`: `GET /api/task-orchestrator/cycles`、`POST /api/task-orchestrator/cycles`、`GET /api/task-orchestrator/actions`、`POST /api/task-orchestrator/actions`
- `task-orchestrator/cycle-runner.mjs`: `POST /api/task-orchestrator/cycles/run`
  - 在记录周期后执行 broker 提交与状态同步，并返回控制面裁决
- `task-orchestrator/state-runner.mjs`: `POST /api/task-orchestrator/state/run`
  - 基于前端提交的当前状态，在后端拉取市场快照、调用 `packages/trading-engine` 共享 runtime 推进状态，再返回新的完整状态

当前目录迁移状态：

- `strategy/service.mjs` 直接转发到 `apps/api/src/domains/strategy/services/`
- `backtest/service.mjs` 直接转发到 `apps/api/src/domains/backtest/services/`
- `agent/service.mjs` 直接转发到 `apps/api/src/domains/agent/services/`
- `risk/service.mjs` 直接转发到 `apps/api/src/domains/risk/services/`
- `execution/service.mjs` 直接转发到 `apps/api/src/domains/execution/services/`
- `task-orchestrator/service.mjs` 直接转发到 `apps/api/src/control-plane/task-orchestrator/services/`

后续演进方向：

- `apps/worker/` 将接管真正的后台任务执行，包括风险扫描、重试补偿、通知分发和定时编排。
- 当前 notification 已经切到 `queueNotification -> apps/worker dispatch` 模式，不再依赖 API 进程内存直接分发。
- 当前 risk scan 已经切到 `queueRiskScan -> apps/worker process` 模式，风险事件会单独沉淀到后端事件流。
- 当前 scheduler tick 已经切到 `apps/worker -> scheduler service/store` 模式，API 只负责读取调度事件流。
- 当前 audit records 和 cycle records 也已经切到 `control-plane-store`，不再驻留在 API 进程内存里。
- 当前 operator actions 也已经切到 `control-plane-store`，通知中心可直接查看独立动作流。
