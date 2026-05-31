# Backend Modules

`apps/api/src/modules/` 是轻量版 Core Console 的兼容边界，保留 API 网关、认证会话、行情、策略、回测、交易、执行和风控相关入口。

当前公开路由面：

- `GET /api/health`
- `GET /api/auth/session`
- `/api/market/*`
- `/api/strategy/*`
- `/api/backtest/*`
- `/api/trading/*`
- `/api/execution/*`
- `/api/risk/*`

已删除的后台任务、通知、调度、审计、运营、协作、研究和自主助手路由不再属于活跃产品面。后续改造应继续把剩余实现收敛到上述核心接口，避免重新引入异步任务平台或机构级控制面依赖。
