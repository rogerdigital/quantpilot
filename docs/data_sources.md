# 数据说明

当前版本已经迁移到 Vite + React + TypeScript + React Router，数据与业务状态统一收敛在 React 状态层和 TypeScript 类型定义中。

## 当前数据分层

- [TradingSystemProvider.tsx](../apps/web/src/store/trading-system/TradingSystemProvider.tsx)
  - Provider 生命周期和用户交互动作

- [core.ts](../apps/web/src/store/trading-system/core.ts)
  - 统一导出入口，向 Provider 暴露状态机构建和推进函数

- `apps/web/src/store/trading-system/core/`
  - `config.ts`: 系统参数和股票池定义
  - `market.ts`: 行情扰动、评分、报价补丁
  - `strategy.ts`: 候选信号到动作意图的转换
  - `risk.ts`: 风险闸门和减仓保护
  - `execution.ts`: 本地成交、远程意图、broker 同步
  - `lifecycle.ts`: 本地市场与交易周期推进
  - `controlPlane.ts`: 后端控制面裁决结果并入本地状态
  - `state.ts`: 初始状态装配
  - `shared.ts`: 深拷贝、记账、日志等共享工具

- [DashboardConsole.tsx](../apps/web/src/pages/console/DashboardConsole.tsx)
  - 各个路由页面的展示层
  - 图表绘制
  - 股票池、持仓、订单、日志渲染

- [trading.ts](../packages/shared-types/src/trading.ts)
  - 交易系统核心类型
  - Provider、账户、订单、行情、状态定义

- [market_data.json](../apps/web/src/data/market_data.json)
  - 当前未接入核心运行链路
  - 仅保留为历史样例数据文件

## 当前口径

- 行情是本地模拟行情流，不是外部实时市场数据
- `实盘账户` 在未配置远程 provider 时会退回本地模拟链路
- 页面上的账户、订单、权益曲线和日志都来自统一的 React 状态机
- 每个本地交易周期结束后，前端会把周期摘要提交到后端 `cycle runner`，再消费控制面返回的裁决结果
- 对远程 broker 的订单提交和状态同步，当前已由后端 `cycle runner` 代为执行并把结果回传给前端状态机
- 远程 broker 订单会先进入待确认意图队列，再根据网关回包和 broker 状态同步更新
- 开启人工确认后，live 订单会先进入审批队列，只有批准后才会进入提交队列

## 如果接入真实交易

建议优先后移 `apps/web/src/store/trading-system/core/` 中这几类逻辑：

1. 行情刷新逻辑替换为实时行情 API
2. 买卖执行逻辑替换为 broker / OMS 下单接口
3. 账户与订单状态替换为真实成交回报和资金持仓同步

## 路由说明

当前前端产品路由为：

- `/dashboard`
- `/market`
- `/strategies`
- `/backtest`
- `/risk`
- `/execution`
- `/agent`
- `/notifications`
- `/settings`

部署时需要确保这些路径都被重写到根入口 `index.html`。
