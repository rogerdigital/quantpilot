import { useMemo } from 'react';
import { useTheme } from './useTheme';

export type ChartColors = {
  textColor: string;
  gridLight: string;
  gridMedium: string;
  borderColor: string;
  crosshairColor: string;
  accentLine: string;
  accentFillTop: string;
  accentFillBottom: string;
  liveAccent: string;
  liveFillTop: string;
  liveFillBottom: string;
  benchmarkLine: string;
  volumeDefault: string;
  volumeUp: string;
  volumeDown: string;
  candleUp: string;
  candleDown: string;
  drawdownLight: string;
  drawdownHeavy: string;
  indicators: Record<string, string>;
};

const lightColors: ChartColors = {
  textColor: 'rgba(107, 114, 128, 0.8)',
  gridLight: 'rgba(229, 231, 235, 0.6)',
  gridMedium: 'rgba(229, 231, 235, 0.8)',
  borderColor: 'rgba(229, 231, 235, 1)',
  crosshairColor: 'rgba(79, 70, 229, 0.3)',
  accentLine: '#4f46e5',
  accentFillTop: 'rgba(79, 70, 229, 0.08)',
  accentFillBottom: 'rgba(79, 70, 229, 0)',
  liveAccent: '#d97706',
  liveFillTop: 'rgba(217, 119, 6, 0.06)',
  liveFillBottom: 'rgba(217, 119, 6, 0)',
  benchmarkLine: 'rgba(107, 114, 128, 0.4)',
  volumeDefault: 'rgba(79, 70, 229, 0.12)',
  volumeUp: 'rgba(16, 185, 129, 0.2)',
  volumeDown: 'rgba(239, 68, 68, 0.2)',
  candleUp: '#10b981',
  candleDown: '#ef4444',
  drawdownLight: 'rgba(239, 68, 68, 0.15)',
  drawdownHeavy: 'rgba(239, 68, 68, 0.3)',
  indicators: {
    sma20: '#d97706',
    sma50: '#7c3aed',
    sma200: '#ef4444',
    ema12: '#059669',
    ema26: '#4f46e5',
    bb_upper: 'rgba(79, 70, 229, 0.4)',
    bb_middle: 'rgba(79, 70, 229, 0.6)',
    bb_lower: 'rgba(79, 70, 229, 0.4)',
  },
};

const darkColors: ChartColors = {
  textColor: 'rgba(156, 163, 175, 0.7)',
  gridLight: 'rgba(46, 51, 72, 0.5)',
  gridMedium: 'rgba(46, 51, 72, 0.7)',
  borderColor: 'rgba(46, 51, 72, 1)',
  crosshairColor: 'rgba(129, 140, 248, 0.4)',
  accentLine: '#818cf8',
  accentFillTop: 'rgba(129, 140, 248, 0.12)',
  accentFillBottom: 'rgba(129, 140, 248, 0)',
  liveAccent: '#fbbf24',
  liveFillTop: 'rgba(251, 191, 36, 0.07)',
  liveFillBottom: 'rgba(251, 191, 36, 0)',
  benchmarkLine: 'rgba(156, 163, 175, 0.4)',
  volumeDefault: 'rgba(129, 140, 248, 0.18)',
  volumeUp: 'rgba(52, 211, 153, 0.3)',
  volumeDown: 'rgba(248, 113, 113, 0.3)',
  candleUp: '#34d399',
  candleDown: '#f87171',
  drawdownLight: 'rgba(248, 113, 113, 0.2)',
  drawdownHeavy: 'rgba(248, 113, 113, 0.4)',
  indicators: {
    sma20: '#fbbf24',
    sma50: '#a78bfa',
    sma200: '#f87171',
    ema12: '#34d399',
    ema26: '#818cf8',
    bb_upper: 'rgba(129, 140, 248, 0.5)',
    bb_middle: 'rgba(129, 140, 248, 0.7)',
    bb_lower: 'rgba(129, 140, 248, 0.5)',
  },
};

export function useChartColors(): ChartColors {
  const { resolved } = useTheme();
  return useMemo(() => (resolved === 'dark' ? darkColors : lightColors), [resolved]);
}
