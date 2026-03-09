# Scheduler

负责盘前分析、盘后复盘、定时同步和周期性报告任务。

当前原型阶段：

- `apps/worker` 周期性执行 scheduler tick
- `apps/api` 通过 `scheduler/service.mjs` 暴露调度事件读取接口
