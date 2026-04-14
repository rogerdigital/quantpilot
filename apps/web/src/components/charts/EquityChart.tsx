import { AreaSeries, createChart } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

export type EquityPoint = {
  value: number;
  label: string;
};

type Props = {
  paper: EquityPoint[];
  live: EquityPoint[];
};

export function EquityChart({ paper, live }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

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
        horzLines: { color: 'rgba(0, 180, 255, 0.08)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(0, 180, 255, 0.1)',
        textColor: 'rgba(100, 140, 195, 0.65)',
      },
      timeScale: {
        borderColor: 'rgba(0, 180, 255, 0.1)',
        timeVisible: false,
      },
      crosshair: {
        vertLine: { color: 'rgba(0, 212, 255, 0.3)' },
        horzLine: { color: 'rgba(0, 212, 255, 0.3)' },
      },
      handleScroll: false,
      handleScale: false,
    });

    const paperSeries = chart.addSeries(AreaSeries, {
      lineColor: '#00d4ff',
      topColor: 'rgba(0, 212, 255, 0.09)',
      bottomColor: 'rgba(0, 212, 255, 0)',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'Paper',
    });

    const liveSeries = chart.addSeries(AreaSeries, {
      lineColor: '#ffb700',
      topColor: 'rgba(255, 183, 0, 0.07)',
      bottomColor: 'rgba(255, 183, 0, 0)',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'Live',
    });

    // Convert equity points to lightweight-charts time series format
    // Use sequential integer timestamps since labels may not be ISO dates
    const toData = (points: EquityPoint[]) =>
      points.map((p, i) => ({ time: (i + 1) as unknown as string, value: p.value }));

    if (paper.length) paperSeries.setData(toData(paper));
    if (live.length) liveSeries.setData(toData(live));

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [paper, live]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '280px', position: 'relative' }}
    />
  );
}
