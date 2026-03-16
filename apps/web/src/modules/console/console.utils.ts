import type { AccountState, AppLocale, StockState } from '@shared-types/trading.ts';
import { copy } from './console.i18n.tsx';

export function fmtCurrency(value: number) {
  return `¥${Math.round(value).toLocaleString('zh-CN')}`;
}

export function fmtPct(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function fmtDateTime(value: string | undefined, locale: AppLocale = 'zh') {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function translateSignal(locale: AppLocale, signal: string) {
  if (locale === 'zh') return ({ BUY: '买入', HOLD: '持有', SELL: '卖出' } as Record<string, string>)[signal] || signal;
  return ({ BUY: 'BUY', HOLD: 'HOLD', SELL: 'SELL', 买入: 'BUY', 持有: 'HOLD', 卖出: 'SELL' } as Record<string, string>)[signal] || signal;
}

export function translateSide(locale: AppLocale, side: string) {
  return translateSignal(locale, side);
}

export function translateOrderStatus(locale: AppLocale, status: string | undefined) {
  const normalized = String(status || '--').toLowerCase();
  const zhMap: Record<string, string> = {
    filled: '已成交',
    canceled: '已撤单',
    cancelled: '已撤单',
    expired: '已过期',
    rejected: '已拒绝',
    new: '新建',
    accepted: '已接收',
    pending_new: '待提交',
    partially_filled: '部分成交',
    unknown: '未知',
    '--': '--',
  };
  const enMap: Record<string, string> = {
    filled: 'Filled',
    canceled: 'Canceled',
    cancelled: 'Canceled',
    expired: 'Expired',
    rejected: 'Rejected',
    new: 'New',
    accepted: 'Accepted',
    pending_new: 'Pending',
    partially_filled: 'Partial',
    unknown: 'Unknown',
    '--': '--',
  };
  return (locale === 'zh' ? zhMap : enMap)[normalized] || status || '--';
}

export function translateEngineStatus(locale: AppLocale, status: string) {
  const map = locale === 'zh'
    ? { BOOTING: '启动中', 'MANUAL READY': '手动待命', 'LIVE EXECUTION': '实时执行' }
    : { BOOTING: 'Booting', 'MANUAL READY': 'Manual Ready', 'LIVE EXECUTION': 'Live Execution' };
  return map[status as keyof typeof map] || status;
}

export function translateRiskLevel(locale: AppLocale, status: string) {
  const map = locale === 'zh'
    ? { NORMAL: '正常', 'RISK OFF': '风险关闭' }
    : { NORMAL: 'Normal', 'RISK OFF': 'Risk Off' };
  return map[status as keyof typeof map] || status;
}

export function integrationTone(connected: boolean, degraded = false, localMirror = false) {
  if (connected) return 'ok';
  if (localMirror) return 'muted';
  if (degraded) return 'warn';
  return 'muted';
}

export function riskTone(status: string) {
  return status === 'NORMAL' ? 'ok' : 'warn';
}

export function toggleTone(value: boolean) {
  return value ? 'ok' : 'muted';
}

export function modeTone(mode: string) {
  if (String(mode).toLowerCase() === 'autopilot') return 'ok';
  if (String(mode).toLowerCase() === 'hybrid') return 'info';
  return 'muted';
}

export function engineTone(status: string) {
  if (status === 'LIVE EXECUTION') return 'ok';
  if (status === 'BOOTING') return 'warn';
  return 'muted';
}

export function connectionLabel(locale: AppLocale, connected: boolean, degraded = false, localMirror = false) {
  if (connected) return copy[locale].labels.online;
  if (localMirror) return copy[locale].labels.localMirror;
  if (degraded) return copy[locale].labels.degraded;
  return copy[locale].labels.disabled;
}

export function monitoringTone(status: string | undefined) {
  if (status === 'healthy') return 'ok';
  if (status === 'warn') return 'warn';
  if (status === 'critical') return 'down';
  return 'muted';
}

export function translateMonitoringStatus(locale: AppLocale, status: string | undefined) {
  const normalized = String(status || '').toLowerCase();
  const zhMap: Record<string, string> = {
    info: '信息',
    healthy: '健康',
    warn: '告警',
    critical: '严重',
    open: '打开',
    investigating: '排查中',
    mitigated: '已缓解',
    resolved: '已解决',
  };
  const enMap: Record<string, string> = {
    info: 'Info',
    healthy: 'Healthy',
    warn: 'Warning',
    critical: 'Critical',
    open: 'Open',
    investigating: 'Investigating',
    mitigated: 'Mitigated',
    resolved: 'Resolved',
  };
  return (locale === 'zh' ? zhMap : enMap)[normalized] || (status || '--');
}

export function translateMode(locale: AppLocale, mode: string) {
  const map = locale === 'zh'
    ? { autopilot: '自动', hybrid: '混合', manual: '手动', AUTOPILOT: '自动', 'AUTO PILOT': '自动', HYBRID: '混合', MANUAL: '手动' }
    : { autopilot: 'AUTO', hybrid: 'HYBRID', manual: 'MANUAL', AUTOPILOT: 'AUTO', 'AUTO PILOT': 'AUTO', HYBRID: 'HYBRID', MANUAL: 'MANUAL' };
  return map[mode as keyof typeof map] || mode.toUpperCase();
}

export function translateActionText(locale: AppLocale, text: string) {
  const map: Record<string, string> = locale === 'zh'
    ? {
        'Watch for engine review': '等待引擎评估',
        'Add candidate': '加仓候选',
        'Trim or exit': '减仓或退出',
        'Hold and watch': '持仓观察',
      }
    : {
        '等待引擎评估': 'Watch for engine review',
        '加仓候选': 'Add candidate',
        '减仓或退出': 'Trim or exit',
        '持仓观察': 'Hold and watch',
      };
  return map[text] || text;
}

export function translateProviderLabel(locale: AppLocale, text: string) {
  const map: Record<string, string> = locale === 'zh'
    ? {
        '本地模拟行情': '本地模拟行情',
        'HTTP 行情网关': 'HTTP 行情网关',
        'Alpaca Market Data via Gateway': 'Alpaca 行情网关',
        '本地模拟 broker': '本地模拟 Broker',
        'HTTP Broker Gateway': 'HTTP Broker 网关',
        'Alpaca Trading API via Gateway': 'Alpaca 交易网关',
      }
    : {
        '本地模拟行情': 'Local Simulated Market Data',
        'HTTP 行情网关': 'HTTP Market Gateway',
        'Alpaca 行情网关': 'Alpaca Market Gateway',
        '本地模拟 broker': 'Local Simulated Broker',
        '本地模拟 Broker': 'Local Simulated Broker',
        'HTTP Broker 网关': 'HTTP Broker Gateway',
        'Alpaca 交易网关': 'Alpaca Trading Gateway',
      };
  return map[text] || text;
}

export function translateRuntimeText(locale: AppLocale, text: string) {
  if (!text) return text;
  if (locale === 'zh') {
    return text
      .replace('Watch for engine review', '等待引擎评估')
      .replace('Add candidate', '加仓候选')
      .replace('Trim or exit', '减仓或退出')
      .replace('Hold and watch', '持仓观察')
      .replace('Booting', '启动中')
      .replace('Manual Ready', '手动待命')
      .replace('Live Execution', '实时执行')
      .replace('Normal', '正常')
      .replace('Risk Off', '风险关闭');
  }

  let out = text;
  const replacements: Array<[RegExp, string]> = [
    [/等待首轮行情同步。/g, 'Waiting for the first market sync.'],
    [/等待首轮 broker 同步。/g, 'Waiting for the first broker sync.'],
    [/系统启动/g, 'System Started'],
    [/交易引擎已完成股票池初始化与账户装载。/g, 'The trading engine finished universe initialization and account loading.'],
    [/优先买入 (.+)/g, 'Priority buys: $1'],
    [/当前没有新的强买入信号/g, 'No new strong buy signals in this cycle'],
    [/减仓警报: (.+)/g, 'Trim alert: $1'],
    [/卖出阈值下暂无高危持仓。/g, 'No high-risk positions under the sell threshold.'],
    [/系统执行模拟盘，并同步提交实盘远程订单。/g, 'Paper execution is active and remote live orders are submitted in sync.'],
    [/系统同时写入模拟盘与本地实盘账户。/g, 'The system writes to both the paper and local live accounts.'],
    [/当前仅执行模拟盘，实盘账户暂停。/g, 'Only the paper account is executing. Live execution is paused.'],
    [/模拟盘/g, 'Paper'],
    [/实盘账户/g, 'Live Account'],
    [/风控/g, 'Risk Guard'],
    [/买入/g, 'Buy'],
    [/卖出/g, 'Sell'],
    [/股 @ /g, ' shares @ '],
    [/Broker 接收订单 (.+)/g, 'Broker received order $1'],
    [/订单状态更新 (.+)/g, 'Order status updated $1'],
    [/状态 /g, 'status '],
    [/撤单请求 (.+)/g, 'Cancel request $1'],
    [/使用本地模拟行情流。/g, 'Using the local simulated market data stream.'],
    [/未配置 VITE_MARKET_DATA_HTTP_URL，已回退到本地模拟行情。/g, 'VITE_MARKET_DATA_HTTP_URL is not configured. Fell back to local simulated market data.'],
    [/HTTP 行情网关已更新 (\d+) 只股票。/g, 'HTTP market gateway updated $1 symbols.'],
    [/HTTP 行情网关返回空结果，保留模拟行情。/g, 'HTTP market gateway returned no data. Keeping simulated quotes.'],
    [/HTTP 行情网关不可用，已回退到本地模拟行情。/g, 'HTTP market gateway unavailable. Fell back to local simulated market data. '],
    [/Alpaca 行情已更新 (\d+) 只股票。/g, 'Alpaca market data updated $1 symbols.'],
    [/Alpaca 返回空行情，保留当前价格。/g, 'Alpaca returned no quotes. Keeping current prices.'],
    [/Alpaca 行情不可用，已回退到本地模拟行情。/g, 'Alpaca market data unavailable. Fell back to local simulated market data. '],
    [/使用本地模拟 broker 执行订单。/g, 'Using the local simulated broker to execute orders.'],
    [/使用本地模拟 broker 执行和回报。/g, 'Using the local simulated broker for execution and fills.'],
    [/本地模拟 broker 无远程撤单动作。/g, 'The local simulated broker has no remote cancel action.'],
    [/未配置 VITE_BROKER_HTTP_URL，当前仅使用本地实盘账户模拟链路。/g, 'VITE_BROKER_HTTP_URL is not configured. Only the local live mirror is active.'],
    [/Broker 网关已同步 (\d+) 笔订单。/g, 'Broker gateway synced $1 orders.'],
    [/Broker 网关不可用，保留本地镜像执行。/g, 'Broker gateway unavailable. Keeping local mirrored execution. '],
    [/未配置 VITE_BROKER_HTTP_URL，无法同步远程账户。/g, 'VITE_BROKER_HTTP_URL is not configured. Cannot sync the remote account.'],
    [/Broker 网关状态同步成功。/g, 'Broker gateway state sync succeeded.'],
    [/Broker 状态同步失败。/g, 'Broker state sync failed. '],
    [/未配置 VITE_BROKER_HTTP_URL，无法撤单。/g, 'VITE_BROKER_HTTP_URL is not configured. Cancel is unavailable.'],
    [/Broker 网关已发出撤单请求 (.+)。/g, 'Broker gateway submitted a cancel request for $1.'],
    [/Broker 撤单失败。/g, 'Broker cancel failed. '],
    [/本轮没有新的远程订单。/g, 'No new remote orders in this cycle.'],
    [/Alpaca 已接收 (\d+) 笔订单。/g, 'Alpaca accepted $1 orders.'],
    [/Alpaca 下单失败。/g, 'Alpaca order submission failed. '],
    [/Alpaca 账户、持仓和订单状态同步成功。/g, 'Alpaca account, positions, and order state sync succeeded.'],
    [/Alpaca 状态同步失败。/g, 'Alpaca state sync failed. '],
    [/Alpaca 已提交撤单请求 (.+)。/g, 'Alpaca submitted a cancel request for $1.'],
    [/Alpaca 撤单失败。/g, 'Alpaca cancel failed. '],
    [/当前没有新的执行记录。/g, 'No new execution records yet.'],
    [/Approval granted (.+)/g, 'Approval granted $1'],
    [/Approval rejected (.+)/g, 'Approval rejected $1'],
    [/moved to broker submission queue\./g, 'moved to broker submission queue.'],
    [/were rejected before broker submission\./g, 'were rejected before broker submission.'],
    [/最新动作: /g, 'Latest action: '],
  ];
  replacements.forEach(([pattern, value]) => {
    out = out.replace(pattern, value);
  });
  return out;
}

export function statusClass(status: string | undefined) {
  if (['filled'].includes(status || '')) return 'order-status-filled';
  if (['canceled', 'cancelled', 'expired', 'rejected'].includes(status || '')) return 'order-status-canceled';
  if (['new', 'accepted', 'pending_new', 'partially_filled'].includes(status || '')) return 'order-status-open';
  return 'order-status-muted';
}

export function rowsForPositions(account: AccountState, stocks: StockState[]) {
  return Object.entries(account.holdings)
    .map(([symbol, holding]) => {
      const stock = stocks.find((item) => item.symbol === symbol);
      if (!stock) return null;
      const marketValue = stock.price * holding.shares;
      const pnl = (stock.price - holding.avgCost) * holding.shares;
      return { ...holding, symbol, name: stock.name, marketValue, pnl };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((a, b) => b.marketValue - a.marketValue);
}

export function topSignalLabel(stocks: StockState[], locale: AppLocale) {
  const ranked = stocks.slice().sort((a, b) => b.score - a.score)[0];
  if (!ranked) return '--';
  return `${ranked.symbol} ${translateSignal(locale, ranked.signal)}`;
}
