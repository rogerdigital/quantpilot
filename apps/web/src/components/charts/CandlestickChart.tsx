import type { OhlcvBar } from '@shared-types/trading.ts';
import { CandlestickSeries, createChart, HistogramSeries, LineSeries } from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { useChartColors } from '../../hooks/useChartColors';

type ChartInstance = ReturnType<typeof createChart>;
type SeriesInstance = ReturnType<ChartInstance['addSeries']>;

export type IndicatorConfig = {
  sma?: number[];
  ema?: number[];
  bollinger?: { period: number; stdDev: number };
};

type Props = {
  data: OhlcvBar[];
  timeframe?: string;
  indicators?: IndicatorConfig;
};

function calcSMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += closes[j];
      result.push(sum / period);
    }
  }
  return result;
}

function calcEMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += closes[j];
      result.push(sum / period);
    } else {
      result.push(closes[i] * k + (result[i - 1] as number) * (1 - k));
    }
  }
  return result;
}

function calcBollinger(
  closes: number[],
  period: number,
  stdDev: number
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = calcSMA(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (middle[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      let variance = 0;
      for (let j = i - period + 1; j <= i; j++) {
        variance += (closes[j] - (middle[i] as number)) ** 2;
      }
      const sd = Math.sqrt(variance / period);
      upper.push((middle[i] as number) + sd * stdDev);
      lower.push((middle[i] as number) - sd * stdDev);
    }
  }
  return { upper, middle, lower };
}

export function CandlestickChart({ data, timeframe, indicators }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const candleRef = useRef<SeriesInstance | null>(null);
  const volumeRef = useRef<SeriesInstance | null>(null);
  const indicatorRefs = useRef<SeriesInstance[]>([]);
  const colors = useChartColors();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        attributionLogo: false,
        background: { color: 'transparent' },
        textColor: colors.textColor,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: colors.gridLight, style: 1 },
        horzLines: { color: colors.gridMedium },
      },
      rightPriceScale: {
        borderVisible: false,
        textColor: colors.textColor,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      crosshair: {
        vertLine: { color: colors.crosshairColor },
        horzLine: { color: colors.crosshairColor },
      },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        mouseWheel: false,
        pinch: true,
        axisPressedMouseMove: true,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: colors.candleUp,
      downColor: colors.candleDown,
      borderUpColor: colors.candleUp,
      borderDownColor: colors.candleDown,
      wickUpColor: colors.candleUp,
      wickDownColor: colors.candleDown,
      priceLineVisible: true,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: colors.volumeDefault,
      priceScaleId: 'volume',
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      indicatorRefs.current = [];
    };
  }, [colors]);

  useEffect(() => {
    if (!candleRef.current || !volumeRef.current || !data.length || !chartRef.current) return;

    const chart = chartRef.current;

    for (const s of indicatorRefs.current) {
      chart.removeSeries(s);
    }
    indicatorRefs.current = [];

    const candleData = data.map((b) => ({
      time: b.time as unknown as string,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));

    const volumeData = data.map((b) => ({
      time: b.time as unknown as string,
      value: b.volume,
      color: b.close >= b.open ? colors.volumeUp : colors.volumeDown,
    }));

    candleRef.current.setData(candleData);
    volumeRef.current.setData(volumeData);

    const times = data.map((b) => b.time as unknown as string);
    const closes = data.map((b) => b.close);

    if (indicators?.sma) {
      for (const period of indicators.sma) {
        const values = calcSMA(closes, period);
        const series = chart.addSeries(LineSeries, {
          color: colors.indicators[`sma${period}`] ?? colors.liveAccent,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          title: `SMA ${period}`,
        });
        series.setData(
          values
            .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
            .filter(Boolean) as { time: string; value: number }[]
        );
        indicatorRefs.current.push(series);
      }
    }

    if (indicators?.ema) {
      for (const period of indicators.ema) {
        const values = calcEMA(closes, period);
        const series = chart.addSeries(LineSeries, {
          color: colors.indicators[`ema${period}`] ?? colors.candleUp,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          title: `EMA ${period}`,
        });
        series.setData(
          values
            .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
            .filter(Boolean) as { time: string; value: number }[]
        );
        indicatorRefs.current.push(series);
      }
    }

    if (indicators?.bollinger) {
      const { period, stdDev } = indicators.bollinger;
      const bb = calcBollinger(closes, period, stdDev);
      for (const [key, values] of [
        ['upper', bb.upper],
        ['middle', bb.middle],
        ['lower', bb.lower],
      ] as const) {
        const series = chart.addSeries(LineSeries, {
          color: colors.indicators[`bb_${key}`],
          lineWidth: 1,
          lineStyle: key === 'middle' ? 0 : 2,
          priceLineVisible: false,
          lastValueVisible: false,
          title: key === 'middle' ? `BB ${period}` : '',
        });
        series.setData(
          values
            .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
            .filter(Boolean) as { time: string; value: number }[]
        );
        indicatorRefs.current.push(series);
      }
    }

    chart.timeScale().fitContent();
  }, [data, indicators, colors]);

  // Fit content when timeframe changes
  useEffect(() => {
    chartRef.current?.timeScale().fitContent();
  }, [timeframe]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: '240px', position: 'relative' }}
    />
  );
}
