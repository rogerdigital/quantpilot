import { runtimeConfig } from '../../../services/config/runtime.ts';

export const APP_CONFIG = {
  refreshMs: runtimeConfig.refreshMs,
  maxPositionWeight: 0.24,
  targetCashBuffer: 0.18,
  buyThreshold: 74,
  sellThreshold: 38,
  liveSyncRatio: 0.62,
};

export const STOCK_UNIVERSE = [
  { symbol: 'AAPL', name: 'Apple', sector: '消费电子', price: 212.4, drift: 0.12, volatility: 1.5, lotSize: 1 },
  { symbol: 'MSFT', name: 'Microsoft', sector: '软件', price: 413.8, drift: 0.11, volatility: 1.2, lotSize: 1 },
  { symbol: 'NVDA', name: 'NVIDIA', sector: '芯片', price: 884.1, drift: 0.18, volatility: 2.7, lotSize: 1 },
  { symbol: 'AMZN', name: 'Amazon', sector: '电商云计算', price: 178.9, drift: 0.1, volatility: 1.8, lotSize: 1 },
  { symbol: 'META', name: 'Meta', sector: '互联网广告', price: 492.7, drift: 0.13, volatility: 1.9, lotSize: 1 },
  { symbol: 'GOOGL', name: 'Alphabet', sector: '搜索 AI', price: 168.2, drift: 0.1, volatility: 1.5, lotSize: 1 },
  { symbol: 'TSLA', name: 'Tesla', sector: '汽车新能源', price: 192.4, drift: 0.16, volatility: 2.9, lotSize: 1 },
  { symbol: 'JPM', name: 'JPMorgan', sector: '金融', price: 198.6, drift: 0.07, volatility: 1.0, lotSize: 1 },
  { symbol: 'XOM', name: 'Exxon Mobil', sector: '能源', price: 113.1, drift: 0.05, volatility: 1.1, lotSize: 1 },
  { symbol: 'UNH', name: 'UnitedHealth', sector: '医疗', price: 498.3, drift: 0.08, volatility: 1.3, lotSize: 1 },
];

export const INITIAL_SERIES_LENGTH = 48;
export const OPEN_ORDER_STATUSES = new Set(['new', 'accepted', 'pending_new', 'partially_filled']);
