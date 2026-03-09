# Notification

负责通知聚合与分发，包括站内消息、邮件和外部 IM 通道。

当前原型已经拆成两段：

- API 负责把通知写入 outbox
- `apps/worker` 负责消费 outbox 并写入已分发事件流
