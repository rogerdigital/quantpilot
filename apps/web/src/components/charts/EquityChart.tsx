import { AreaSeries, createChart, HistogramSeries, LineSeries } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

export type EquityPoint = {
  value: number;
  label: string;
};

type Props = {
  paper: EquityPoint[];
  live: EquityPoint[];
  showDrawdown?: boolean;
  benchmark?: EquityPoint[];
};

function calcDrawdown(points: EquityPoint[]): { value: number; label: string }[] {
  let peak = -Infinity;
  return points.map((p) => {
    peak = Math.max(peak, p.value);
    const dd = peak > 0 ? ((p.value - peak) / peak) * 100 : 0;
    return { value: dd, label: p.label };
  });
}

export function EquityChart({ paper, live, showDrawdown = false, benchmark }: Props) {
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
        horzLines: { color: 'rgba(99, 102, 241, 0.08)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(99, 102, 241, 0.12)',
        textColor: 'rgba(160, 162, 210, 0.65)',
      },
      timeScale: {
        borderColor: 'rgba(99, 102, 241, 0.12)',
        timeVisible: false,
      },
      crosshair: {
        vertLine: { color: 'rgba(99, 102, 241, 0.40)' },
        horzLine: { color: 'rgba(99, 102, 241, 0.40)' },
      },
      handleScroll: false,
      handleScale: false,
    });

    const paperSeries = chart.addSeries(AreaSeries, {
      lineColor: '#6366f1',
      topColor: 'rgba(99, 102, 241, 0.12)',
      bottomColor: 'rgba(99, 102, 241, 0)',
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

    const toData = (points: EquityPoint[]) =>
      points.map((p, i) => ({ time: (i + 1) as unknown as string, value: p.value }));

    if (paper.length) paperSeries.setData(toData(paper));
    if (live.length) liveSeries.setData(toData(live));

    // Benchmark line
    if (benchmark?.length) {
      const benchSeries = chart.addSeries(LineSeries, {
        color: 'rgba(160, 162, 210, 0.4)',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        title: 'Benchmark',
      });
      benchSeries.setData(toData(benchmark));
    }

    // Drawdown overlay
    if (showDrawdown && paper.length) {
      const ddData = calcDrawdown(paper);
      const ddSeries = chart.addSeries(HistogramSeries, {
        color: 'rgba(255, 51, 88, 0.25)',
        priceScaleId: 'dd',
        priceLineVisible: false,
        lastValueVisible: false,
        title: 'Drawdown',
      });
      ddSeries.setData(
        ddData.map((d, i) => ({
          time: (i + 1) as unknown as string,
          value: d.value,
          color: d.value < -10 ? 'rgba(255, 51, 88, 0.4)' : 'rgba(255, 51, 88, 0.2)',
        }))
      );
      chart.priceScale('dd').applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      });
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [paper, live, showDrawdown, benchmark]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '280px', position: 'relative' }} />
  );
}
