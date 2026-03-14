# Monitoring

负责运行日志、链路健康、异常追踪和任务状态监控。

当前原型阶段：

- `apps/api` 通过 `monitoring/service.mjs` 暴露运行态摘要
- `apps/api` 可读取 monitoring snapshots / alerts 历史
- 当前摘要覆盖 broker、market、worker、workflow、risk 和队列积压
- worker 健康度当前优先基于独立 `worker heartbeat` 记录判断，并保留 scheduler tick 作为调度参考
- `apps/worker` 会周期性记录 monitoring snapshot，供通知中心和后续运维视图追踪历史
