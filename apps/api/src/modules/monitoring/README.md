# Monitoring

负责运行日志、链路健康、异常追踪和任务状态监控。

当前原型阶段：

- `apps/api` 通过 `monitoring/service.mjs` 暴露运行态摘要
- 当前摘要覆盖 broker、market、worker、workflow、risk 和队列积压
- worker 健康度当前通过最新 `scheduler tick` 新鲜度近似判断
