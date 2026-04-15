import { createChart, HistogramSeries } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

type Props = {
  buy: number;
  hold: number;
  sell: number;
};

// Signal colors matching the existing Canvas implementation
const SIGNAL_COLORS = {
  BUY: '#00e89d',
  HOLD: '#ffb700',
  SELL: '#ff3358',
} as const;

export function SignalBarChart({ buy, hold, sell }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(160, 162, 210, 0.65)',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(99, 102, 241, 0.05)', style: 1 },
        horzLines: { color: 'rgba(99, 102, 241, 0.07)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(99, 102, 241, 0.12)',
        textColor: 'rgba(160, 162, 210, 0.65)',
        visible: true,
      },
      timeScale: {
        borderColor: 'rgba(99, 102, 241, 0.12)',
        visible: false,
      },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { color: 'rgba(99, 102, 241, 0.40)' },
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(HistogramSeries, {
      color: SIGNAL_COLORS.BUY,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Represent BUY/HOLD/SELL as three bars at time positions 1/2/3
    series.setData([
      { time: 1 as unknown as string, value: buy, color: SIGNAL_COLORS.BUY },
      { time: 2 as unknown as string, value: hold, color: SIGNAL_COLORS.HOLD },
      { time: 3 as unknown as string, value: sell, color: SIGNAL_COLORS.SELL },
    ]);

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [buy, hold, sell]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '280px', position: 'relative' }} />
  );
}
