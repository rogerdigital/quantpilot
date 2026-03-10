# Task Orchestrator

负责回测、优化、Agent 分析、风险扫描和执行任务的异步编排。

当前 `modules/task-orchestrator/` 主要保留兼容入口：

- `service.mjs` 指向 `apps/api/src/control-plane/task-orchestrator/services/`
- runner 实现已经迁到 `apps/api/src/control-plane/task-orchestrator/`
