# Backend Modules

`apps/api/src/modules/` 先按 QuantPilot 的平台底座拆出后端模块边界。当前仓库仍以前端原型为主，但已经在控制面落下最小可运行服务。

当前模块规划：

- `api-gateway/`: REST、WebSocket、限流、入口编排
- `auth/`: 登录、鉴权、令牌、权限模型
- `user-account/`: 用户资料、账户状态、券商绑定
- `task-orchestrator/`: 回测、优化、Agent、执行等异步任务编排
- `notification/`: 站内信、邮件、IM 告警
- `audit/`: 审计日志、操作留痕、执行理由
- `monitoring/`: 日志、指标、运行健康监控
- `scheduler/`: 定时任务、盘前盘后批处理

当前已实现的最小接口：

- `auth/service.mjs`: `GET /api/auth/session`
- `audit/service.mjs`: `GET /api/audit/records`、`POST /api/audit/records`
- `notification/service.mjs`: `GET /api/notification/events`
- `task-orchestrator/service.mjs`: `GET /api/task-orchestrator/cycles`、`POST /api/task-orchestrator/cycles`、`POST /api/task-orchestrator/actions`
- `task-orchestrator/cycle-runner.mjs`: `POST /api/task-orchestrator/cycles/run`
  - 在记录周期后执行 broker 提交与状态同步，并返回控制面裁决
- `task-orchestrator/state-runner.mjs`: `POST /api/task-orchestrator/state/run`
  - 基于前端提交的当前状态，在后端拉取市场快照、调用 `packages/trading-engine` 共享 runtime 推进状态，再返回新的完整状态

后续演进方向：

- `apps/worker/` 将接管真正的后台任务执行，包括风险扫描、重试补偿、通知分发和定时编排。
