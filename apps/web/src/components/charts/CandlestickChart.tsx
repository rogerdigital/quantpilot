import { CandlestickSeries, HistogramSeries, createChart } from 'lightweight-charts';
import type { OhlcvBar } from '@shared-types/trading.ts';
import { useEffect, useRef } from 'react';

type Props = {
  data: OhlcvBar[];
  timeframe?: string;
};

export function CandlestickChart({ data, timeframe }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Keep refs so we can update data without re-creating the chart
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const candleRef = useRef<ReturnType<typeof chartRef.current.addSeries> | null>(null);
  const volumeRef = useRef<ReturnType<typeof chartRef.current.addSeries> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(100, 140, 195, 0.65)',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(0, 180, 255, 0.04)', style: 1 },
        horzLines: { color: 'rgba(0, 180, 255, 0.06)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(0, 180, 255, 0.1)',
        textColor: 'rgba(100, 140, 195, 0.65)',
      },
      timeScale: {
        borderColor: 'rgba(0, 180, 255, 0.1)',
        textColor: 'rgba(100, 140, 195, 0.65)',
        timeVisible: true,
      },
      crosshair: {
        vertLine: { color: 'rgba(0, 212, 255, 0.3)' },
        horzLine: { color: 'rgba(0, 212, 255, 0.3)' },
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      priceLineVisible: true,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: 'rgba(0, 212, 255, 0.2)',
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
    };
  }, []);

  // Update data when it changes
  useEffect(() => {
    if (!candleRef.current || !volumeRef.current || !data.length) return;

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
      color: b.close >= b.open ? 'rgba(38, 166, 154, 0.3)' : 'rgba(239, 83, 80, 0.3)',
    }));

    candleRef.current.setData(candleData);
    volumeRef.current.setData(volumeData);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

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
