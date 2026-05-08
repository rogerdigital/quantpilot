import { EmptyState } from '../layout/ConsoleChrome.tsx';

interface ContextualEmptyProps {
  locale?: 'zh' | 'en';
  onAction?: () => void;
}

export function EmptyStrategies({ locale = 'en', onAction }: ContextualEmptyProps) {
  return (
    <EmptyState
      icon="📊"
      message={locale === 'zh' ? '暂无策略' : 'No strategies yet'}
      detail={
        locale === 'zh'
          ? '创建你的第一个量化策略，开始回测和优化。'
          : 'Create your first quantitative strategy to start backtesting and optimizing.'
      }
      actionLabel={locale === 'zh' ? '创建策略' : 'Create Strategy'}
      onAction={onAction}
    />
  );
}

export function EmptyPositions({ locale = 'en' }: ContextualEmptyProps) {
  return (
    <EmptyState
      icon="📈"
      message={locale === 'zh' ? '暂无持仓' : 'No open positions'}
      detail={
        locale === 'zh'
          ? '当前账户没有活跃持仓。执行策略或手动下单开始交易。'
          : 'No active positions in this account. Execute a strategy or place manual orders to start trading.'
      }
    />
  );
}

export function EmptySignals({ locale = 'en' }: ContextualEmptyProps) {
  return (
    <EmptyState
      icon="⚡"
      message={locale === 'zh' ? '暂无信号' : 'No signals detected'}
      detail={
        locale === 'zh'
          ? '系统未检测到交易信号。请检查策略配置和数据源连接。'
          : 'No trading signals detected. Check strategy configuration and data source connections.'
      }
    />
  );
}

export function EmptyBacktests({ locale = 'en', onAction }: ContextualEmptyProps) {
  return (
    <EmptyState
      icon="🔬"
      message={locale === 'zh' ? '暂无回测记录' : 'No backtest results'}
      detail={
        locale === 'zh'
          ? '运行回测来评估策略的历史表现。'
          : "Run a backtest to evaluate your strategy's historical performance."
      }
      actionLabel={locale === 'zh' ? '运行回测' : 'Run Backtest'}
      onAction={onAction}
    />
  );
}

export function EmptyOrders({ locale = 'en' }: ContextualEmptyProps) {
  return (
    <EmptyState
      icon="📋"
      message={locale === 'zh' ? '暂无委托' : 'No orders'}
      detail={
        locale === 'zh'
          ? '当前没有活跃委托。使用快捷下单栏或交易面板提交订单。'
          : 'No active orders. Use the quick order bar or trading panel to submit orders.'
      }
    />
  );
}

export function EmptyWatchlist({ locale = 'en', onAction }: ContextualEmptyProps) {
  return (
    <EmptyState
      icon="👁️"
      message={locale === 'zh' ? '监控列表为空' : 'Watchlist is empty'}
      detail={
        locale === 'zh'
          ? '添加标的到监控列表以跟踪价格和信号变化。'
          : 'Add symbols to your watchlist to track price and signal changes.'
      }
      actionLabel={locale === 'zh' ? '添加标的' : 'Add Symbol'}
      onAction={onAction}
    />
  );
}
