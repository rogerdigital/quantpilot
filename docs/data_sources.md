# 数据说明

当前版本已经迁移到 Vite + React + TypeScript + React Router，数据与业务状态统一收敛在 React 状态层和 TypeScript 类型定义中。

## 当前数据分层

- [src/system/useTradingSystem.tsx](../src/system/useTradingSystem.tsx)
  - 股票池定义
  - 系统参数
  - 模拟盘与实盘账户初始状态
  - 行情扰动与刷新周期
  - 信号评分
  - 自动买卖执行
  - 风控与活动日志

- [src/components/Dashboard.tsx](../src/components/Dashboard.tsx)
  - 各个路由页面的展示层
  - 图表绘制
  - 股票池、持仓、订单、日志渲染

- [src/types/trading.ts](../src/types/trading.ts)
  - 交易系统核心类型
  - Provider、账户、订单、行情、状态定义

- [src/data/market_data.json](../src/data/market_data.json)
  - 当前未接入核心运行链路
  - 仅保留为历史样例数据文件

## 当前口径

- 行情是本地模拟行情流，不是外部实时市场数据
- `实盘账户` 在未配置远程 provider 时会退回本地模拟链路
- 页面上的账户、订单、权益曲线和日志都来自统一的 React 状态机
- 远程 broker 订单会先进入待确认意图队列，再根据网关回包和 broker 状态同步更新
- 开启人工确认后，live 订单会先进入审批队列，只有批准后才会进入提交队列

## 如果接入真实交易

建议优先替换 [src/system/useTradingSystem.tsx](../src/system/useTradingSystem.tsx) 中这几类逻辑：

1. 行情刷新逻辑替换为实时行情 API
2. 买卖执行逻辑替换为 broker / OMS 下单接口
3. 账户与订单状态替换为真实成交回报和资金持仓同步

## 路由说明

当前前端路由为：

- `/overview`
- `/market`
- `/signals`
- `/execution`
- `/portfolio`
- `/settings`

部署时需要确保这些路径都被重写到根入口 `index.html`。
