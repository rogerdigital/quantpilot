import { createContext, useContext, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { TradingSystemProvider, useTradingSystem } from '../system/useTradingSystem.tsx';
import type { AccountState, AppLocale, BrokerOrder, StockState } from '../types/trading.ts';

const LocaleContext = createContext<{ locale: AppLocale; setLocale: (locale: AppLocale) => void } | null>(null);

const copy = {
  zh: {
    product: 'quantpilot',
    tagline: '自主决策量化交易平台',
    heroTitle: '交易总览',
    heroSub: '将市场信号、策略决策、执行监控与风险控制整合到统一平台中，帮助你构建、评估并运行量化交易系统。',
    nav: {
      overview: '总览',
      market: '市场',
      signals: '信号',
      execution: '执行',
      portfolio: '组合',
      settings: '设置',
    },
    labels: {
      language: '语言',
      systemMode: '系统模式',
      routing: '执行路径',
      switches: '引擎开关',
      policy: '策略参数',
      integrations: '接入状态',
      paper: '模拟盘',
      live: '实盘账户',
      marketData: '行情源',
      marketState: '行情状态',
      broker: 'Broker',
      brokerState: 'Broker 状态',
      allowLive: '允许实盘账户执行',
      autoTrade: '自动执行买入/卖出',
      riskGuard: '高波动保护',
      manualApproval: '人工确认实盘订单',
      score: '评分',
      status: '状态',
      connected: '已连接',
      fallback: '回退',
      localOnly: '仅本地',
      exposure: '仓位',
      positions: '持仓',
      orders: '委托',
      latestSignal: '最新信号',
      marketClock: '行情时钟',
      systemStatus: '系统状态',
      mode: '模式',
      enabled: '已开启',
      disabled: '已关闭',
      online: '在线',
      degraded: '回退中',
      localMirror: '本地镜像',
    },
    terms: {
      totalNav: '总资产',
      paperNav: '账户净值',
      liveMirror: '实盘镜像',
      signalSummary: '信号摘要',
      runState: '运行状态',
      equityCurve: '账户权益曲线',
      executionSummary: '执行摘要',
      focusList: '重点机会',
      recentOrders: '最近委托',
      activityToday: '今日活动',
      riskLevel: '风险级别',
      tradeDecision: '买卖决策',
      latestDecision: '最新决策',
      totalAccountValue: '账户总额',
      paperPnl: '模拟盘收益',
      livePnl: '实盘收益',
      paperCash: '模拟盘现金',
      liveBuyingPower: '实盘可用资金',
      availableForEntries: '可用于自动开仓',
      remoteBuyingPower: '远程账户 buying power',
      portfolioState: '组合状态',
      marketPulse: '市场脉冲',
      universeMonitor: '监控列表',
      executionRoute: '执行路径',
      signalDistribution: '信号分布',
      universeScores: '股票池评分',
      executionLog: '执行日志',
      fillCount: '成交数量',
      paperOrders: '模拟盘订单',
      liveOrderState: '实盘订单状态',
      symbol: '股票',
      price: '价格',
      change: '涨跌',
      signal: '信号',
      action: '动作',
      side: '方向',
      qty: '数量',
      fill: '成交',
      time: '时间',
      avgCost: '成本',
      marketValue: '市值',
      unrealizedPnl: '浮盈亏',
      noOrders: '暂无委托记录',
      noPositions: '当前无持仓',
      noFills: '暂无成交',
      cancel: '撤单',
      approve: '批准',
      reject: '驳回',
      pendingApprovals: '待审批订单',
      marketConnectivity: '查看行情源与 Broker 的当前连接状态。',
      policyCopy: '查看买卖阈值、仓位和现金缓冲策略。',
      systemModeCopy: '配置平台当前运行模式。',
      switchesCopy: '控制自动交易、实盘执行、人工审批和风控保护。',
      buyThreshold: '买入阈值',
      sellThreshold: '卖出阈值',
      maxPosition: '单票上限',
      cashBuffer: '现金缓冲',
      riskProtection: '风险保护',
    },
    pages: {
      overview: ['总览', '集中观察净值、仓位、信号和最近委托，只保留盯盘主视图。'],
      market: ['市场监控', '跟踪股票池价格、强弱排序和行情接入状态。'],
      signals: ['信号中心', '查看当前周期的买卖判断、评分分布和信号方向。'],
      execution: ['执行中心', '跟踪订单状态、撤单动作和最新成交回报。'],
      portfolio: ['组合中心', '查看账户净值、现金、持仓和当前组合暴露。'],
      settings: ['系统设置', '管理运行模式、执行开关、参数和接入状态。'],
    },
    desk: {
      overview: 'Overview Desk',
      market: 'Market Desk',
      signals: 'Signal Desk',
      execution: 'Execution Desk',
      portfolio: 'Portfolio Desk',
      settings: 'Control Desk',
    },
    slogans: {
      heroEyebrow: 'Autonomous Intelligence for Quantitative Trading',
      commandCenter: 'Your Autonomous Quant Trading Command Center',
    },
    settingsIntro: '集中管理语言切换、运行模式、策略阈值、接入状态和执行开关。',
  },
  en: {
    product: 'quantpilot',
    tagline: 'Autonomous quant trading platform',
    heroTitle: 'Trading Overview',
    heroSub: 'Unify market signals, strategy decisions, execution monitoring, and risk control in one platform to build, evaluate, and run quantitative trading systems.',
    nav: {
      overview: 'Overview',
      market: 'Market',
      signals: 'Signals',
      execution: 'Execution',
      portfolio: 'Portfolio',
      settings: 'Settings',
    },
    labels: {
      language: 'Language',
      systemMode: 'System Mode',
      routing: 'Routing',
      switches: 'Engine Switches',
      policy: 'Decision Policy',
      integrations: 'Integrations',
      paper: 'Paper',
      live: 'Live',
      marketData: 'Market Data',
      marketState: 'Market State',
      broker: 'Broker',
      brokerState: 'Broker State',
      allowLive: 'Allow live account execution',
      autoTrade: 'Auto buy / sell',
      riskGuard: 'Volatility guard',
      manualApproval: 'Manual live approval',
      score: 'Score',
      status: 'Status',
      connected: 'Connected',
      fallback: 'Fallback',
      localOnly: 'Local only',
      exposure: 'Exposure',
      positions: 'Positions',
      orders: 'Orders',
      latestSignal: 'Latest Signal',
      marketClock: 'Market Clock',
      systemStatus: 'System Status',
      mode: 'Mode',
      enabled: 'Enabled',
      disabled: 'Disabled',
      online: 'Online',
      degraded: 'Degraded',
      localMirror: 'Local Mirror',
    },
    terms: {
      totalNav: 'Total NAV',
      paperNav: 'Paper NAV',
      liveMirror: 'Live Mirror',
      signalSummary: 'Signal Summary',
      runState: 'Run State',
      equityCurve: 'Equity Curve',
      executionSummary: 'Execution Summary',
      focusList: 'Focus List',
      recentOrders: 'Recent Orders',
      activityToday: 'Activity Today',
      riskLevel: 'Risk Level',
      tradeDecision: 'Trade Decision',
      latestDecision: 'Latest Decision',
      totalAccountValue: 'Total NAV',
      paperPnl: 'Paper PnL',
      livePnl: 'Live PnL',
      paperCash: 'Paper Cash',
      liveBuyingPower: 'Live Buying Power',
      availableForEntries: 'Available for automatic entries',
      remoteBuyingPower: 'Remote account buying power',
      portfolioState: 'Portfolio State',
      marketPulse: 'Market Pulse',
      universeMonitor: 'Universe Monitor',
      executionRoute: 'Execution Route',
      signalDistribution: 'Signal Distribution',
      universeScores: 'Universe Scores',
      executionLog: 'Execution Log',
      fillCount: 'Fill Count',
      paperOrders: 'Paper Orders',
      liveOrderState: 'Live Order State',
      symbol: 'Symbol',
      price: 'Price',
      change: 'Change',
      signal: 'Signal',
      action: 'Action',
      side: 'Side',
      qty: 'Qty',
      fill: 'Fill',
      time: 'Time',
      avgCost: 'Avg Cost',
      marketValue: 'Market Value',
      unrealizedPnl: 'Unrealized PnL',
      noOrders: 'No recent orders',
      noPositions: 'No open positions',
      noFills: 'No fills yet',
      cancel: 'Cancel',
      approve: 'Approve',
      reject: 'Reject',
      pendingApprovals: 'Pending Approvals',
      marketConnectivity: 'Review current connectivity for market data and broker providers.',
      policyCopy: 'Review buy/sell thresholds, sizing, and cash buffer policy.',
      systemModeCopy: 'Configure the current operating mode of the platform.',
      switchesCopy: 'Control automation, live execution, manual approval, and risk protection.',
      buyThreshold: 'Buy Threshold',
      sellThreshold: 'Sell Threshold',
      maxPosition: 'Max Position',
      cashBuffer: 'Cash Buffer',
      riskProtection: 'Risk Guard',
    },
    pages: {
      overview: ['Trading Overview', 'Monitor NAV, exposure, signals, and the latest order flow in one platform view.'],
      market: ['Market Monitor', 'Track universe pricing, relative strength, and market data connectivity.'],
      signals: ['Signal Center', 'Review the current buy / hold / sell posture and score distribution.'],
      execution: ['Execution Center', 'Track order states, cancel actions, and the latest fill feedback.'],
      portfolio: ['Portfolio Center', 'Review NAV, cash, holdings, and current portfolio exposure.'],
      settings: ['Settings', 'Manage modes, switches, thresholds, and provider connectivity.'],
    },
    desk: {
      overview: 'Overview Desk',
      market: 'Market Desk',
      signals: 'Signal Desk',
      execution: 'Execution Desk',
      portfolio: 'Portfolio Desk',
      settings: 'Control Desk',
    },
    slogans: {
      heroEyebrow: 'Autonomous Intelligence for Quantitative Trading',
      commandCenter: 'Your Autonomous Quant Trading Command Center',
    },
    settingsIntro: 'Manage language, operating mode, thresholds, integration status, and execution switches in one place.',
  },
} as const;

function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used inside LocaleContext');
  return context;
}

type SettingsSection = 'system-mode' | 'switches' | 'policy' | 'integrations';

function useSettingsNavigation() {
  const navigate = useNavigate();
  return (section: SettingsSection) => navigate(`/settings#${section}`);
}

function onShortcutKeyDown(event: ReactKeyboardEvent<HTMLElement>, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
}

function fmtCurrency(value: number) {
  return `¥${Math.round(value).toLocaleString('zh-CN')}`;
}

function fmtPct(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function fmtDateTime(value: string | undefined, locale: AppLocale = 'zh') {
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

function translateSignal(locale: AppLocale, signal: string) {
  if (locale === 'zh') return ({ BUY: '买入', HOLD: '持有', SELL: '卖出' } as Record<string, string>)[signal] || signal;
  return ({ BUY: 'BUY', HOLD: 'HOLD', SELL: 'SELL', 买入: 'BUY', 持有: 'HOLD', 卖出: 'SELL' } as Record<string, string>)[signal] || signal;
}

function translateSide(locale: AppLocale, side: string) {
  return translateSignal(locale, side);
}

function translateOrderStatus(locale: AppLocale, status: string | undefined) {
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

function translateEngineStatus(locale: AppLocale, status: string) {
  const map = locale === 'zh'
    ? { BOOTING: '启动中', 'MANUAL READY': '手动待命', 'LIVE EXECUTION': '实时执行' }
    : { BOOTING: 'Booting', 'MANUAL READY': 'Manual Ready', 'LIVE EXECUTION': 'Live Execution' };
  return map[status as keyof typeof map] || status;
}

function translateRiskLevel(locale: AppLocale, status: string) {
  const map = locale === 'zh'
    ? { NORMAL: '正常', 'RISK OFF': '风险关闭' }
    : { NORMAL: 'Normal', 'RISK OFF': 'Risk Off' };
  return map[status as keyof typeof map] || status;
}

function integrationTone(connected: boolean, degraded = false, localMirror = false) {
  if (connected) return 'ok';
  if (localMirror) return 'muted';
  if (degraded) return 'warn';
  return 'muted';
}

function riskTone(status: string) {
  return status === 'NORMAL' ? 'ok' : 'warn';
}

function toggleTone(value: boolean) {
  return value ? 'ok' : 'muted';
}

function modeTone(mode: string) {
  if (String(mode).toLowerCase() === 'autopilot') return 'ok';
  if (String(mode).toLowerCase() === 'hybrid') return 'info';
  return 'muted';
}

function engineTone(status: string) {
  if (status === 'LIVE EXECUTION') return 'ok';
  if (status === 'BOOTING') return 'warn';
  return 'muted';
}

function connectionLabel(locale: AppLocale, connected: boolean, degraded = false, localMirror = false) {
  if (connected) return copy[locale].labels.online;
  if (localMirror) return copy[locale].labels.localMirror;
  if (degraded) return copy[locale].labels.degraded;
  return copy[locale].labels.disabled;
}

function translateMode(locale: AppLocale, mode: string) {
  const map = locale === 'zh'
    ? { autopilot: '自动', hybrid: '混合', manual: '手动', AUTOPILOT: '自动', 'AUTO PILOT': '自动', HYBRID: '混合', MANUAL: '手动' }
    : { autopilot: 'AUTO', hybrid: 'HYBRID', manual: 'MANUAL', AUTOPILOT: 'AUTO', 'AUTO PILOT': 'AUTO', HYBRID: 'HYBRID', MANUAL: 'MANUAL' };
  return map[mode as keyof typeof map] || mode.toUpperCase();
}

function translateActionText(locale: AppLocale, text: string) {
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

function translateProviderLabel(locale: AppLocale, text: string) {
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

function translateRuntimeText(locale: AppLocale, text: string) {
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

function statusClass(status: string | undefined) {
  if (['filled'].includes(status)) return 'order-status-filled';
  if (['canceled', 'cancelled', 'expired', 'rejected'].includes(status)) return 'order-status-canceled';
  if (['new', 'accepted', 'pending_new', 'partially_filled'].includes(status)) return 'order-status-open';
  return 'order-status-muted';
}

function rowsForPositions(account: AccountState, stocks: StockState[]) {
  return Object.entries(account.holdings)
    .map(([symbol, holding]) => {
      const stock = stocks.find((item) => item.symbol === symbol);
      if (!stock) return null;
      const marketValue = stock.price * holding.shares;
      const pnl = (stock.price - holding.avgCost) * holding.shares;
      return { ...holding, symbol, name: stock.name, marketValue, pnl };
    })
    .filter(Boolean)
    .sort((a, b) => b.marketValue - a.marketValue);
}

function topSignalLabel(stocks: StockState[], locale: AppLocale) {
  const ranked = stocks.slice().sort((a, b) => b.score - a.score)[0];
  if (!ranked) return '--';
  return `${ranked.symbol} ${translateSignal(locale, ranked.signal)}`;
}

function useSummary() {
  const { state } = useTradingSystem();
  const paper = state.accounts.paper;
  const live = state.accounts.live;
  const totalNav = paper.nav + live.nav;
  const totalBase = (paper.equitySeries[0]?.value || paper.nav) + (live.equitySeries[0]?.value || live.nav);
  const totalPnlPct = totalBase ? (totalNav / totalBase - 1) * 100 : 0;
  const positionCount = rowsForPositions(paper, state.stockStates).length + rowsForPositions(live, state.stockStates).length;
  return { paper, live, totalNav, totalPnlPct, positionCount };
}

function SectionHeader({ routeKey }: { routeKey: keyof typeof copy.zh.pages }) {
  const { locale } = useLocale();
  const [title, desc] = copy[locale].pages[routeKey];
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">{copy[locale].desk[routeKey]}</div>
        <h1>{title}</h1>
        <p className="topbar-copy">{desc}</p>
      </div>
    </header>
  );
}

function ChartCanvas({ kind }: { kind: 'equity' | 'signal' }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { state } = useTradingSystem();
  const { locale } = useLocale();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max((canvas.parentElement?.clientWidth || 600) - 8, 280);
    const height = kind === 'equity' ? 280 : 280;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const pad = { l: 46, r: 18, t: 18, b: 28 };
    ctx.strokeStyle = 'rgba(116, 161, 255, 0.08)';
    for (let i = 0; i <= 4; i += 1) {
      const y = pad.t + i / 4 * (height - pad.t - pad.b);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(width - pad.r, y);
      ctx.stroke();
    }

    if (kind === 'equity') {
      const paper = state.accounts.paper.equitySeries;
      const live = state.accounts.live.equitySeries;
      if (!paper.length || !live.length) return;
      const values = [...paper, ...live].map((item) => item.value);
      const min = Math.min(...values) * 0.985;
      const max = Math.max(...values) * 1.015;
      const chartW = width - pad.l - pad.r;
      const chartH = height - pad.t - pad.b;
      const toX = (index, total) => pad.l + index / Math.max(total - 1, 1) * chartW;
      const toY = (value) => pad.t + (1 - (value - min) / Math.max(max - min, 1)) * chartH;

      ([
        [paper, '#41f0c2', copy[locale].labels.paper],
        [live, '#5f8dff', copy[locale].labels.live],
      ] as const).forEach(([series, color, label]) => {
        ctx.beginPath();
        ctx.moveTo(toX(0, series.length), toY(series[0].value));
        for (let i = 1; i < series.length; i += 1) ctx.lineTo(toX(i, series.length), toY(series[i].value));
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        const last = series.at(-1);
        ctx.fillStyle = color;
        ctx.font = '11px "Space Grotesk", sans-serif';
        ctx.fillText(label, width - pad.r - 70, toY(last.value) - 10);
      });
    } else {
      const counts = { BUY: 0, HOLD: 0, SELL: 0 };
      state.stockStates.forEach((stock) => { counts[stock.signal] += 1; });
      const items = [
        ['BUY', '#59f28f'],
        ['HOLD', '#f2c45c'],
        ['SELL', '#ff6b7c'],
      ] as const;
      const max = Math.max(...Object.values(counts), 1);
      const chartW = width - pad.l - pad.r;
      const chartH = height - pad.t - pad.b;
      const barW = chartW / items.length * 0.55;
      items.forEach(([label, color], index) => {
        const x = pad.l + chartW / items.length * index + (chartW / items.length - barW) / 2;
        const h = chartH * (counts[label] / max);
        const y = height - pad.b - h;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barW, h);
        ctx.fillStyle = 'rgba(208,226,255,0.72)';
        ctx.font = '11px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(translateSignal(locale, label), x + barW / 2, height - 10);
        ctx.fillText(String(counts[label]), x + barW / 2, y - 8);
      });
    }
  }, [kind, locale, state]);

  return <canvas ref={canvasRef} height="280" />;
}

function Sidebar() {
  const { locale } = useLocale();
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" />
        <div>
          <div className="brand-name">{copy[locale].product}</div>
          <div className="brand-sub">{copy[locale].tagline}</div>
        </div>
      </div>

      <nav className="nav-stack">
        <NavLink to="/overview" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{copy[locale].nav.overview}</NavLink>
        <NavLink to="/market" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{copy[locale].nav.market}</NavLink>
        <NavLink to="/signals" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{copy[locale].nav.signals}</NavLink>
        <NavLink to="/execution" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{copy[locale].nav.execution}</NavLink>
        <NavLink to="/portfolio" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{copy[locale].nav.portfolio}</NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{copy[locale].nav.settings}</NavLink>
      </nav>
    </aside>
  );
}

function TopMeta({ items }: { items: Array<{ label: string; value: string; accent?: boolean }> }) {
  return (
    <div className="topbar-meta">
      {items.map((item) => (
        <div className="meta-card" key={item.label}>
          <div className="meta-label">{item.label}</div>
          <div className={`meta-value${item.accent ? ' accent' : ''}`}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function GlobalToolbar() {
  const { locale, setLocale } = useLocale();
  const { state } = useTradingSystem();
  const goToSettings = useSettingsNavigation();
  const [localeOpen, setLocaleOpen] = useState(false);
  const localeMenuRef = useRef<HTMLDivElement | null>(null);
  const localeLabel = locale === 'zh' ? '中文' : 'English';

  useEffect(() => {
    if (!localeOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!localeMenuRef.current?.contains(event.target as Node)) setLocaleOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLocaleOpen(false);
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [localeOpen]);

  return (
    <div className="global-toolbar">
      <div className="toolbar-copy">
        <div className="toolbar-title">{copy[locale].product}</div>
        <div className="toolbar-sub">{`${translateEngineStatus(locale, state.engineStatus)} · ${translateMode(locale, state.mode)} · ${state.marketClock || '--:--:--'}`}</div>
      </div>
      <div className="toolbar-actions">
        <button type="button" className={`toolbar-pill toolbar-pill-button tone-${integrationTone(state.integrationStatus.marketData.connected, true)}`} onClick={() => goToSettings('integrations')}>
          <span className="toolbar-pill-main">
            <span className="status-dot" aria-hidden="true" />
            <span className="toolbar-pill-label">{copy[locale].labels.marketData}</span>
          </span>
          <strong>{connectionLabel(locale, state.integrationStatus.marketData.connected, true)}</strong>
        </button>
        <button type="button" className={`toolbar-pill toolbar-pill-button tone-${integrationTone(state.integrationStatus.broker.connected, false, true)}`} onClick={() => goToSettings('integrations')}>
          <span className="toolbar-pill-main">
            <span className="status-dot" aria-hidden="true" />
            <span className="toolbar-pill-label">{copy[locale].labels.broker}</span>
          </span>
          <strong>{connectionLabel(locale, state.integrationStatus.broker.connected, false, true)}</strong>
        </button>
        <div className="locale-switch-wrap" ref={localeMenuRef}>
          <button
            type="button"
            className="locale-trigger"
            aria-haspopup="menu"
            aria-expanded={localeOpen}
            onClick={() => setLocaleOpen((current) => !current)}
          >
            <span>{copy[locale].labels.language}</span>
            <strong>{localeLabel}</strong>
            <span className={`locale-caret${localeOpen ? ' open' : ''}`}>▾</span>
          </button>
          {localeOpen ? (
            <div className="locale-menu" role="menu" aria-label={copy[locale].labels.language}>
              <button
                type="button"
                className={`locale-option${locale === 'zh' ? ' active' : ''}`}
                onClick={() => {
                  setLocale('zh');
                  setLocaleOpen(false);
                }}
              >
                <span>中文</span>
                {locale === 'zh' ? <small className="locale-check">✓</small> : null}
              </button>
              <button
                type="button"
                className={`locale-option${locale === 'en' ? ' active' : ''}`}
                onClick={() => {
                  setLocale('en');
                  setLocaleOpen(false);
                }}
              >
                <span>English</span>
                {locale === 'en' ? <small className="locale-check">✓</small> : null}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OverviewPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const goToSettings = useSettingsNavigation();
  const { paper, live, totalNav, totalPnlPct, positionCount } = useSummary();
  const buyCount = state.stockStates.filter((stock) => stock.signal === 'BUY').length;
  const sellCount = state.stockStates.filter((stock) => stock.signal === 'SELL').length;
  const pendingApprovals = state.approvalQueue.length;
  const openLiveOrders = state.accounts.live.orders.filter((order) => ['new', 'accepted', 'pending_new', 'partially_filled'].includes(String(order.status || '').toLowerCase())).length;
  const strongestSignal = topSignalLabel(state.stockStates, locale);
  const topSignals = state.stockStates
    .slice()
    .sort((a, b) => {
      const aBias = a.signal === 'HOLD' ? Math.abs(a.score - 50) : a.signal === 'BUY' ? a.score : 100 - a.score;
      const bBias = b.signal === 'HOLD' ? Math.abs(b.score - 50) : b.signal === 'BUY' ? b.score : 100 - b.score;
      return bBias - aBias;
    })
    .slice(0, 5);
  const recentOrders = [...state.accounts.live.orders, ...state.accounts.paper.orders]
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.submittedAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.submittedAt || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 6);
  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">{copy[locale].desk.overview}</div>
          <h1>{copy[locale].heroTitle}</h1>
          <p className="topbar-copy">{copy[locale].pages.overview[1]}</p>
        </div>
        <TopMeta items={[
          { label: copy[locale].labels.marketClock, value: state.marketClock },
          { label: copy[locale].labels.systemStatus, value: translateEngineStatus(locale, state.engineStatus), accent: true },
          { label: copy[locale].labels.mode, value: translateMode(locale, state.mode) },
        ]} />
      </header>

      <section className="overview-hero-grid">
        <article className="hero-card hero-card-primary overview-command-card">
          <div className="card-eyebrow">{locale === 'zh' ? 'Command Deck' : 'Command Deck'}</div>
          <div className="overview-command-head">
            <div>
              <div className="overview-command-title">{copy[locale].slogans.commandCenter}</div>
              <div className="overview-command-copy">{translateRuntimeText(locale, state.routeCopy)}</div>
            </div>
            <div className={`status-chip status-chip-large tone-${riskTone(state.riskLevel)}`}><span className="status-dot" aria-hidden="true" />{translateRiskLevel(locale, state.riskLevel)}</div>
          </div>
          <div className="hero-headline">
            <div className="hero-value">{fmtCurrency(totalNav)}</div>
            <div className={`hero-change ${totalPnlPct >= 0 ? 'text-up' : 'text-down'}`}>{fmtPct(totalPnlPct)}</div>
          </div>
          <div className="overview-command-strip">
            <div className="overview-stat">
              <span>{copy[locale].terms.paperNav}</span>
              <strong>{fmtCurrency(paper.nav)}</strong>
            </div>
            <div className="overview-stat">
              <span>{copy[locale].terms.liveMirror}</span>
              <strong>{fmtCurrency(live.nav)}</strong>
            </div>
            <div className="overview-stat">
              <span>{copy[locale].terms.signalSummary}</span>
              <strong>{buyCount} / {sellCount}</strong>
            </div>
            <div className="overview-stat">
              <span>{copy[locale].terms.latestDecision}</span>
              <strong>{strongestSignal}</strong>
            </div>
          </div>
        </article>

        <article className="hero-card overview-kpi-card">
          <div className="card-eyebrow">{locale === 'zh' ? 'Exposure' : 'Exposure'}</div>
          <div className="mini-metric">{positionCount}</div>
          <div className="mini-copy">{copy[locale].labels.positions}</div>
          <div className="overview-kpi-grid">
            <div><span>{copy[locale].labels.paper}</span><strong>{paper.exposure.toFixed(1)}%</strong></div>
            <div><span>{copy[locale].labels.live}</span><strong>{live.exposure.toFixed(1)}%</strong></div>
          </div>
        </article>

        <article className="hero-card overview-kpi-card">
          <div className="card-eyebrow">{locale === 'zh' ? 'Workflow' : 'Workflow'}</div>
          <div className="mini-metric">{openLiveOrders}</div>
          <div className="mini-copy">{locale === 'zh' ? '未完成实盘订单' : 'Open live orders'}</div>
          <div className="overview-kpi-grid">
            <div><span>{copy[locale].terms.activityToday}</span><strong>{state.activityLog.length}</strong></div>
            <div><span>{copy[locale].terms.pendingApprovals}</span><strong>{pendingApprovals}</strong></div>
          </div>
        </article>
      </section>

      <section className="panel-grid panel-grid-terminal overview-desk-grid">
        <article className="panel overview-primary-panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.equityCurve}</div><div className="panel-copy">{locale === 'zh' ? '用一个主图盯盘总资产变化，并将信号、仓位和执行后果收敛到同一观察面。' : 'Use one primary chart to track consolidated NAV, then read signal, exposure, and execution impact from the same desk.'}</div></div><div className="panel-badge badge-ok">LIVE DESK</div></div>
          <ChartCanvas kind="equity" />
          <div className="overview-inline-metrics">
            <div className="overview-inline-metric"><span>{copy[locale].labels.marketState}</span><strong>{connectionLabel(locale, state.integrationStatus.marketData.connected, true)}</strong></div>
            <div className="overview-inline-metric"><span>{copy[locale].labels.brokerState}</span><strong>{connectionLabel(locale, state.integrationStatus.broker.connected, false, true)}</strong></div>
            <div className="overview-inline-metric"><span>{copy[locale].terms.tradeDecision}</span><strong>{translateRuntimeText(locale, state.decisionSummary)}</strong></div>
          </div>
        </article>
        <article className="panel overview-side-panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.executionSummary}</div><div className="panel-copy">{locale === 'zh' ? '把模式、风控、接入与最新动作压缩成一个侧边监控面板。' : 'Compress mode, risk, connectivity, and the latest action into one desk-side monitor.'}</div></div><div className="panel-badge badge-muted">OPS</div></div>
          <div className="status-stack">
            <button type="button" className="status-row status-row-button" onClick={() => goToSettings('switches')}><span>{copy[locale].labels.autoTrade}</span><strong className={`status-chip tone-${toggleTone(state.toggles.autoTrade)}`}>{state.toggles.autoTrade ? copy[locale].labels.enabled : copy[locale].labels.disabled}</strong></button>
            <button type="button" className="status-row status-row-button" onClick={() => goToSettings('switches')}><span>{copy[locale].labels.allowLive}</span><strong className={`status-chip tone-${toggleTone(state.toggles.liveTrade)}`}>{state.toggles.liveTrade ? copy[locale].labels.enabled : copy[locale].labels.disabled}</strong></button>
            <button type="button" className="status-row status-row-button" onClick={() => goToSettings('switches')}><span>{copy[locale].labels.manualApproval}</span><strong className={`status-chip tone-${toggleTone(state.toggles.manualApproval)}`}>{state.toggles.manualApproval ? copy[locale].labels.enabled : copy[locale].labels.disabled}</strong></button>
            <div className="status-row"><span>{copy[locale].labels.positions}</span><strong>{positionCount}</strong></div>
            <div className="status-row"><span>{copy[locale].terms.activityToday}</span><strong>{state.activityLog.length}</strong></div>
            <button type="button" className="status-row status-row-button" onClick={() => goToSettings('integrations')}><span>{copy[locale].labels.marketState}</span><strong className={`status-chip tone-${integrationTone(state.integrationStatus.marketData.connected, true)}`}>{connectionLabel(locale, state.integrationStatus.marketData.connected, true)}</strong></button>
            <button type="button" className="status-row status-row-button" onClick={() => goToSettings('integrations')}><span>{copy[locale].labels.brokerState}</span><strong className={`status-chip tone-${integrationTone(state.integrationStatus.broker.connected, false, true)}`}>{connectionLabel(locale, state.integrationStatus.broker.connected, false, true)}</strong></button>
            <div className="status-copy">{translateRuntimeText(locale, state.decisionCopy)}</div>
            <div className="status-copy">{state.activityLog[0] ? `${locale === 'zh' ? '最新动作' : 'Latest action'}: ${translateRuntimeText(locale, state.activityLog[0].title)}` : translateRuntimeText(locale, '当前没有新的执行记录。')}</div>
          </div>
        </article>
      </section>

      <section className="panel-grid panel-grid-terminal-bottom overview-blotter-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.focusList}</div><div className="panel-copy">{locale === 'zh' ? '像交易员的 watchlist 一样，只保留最值得人工复核的机会。' : 'Keep a trader-style watchlist with only the opportunities worth immediate review.'}</div></div><div className="panel-badge badge-muted">WATCHLIST</div></div>
          <div className="focus-list focus-list-terminal">
            {topSignals.map((stock) => {
              const pct = (stock.price / stock.prevClose - 1) * 100;
              return (
                <div className="focus-row" key={stock.symbol}>
                  <div className="symbol-cell">
                    <strong>{stock.symbol}</strong>
                    <span>{stock.name}</span>
                  </div>
                  <div className="focus-metric">
                    <span>{stock.price.toFixed(2)}</span>
                    <span className={pct >= 0 ? 'text-up' : 'text-down'}>{fmtPct(pct)}</span>
                  </div>
                  <div className="focus-metric">
                    <span>{copy[locale].labels.score}</span>
                    <strong>{stock.score.toFixed(1)}</strong>
                  </div>
                  <span className={`signal-chip signal-${stock.signal.toLowerCase()}`}>{translateSignal(locale, stock.signal)}</span>
                </div>
              );
            })}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.recentOrders}</div><div className="panel-copy">{locale === 'zh' ? '首页保留精简 blotter，只看最新委托、账户归属和状态变化。' : 'Keep a compact blotter on the home desk to review the latest order flow and status changes.'}</div></div><div className="panel-badge badge-info">{recentOrders.length || 0} {copy[locale].labels.orders}</div></div>
          <div className="focus-list focus-list-terminal">
            {recentOrders.length ? recentOrders.map((order, index) => (
              <div className="focus-row" key={`${order.id || order.symbol}-${index}`}>
                <div className="symbol-cell">
                  <strong>{order.symbol}</strong>
                  <span>{order.account === 'live' ? copy[locale].labels.live : copy[locale].labels.paper}</span>
                </div>
                <div className="focus-metric">
                  <span className={order.side === 'BUY' ? 'text-up' : 'text-down'}>{translateSide(locale, order.side)}</span>
                  <span>{order.qty}</span>
                </div>
                <div className="focus-metric">
                  <span>{copy[locale].labels.status}</span>
                  <strong>{translateOrderStatus(locale, order.status)}</strong>
                </div>
                <span className="table-note">{fmtDateTime(order.updatedAt || order.submittedAt, locale)}</span>
              </div>
            )) : <div className="empty-cell">{copy[locale].terms.noOrders}</div>}
          </div>
        </article>
      </section>
    </>
  );
}

function MarketPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const goToSettings = useSettingsNavigation();
  return (
    <>
      <SectionHeader routeKey="market" />
      <section className="panel-grid panel-grid-wide">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.marketPulse}</div><div className="panel-copy">{locale === 'zh' ? '观察当前股票池强弱分布和行情接入状态。' : 'Track universe momentum and current market data connectivity.'}</div><button type="button" className="inline-link" onClick={() => goToSettings('integrations')}>{copy[locale].labels.integrations}</button></div><div className="panel-badge badge-info">MARKET</div></div>
          <ChartCanvas kind="signal" />
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.universeMonitor}</div><div className="panel-copy">{locale === 'zh' ? '查看价格、评分和当前决策方向。' : 'Review pricing, scores, and current decision posture.'}</div></div><div className="panel-badge badge-info">{state.stockStates.length} SYMBOLS</div></div>
          <UniverseTable />
        </article>
      </section>
    </>
  );
}

function SignalsPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const goToSettings = useSettingsNavigation();
  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">{copy[locale].desk.signals}</div>
          <h1>{copy[locale].pages.signals[0]}</h1>
          <p className="topbar-copy">{copy[locale].pages.signals[1]}</p>
        </div>
        <TopMeta items={[
          { label: copy[locale].labels.marketClock, value: state.marketClock },
          { label: copy[locale].labels.latestSignal, value: `${state.stockStates.filter((stock) => stock.signal === 'BUY').length} / ${state.stockStates.filter((stock) => stock.signal === 'SELL').length}` },
          { label: copy[locale].terms.riskLevel, value: translateRiskLevel(locale, state.riskLevel) },
        ]} />
      </header>

      <section className="hero-grid two-up">
        <div className="hero-card"><div className="card-eyebrow">{copy[locale].terms.signalSummary}</div><div className="mini-metric">{translateRuntimeText(locale, state.decisionSummary)}</div><div className="mini-copy">{translateRuntimeText(locale, state.decisionCopy)}</div><button type="button" className="inline-link" onClick={() => goToSettings('policy')}>{copy[locale].labels.policy}</button></div>
        <article
          className="hero-card shortcut-surface"
          role="button"
          tabIndex={0}
          onClick={() => goToSettings('system-mode')}
          onKeyDown={(event) => onShortcutKeyDown(event, () => goToSettings('system-mode'))}
        ><div className="card-eyebrow">{copy[locale].terms.executionRoute}</div><div className="mini-metric">{translateMode(locale, state.mode)}</div><div className="mini-copy">{translateRuntimeText(locale, state.routeCopy)}</div></article>
      </section>

      <section className="panel-grid panel-grid-wide">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.signalDistribution}</div><div className="panel-copy">{locale === 'zh' ? '查看当前周期的买入、持有、卖出占比。' : 'Inspect the current buy / hold / sell mix.'}</div></div><div className="panel-badge badge-warn">SIGNAL</div></div>
          <ChartCanvas kind="signal" />
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.universeScores}</div><div className="panel-copy">{locale === 'zh' ? '评分越高越偏向买入，越低越偏向减仓。' : 'Higher scores bias toward buys; lower scores bias toward exits.'}</div></div><div className="panel-badge badge-info">{state.stockStates.length} SYMBOLS</div></div>
          <UniverseTable />
        </article>
      </section>
    </>
  );
}

function PortfolioPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const goToSettings = useSettingsNavigation();
  const { paper, live, totalNav } = useSummary();
  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">{copy[locale].desk.portfolio}</div>
          <h1>{copy[locale].pages.portfolio[0]}</h1>
          <p className="topbar-copy">{copy[locale].pages.portfolio[1]}</p>
        </div>
        <TopMeta items={[
          { label: copy[locale].terms.totalAccountValue, value: fmtCurrency(totalNav) },
          { label: copy[locale].terms.paperPnl, value: fmtPct(paper.pnlPct) },
          { label: copy[locale].terms.livePnl, value: fmtPct(live.pnlPct) },
        ]} />
      </header>

      <section className="metrics-grid">
        <article className="metric-tile"><div className="tile-label">{copy[locale].terms.paperNav}</div><div className="tile-value">{fmtCurrency(paper.nav)}</div><div className="tile-sub">{copy[locale].labels.exposure} {paper.exposure.toFixed(1)}%</div></article>
        <article className="metric-tile"><div className="tile-label">{copy[locale].terms.paperCash}</div><div className="tile-value">{fmtCurrency(paper.cash)}</div><div className="tile-sub">{copy[locale].terms.availableForEntries}</div></article>
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '实盘账户净值' : 'Live NAV'}</div><div className="tile-value">{fmtCurrency(live.nav)}</div><div className="tile-sub">{copy[locale].labels.exposure} {live.exposure.toFixed(1)}%</div></article>
        <article className="metric-tile"><div className="tile-label">{copy[locale].terms.liveBuyingPower}</div><div className="tile-value">{fmtCurrency(live.buyingPower || live.cash)}</div><div className="tile-sub">{copy[locale].terms.remoteBuyingPower}</div></article>
      </section>

      <section className="panel-grid panel-grid-wide">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '权益走势' : 'Equity Curve'}</div><div className="panel-copy">{locale === 'zh' ? '同步查看两个账户的权益变化。' : 'Track equity changes across both accounts.'}</div></div><div className="panel-badge badge-info">PORTFOLIO</div></div>
          <ChartCanvas kind="equity" />
        </article>
        <article
          className="panel shortcut-surface"
          role="button"
          tabIndex={0}
          onClick={() => goToSettings('system-mode')}
          onKeyDown={(event) => onShortcutKeyDown(event, () => goToSettings('system-mode'))}
        >
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.portfolioState}</div><div className="panel-copy">{locale === 'zh' ? '在组合页同步查看当前风险、模式和决策摘要。' : 'Review current risk, mode, and decision summary alongside holdings.'}</div></div><div className={`panel-badge badge-${engineTone(state.engineStatus)}`}>{translateEngineStatus(locale, state.engineStatus)}</div></div>
          <div className="status-stack">
            <div className="status-row"><span>{copy[locale].terms.riskLevel}</span><strong>{translateRiskLevel(locale, state.riskLevel)}</strong></div>
            <div className="status-row"><span>{copy[locale].labels.mode}</span><strong>{translateMode(locale, state.mode)}</strong></div>
            <div className="status-row"><span>{copy[locale].terms.latestDecision}</span><strong>{translateRuntimeText(locale, state.decisionSummary)}</strong></div>
            <div className="status-copy">{translateRuntimeText(locale, state.decisionCopy)}</div>
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '模拟盘持仓' : 'Paper Positions'}</div><div className="panel-copy">{locale === 'zh' ? '策略测试账户的当前持仓明细。' : 'Current holdings in the paper account.'}</div></div><div className="panel-badge badge-muted">PAPER</div></div>
          <PositionsTable accountKey="paper" />
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '实盘持仓' : 'Live Positions'}</div><div className="panel-copy">{locale === 'zh' ? '远程 broker 同步回来的持仓状态。' : 'Positions synchronized from the remote broker.'}</div></div><div className="panel-badge badge-ok">LIVE</div></div>
          <PositionsTable accountKey="live" />
        </article>
      </section>
    </>
  );
}

function ExecutionPage() {
  const { state, approveLiveIntent, rejectLiveIntent } = useTradingSystem();
  const { locale } = useLocale();
  const goToSettings = useSettingsNavigation();
  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">{copy[locale].desk.execution}</div>
          <h1>{copy[locale].pages.execution[0]}</h1>
          <p className="topbar-copy">{copy[locale].pages.execution[1]}</p>
        </div>
        <TopMeta items={[
          { label: copy[locale].labels.marketClock, value: state.marketClock },
          { label: copy[locale].labels.systemStatus, value: translateEngineStatus(locale, state.engineStatus), accent: true },
          { label: copy[locale].terms.fillCount, value: String(state.activityLog.length) },
        ]} />
      </header>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.executionLog}</div><div className="panel-copy">{locale === 'zh' ? '按时间逆序查看最新系统执行记录。' : 'Review the latest execution records in reverse chronological order.'}</div></div><div className="panel-badge badge-info">EXECUTION</div></div>
          <ActivityLog />
        </article>
        <article
          className="panel shortcut-surface"
          role="button"
          tabIndex={0}
          onClick={() => goToSettings('integrations')}
          onKeyDown={(event) => onShortcutKeyDown(event, () => goToSettings('integrations'))}
        >
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.executionSummary}</div><div className="panel-copy">{locale === 'zh' ? '汇总最近一个刷新周期的动作和通道路由。' : 'Summarize the latest cycle actions and routing posture.'}</div></div><div className={`panel-badge badge-${modeTone(state.mode)}`}>{translateMode(locale, state.mode)}</div></div>
          <div className="status-stack">
            <div className="status-row"><span>{copy[locale].labels.latestSignal}</span><strong>{state.stockStates.filter((stock) => stock.signal === 'BUY').length} / {state.stockStates.filter((stock) => stock.signal === 'SELL').length}</strong></div>
            <div className="status-row"><span>{copy[locale].terms.riskLevel}</span><strong>{translateRiskLevel(locale, state.riskLevel)}</strong></div>
            <div className="status-row"><span>{copy[locale].terms.tradeDecision}</span><strong>{translateRuntimeText(locale, state.decisionSummary)}</strong></div>
            <div className="status-row"><span>{copy[locale].labels.brokerState}</span><strong>{state.integrationStatus.broker.connected ? copy[locale].labels.connected : copy[locale].labels.fallback}</strong></div>
            <div className="status-copy">{translateRuntimeText(locale, state.decisionCopy)}</div>
            <div className="status-copy">{translateRuntimeText(locale, state.integrationStatus.broker.message)}</div>
          </div>
        </article>
      </section>

	      <section className="panel-grid">
	        <article className="panel">
	          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.pendingApprovals}</div><div className="panel-copy">{locale === 'zh' ? '人工确认开启时，live 订单先进入这里，批准后才会发往 broker。' : 'When manual approval is enabled, live orders stay here until you release them to the broker.'}</div></div><div className={`panel-badge ${state.approvalQueue.length ? 'badge-warn' : 'badge-muted'}`}>{state.approvalQueue.length}</div></div>
	          <ApprovalQueueTable onApprove={approveLiveIntent} onReject={rejectLiveIntent} />
	        </article>
	        <article className="panel">
	          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.paperOrders}</div><div className="panel-copy">{locale === 'zh' ? '策略测试账户最近 12 笔委托。' : 'Latest 12 orders from the paper account.'}</div></div><div className="panel-badge badge-muted">PAPER</div></div>
	          <OrdersTable accountKey="paper" />
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.liveOrderState}</div><div className="panel-copy">{locale === 'zh' ? '查看远程订单状态、部分成交、撤单与成交回报。' : 'Track remote order states, partial fills, cancels, and fill feedback.'}</div></div><div className="panel-badge badge-ok">LIVE</div></div>
          <OrdersTable accountKey="live" />
        </article>
      </section>
    </>
  );
}

function SettingsPage() {
  const { locale } = useLocale();
  const { state, setMode, updateToggle } = useTradingSystem();
  const location = useLocation();
  const modes = [
    ['autopilot', 'AUTO PILOT'],
    ['hybrid', 'HYBRID'],
    ['manual', 'MANUAL'],
  ] as const;

  useEffect(() => {
    const targetId = location.hash.replace('#', '');
    if (!targetId) return;
    const element = document.getElementById(targetId);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  return (
    <>
      <SectionHeader routeKey="settings" />
      <section className="hero-grid two-up">
        <div className="hero-card hero-card-primary">
          <div className="card-eyebrow">{copy[locale].nav.settings}</div>
          <div className="mini-metric">{copy[locale].product}</div>
          <div className="mini-copy">{copy[locale].settingsIntro}</div>
        </div>
        <div className="hero-card">
          <div className="card-eyebrow">{copy[locale].labels.routing}</div>
          <div className="mini-metric">{translateRuntimeText(locale, state.routeCopy)}</div>
          <div className="mini-copy">{translateRuntimeText(locale, state.integrationStatus.broker.message)}</div>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel" id="system-mode">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].labels.systemMode}</div><div className="panel-copy">{copy[locale].terms.systemModeCopy}</div></div><div className={`panel-badge badge-${modeTone(state.mode)}`}>{translateMode(locale, state.mode)}</div></div>
          <div className="mode-stack">
            {modes.map(([key, label]) => (
              <button key={key} type="button" className={`mode-pill${state.mode === key ? ' active' : ''}`} onClick={() => setMode(key)}>
                {translateMode(locale, label)}
              </button>
            ))}
          </div>
        </article>
        <article className="panel" id="switches">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].labels.switches}</div><div className="panel-copy">{copy[locale].terms.switchesCopy}</div></div><div className="panel-badge badge-muted">CONTROL</div></div>
          <label className="switch-row"><span>{copy[locale].labels.autoTrade}</span><input type="checkbox" checked={state.toggles.autoTrade} onChange={(event) => updateToggle('autoTrade', event.target.checked)} /></label>
          <label className="switch-row"><span>{copy[locale].labels.allowLive}</span><input type="checkbox" checked={state.toggles.liveTrade} onChange={(event) => updateToggle('liveTrade', event.target.checked)} /></label>
          <label className="switch-row"><span>{copy[locale].labels.riskGuard}</span><input type="checkbox" checked={state.toggles.riskGuard} onChange={(event) => updateToggle('riskGuard', event.target.checked)} /></label>
          <label className="switch-row"><span>{copy[locale].labels.manualApproval}</span><input type="checkbox" checked={state.toggles.manualApproval} onChange={(event) => updateToggle('manualApproval', event.target.checked)} /></label>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel" id="policy">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].labels.policy}</div><div className="panel-copy">{copy[locale].terms.policyCopy}</div></div><div className="panel-badge badge-warn">POLICY</div></div>
          <div className="policy-card policy-card-inline">
            <div className="policy-row"><span>{copy[locale].terms.buyThreshold}</span><strong>{state.config.buyThreshold}</strong></div>
            <div className="policy-row"><span>{copy[locale].terms.sellThreshold}</span><strong>{state.config.sellThreshold}</strong></div>
            <div className="policy-row"><span>{copy[locale].terms.maxPosition}</span><strong>{(state.config.maxPositionWeight * 100).toFixed(0)}%</strong></div>
            <div className="policy-row"><span>{copy[locale].terms.cashBuffer}</span><strong>{(state.config.targetCashBuffer * 100).toFixed(0)}%</strong></div>
            <div className="policy-row"><span>{copy[locale].terms.riskProtection}</span><strong>{state.toggles.riskGuard ? 'ON' : 'OFF'}</strong></div>
          </div>
        </article>
        <article className="panel" id="integrations">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].labels.integrations}</div><div className="panel-copy">{copy[locale].terms.marketConnectivity}</div></div><div className="panel-badge badge-info">INTEGRATION</div></div>
          <div className="policy-card policy-card-inline">
            <div className="policy-row"><span>{copy[locale].labels.marketData}</span><strong>{translateProviderLabel(locale, state.integrationStatus.marketData.label || state.integrationStatus.marketData.provider)}</strong></div>
            <div className="policy-row"><span>{copy[locale].labels.marketState}</span><strong>{state.integrationStatus.marketData.connected ? copy[locale].labels.connected : copy[locale].labels.fallback}</strong></div>
            <div className="policy-row"><span>{copy[locale].labels.broker}</span><strong>{translateProviderLabel(locale, state.integrationStatus.broker.label || state.integrationStatus.broker.provider)}</strong></div>
            <div className="policy-row"><span>{copy[locale].labels.brokerState}</span><strong>{state.integrationStatus.broker.connected ? copy[locale].labels.connected : copy[locale].labels.localOnly}</strong></div>
            <div className="status-copy">{translateRuntimeText(locale, state.integrationStatus.marketData.message)}</div>
            <div className="status-copy">{translateRuntimeText(locale, state.integrationStatus.broker.message)}</div>
          </div>
        </article>
      </section>
    </>
  );
}

function UniverseTable() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const rows = state.stockStates.slice().sort((a, b) => b.score - a.score);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>{copy[locale].terms.symbol}</th><th>{copy[locale].terms.price}</th><th>{copy[locale].terms.change}</th><th>{copy[locale].labels.score}</th><th>{copy[locale].terms.signal}</th><th>{copy[locale].terms.action}</th></tr>
        </thead>
        <tbody>
          {rows.map((stock) => {
            const pct = (stock.price / stock.prevClose - 1) * 100;
            return (
              <tr key={stock.symbol}>
                <td><div className="symbol-cell"><strong>{stock.symbol}</strong><span>{stock.name}</span></div></td>
                <td>{stock.price.toFixed(2)}</td>
                <td className={pct >= 0 ? 'text-up' : 'text-down'}>{fmtPct(pct)}</td>
                <td>{stock.score.toFixed(1)}</td>
                <td><span className={`signal-chip signal-${stock.signal.toLowerCase()}`}>{translateSignal(locale, stock.signal)}</span></td>
                <td>{translateActionText(locale, stock.actionText)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PositionsTable({ accountKey }: { accountKey: 'paper' | 'live' }) {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const rows = rowsForPositions(state.accounts[accountKey], state.stockStates);
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>{copy[locale].terms.symbol}</th><th>{copy[locale].labels.positions}</th><th>{copy[locale].terms.avgCost}</th><th>{copy[locale].terms.marketValue}</th><th>{copy[locale].terms.unrealizedPnl}</th></tr></thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={`${accountKey}-${row.symbol}`}>
              <td><div className="symbol-cell"><strong>{row.symbol}</strong><span>{row.name}</span></div></td>
              <td>{row.shares}</td>
              <td>{row.avgCost.toFixed(2)}</td>
              <td>{fmtCurrency(row.marketValue)}</td>
              <td className={row.pnl >= 0 ? 'text-up' : 'text-down'}>{fmtCurrency(row.pnl)}</td>
            </tr>
          )) : <tr><td colSpan={5} className="empty-cell">{copy[locale].terms.noPositions}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function OrdersTable({ accountKey }: { accountKey: 'paper' | 'live' }) {
  const { state, cancelLiveOrder } = useTradingSystem();
  const { locale } = useLocale();
  const rows: BrokerOrder[] = state.accounts[accountKey].orders.slice(0, 12);
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>{copy[locale].terms.side}</th><th>{copy[locale].terms.symbol}</th><th>{copy[locale].terms.qty}</th><th>{copy[locale].terms.fill}</th><th>{copy[locale].labels.status}</th><th>{copy[locale].terms.time}</th><th>{copy[locale].terms.action}</th></tr></thead>
        <tbody>
          {rows.length ? rows.map((order, index) => (
            <tr key={`${accountKey}-${order.symbol}-${order.side}-${index}`}>
              <td className={order.side === 'BUY' ? 'text-up' : 'text-down'}>{translateSide(locale, order.side)}</td>
              <td>{order.symbol}</td>
              <td>{order.qty}</td>
              <td>{order.filledQty || 0} @ {(order.filledAvgPrice || order.price || 0).toFixed(2)}</td>
              <td><span className={`order-status ${statusClass(order.status)}`}>{translateOrderStatus(locale, order.status)}</span></td>
              <td>{fmtDateTime(order.updatedAt || order.submittedAt, locale)}</td>
              <td>
                {accountKey === 'live' && order.cancelable ? (
                  <button type="button" className="inline-action" onClick={() => cancelLiveOrder(order.id || '')}>{copy[locale].terms.cancel}</button>
                ) : (
                  <span className="table-note">{order.tag || order.source || '--'}</span>
                )}
              </td>
            </tr>
          )) : <tr><td colSpan={7} className="empty-cell">{copy[locale].terms.noFills}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function ApprovalQueueTable({ onApprove, onReject }: { onApprove: (clientOrderId: string) => void; onReject: (clientOrderId: string) => void }) {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const rows: BrokerOrder[] = state.approvalQueue.slice(0, 12);
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>{copy[locale].terms.side}</th><th>{copy[locale].terms.symbol}</th><th>{copy[locale].terms.qty}</th><th>{copy[locale].terms.fill}</th><th>{copy[locale].labels.status}</th><th>{copy[locale].terms.time}</th><th>{copy[locale].terms.action}</th></tr></thead>
        <tbody>
          {rows.length ? rows.map((order, index) => (
            <tr key={`${order.clientOrderId || order.symbol}-${index}`}>
              <td className={order.side === 'BUY' ? 'text-up' : 'text-down'}>{translateSide(locale, order.side)}</td>
              <td>{order.symbol}</td>
              <td>{order.qty}</td>
              <td>0 @ {(order.price || 0).toFixed(2)}</td>
              <td><span className="order-status order-status-open">{locale === 'zh' ? '待审批' : 'Pending'}</span></td>
              <td>{fmtDateTime(order.updatedAt || order.submittedAt, locale)}</td>
              <td className="action-group">
                <button type="button" className="inline-action inline-action-approve" onClick={() => onApprove(order.clientOrderId || '')}>{copy[locale].terms.approve}</button>
                <button type="button" className="inline-action" onClick={() => onReject(order.clientOrderId || '')}>{copy[locale].terms.reject}</button>
              </td>
            </tr>
          )) : <tr><td colSpan={7} className="empty-cell">{locale === 'zh' ? '当前没有待审批实盘订单' : 'No live orders are waiting for approval'}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function ActivityLog() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  return (
    <div className="log-list">
      {state.activityLog.map((entry, index) => (
        <div className="log-item" key={`${entry.time}-${index}`}>
          <div className="log-time">{entry.time}</div>
          <div className="log-main">
            <div className="log-title">{translateRuntimeText(locale, entry.title)}</div>
            <div className="log-copy">{translateRuntimeText(locale, entry.copy)}</div>
          </div>
          <div className={`log-tag ${entry.kind}`}>{entry.kind.toUpperCase()}</div>
        </div>
      ))}
    </div>
  );
}

function Layout() {
  const location = useLocation();
  const { locale } = useLocale();

  useEffect(() => {
    const titleMap = {
      '/overview': `${copy[locale].nav.overview} | quantpilot`,
      '/market': `${copy[locale].nav.market} | quantpilot`,
      '/signals': `${copy[locale].nav.signals} | quantpilot`,
      '/execution': `${copy[locale].nav.execution} | quantpilot`,
      '/portfolio': `${copy[locale].nav.portfolio} | quantpilot`,
      '/settings': `${copy[locale].nav.settings} | quantpilot`,
    };
    document.title = titleMap[location.pathname] || 'quantpilot';
  }, [locale, location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <GlobalToolbar />
        <Outlet />
      </main>
    </div>
  );
}

export default function DashboardApp() {
  const [locale, setLocale] = useState<AppLocale>(() => {
    const saved = window.localStorage.getItem('quantpilot-locale');
    return saved === 'en' ? 'en' : 'zh';
  });

  useEffect(() => {
    window.localStorage.setItem('quantpilot-locale', locale);
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <TradingSystemProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/signals" element={<SignalsPage />} />
            <Route path="/execution" element={<ExecutionPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/accounts" element={<Navigate to="/portfolio" replace />} />
            <Route path="/orders" element={<Navigate to="/execution" replace />} />
            <Route path="/strategy" element={<Navigate to="/signals" replace />} />
            <Route path="/backtest" element={<Navigate to="/signals" replace />} />
            <Route path="/risk" element={<Navigate to="/settings" replace />} />
            <Route path="/analysis" element={<Navigate to="/overview" replace />} />
          </Route>
        </Routes>
      </TradingSystemProvider>
    </LocaleContext.Provider>
  );
}
