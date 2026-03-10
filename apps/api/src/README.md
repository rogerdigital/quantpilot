# API Source Layout

`apps/api/src/` 当前按 4 类职责组织：

- `app/`: API 路由装配与请求入口
- `control-plane/`: 控制面编排与任务工作流实现
- `domains/`: 领域能力实现，包括 `agent / strategy / backtest / risk / execution`
- `modules/`: 兼容层与稳定导出入口，避免目录演进时打断现有调用方

当前目录目标不是把所有代码都永久留在 `modules/`，而是逐步把真实实现迁到 `domains/` 和 `control-plane/`，同时让 `modules/` 退化为薄适配层。

当前结构摘要：

- `app/routes/`
  - 平台接口与控制面接口路由分离
- `control-plane/task-orchestrator/`
  - cycle、action、workflow 三类编排服务
- `domains/strategy/`
  - 策略目录与执行候选生成
- `domains/backtest/`
  - 回测运行记录与研究摘要
- `domains/agent/`
  - 工具白名单与动作请求审批流
- `domains/risk/`
  - 风险事件读取、扫描队列、风险评估
- `domains/execution/`
  - 执行计划查询与写入
- `modules/`
  - 对外稳定导出入口，以及仍未迁移的模块壳层
