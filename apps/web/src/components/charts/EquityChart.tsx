import { AreaSeries, createChart, HistogramSeries, LineSeries } from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { useChartColors } from '../../hooks/useChartColors';

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
        borderColor: colors.borderColor,
        textColor: colors.textColor,
      },
      timeScale: {
        borderColor: colors.borderColor,
        timeVisible: false,
      },
      crosshair: {
        vertLine: { color: colors.crosshairColor },
        horzLine: { color: colors.crosshairColor },
      },
      handleScroll: false,
      handleScale: false,
    });

    const paperSeries = chart.addSeries(AreaSeries, {
      lineColor: colors.accentLine,
      topColor: colors.accentFillTop,
      bottomColor: colors.accentFillBottom,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'Paper',
    });

    const liveSeries = chart.addSeries(AreaSeries, {
      lineColor: colors.liveAccent,
      topColor: colors.liveFillTop,
      bottomColor: colors.liveFillBottom,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'Live',
    });

    const toData = (points: EquityPoint[]) =>
      points.map((p, i) => ({ time: (i + 1) as unknown as string, value: p.value }));

    if (paper.length) paperSeries.setData(toData(paper));
    if (live.length) liveSeries.setData(toData(live));

    if (benchmark?.length) {
      const benchSeries = chart.addSeries(LineSeries, {
        color: colors.benchmarkLine,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        title: 'Benchmark',
      });
      benchSeries.setData(toData(benchmark));
    }

    if (showDrawdown && paper.length) {
      const ddData = calcDrawdown(paper);
      const ddSeries = chart.addSeries(HistogramSeries, {
        color: colors.drawdownLight,
        priceScaleId: 'dd',
        priceLineVisible: false,
        lastValueVisible: false,
        title: 'Drawdown',
      });
      ddSeries.setData(
        ddData.map((d, i) => ({
          time: (i + 1) as unknown as string,
          value: d.value,
          color: d.value < -10 ? colors.drawdownHeavy : colors.drawdownLight,
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
  }, [paper, live, showDrawdown, benchmark, colors]);

  const hasData = paper.length > 0 || live.length > 0;

  if (!hasData) return null;

  return (
    <div ref={containerRef} style={{ width: '100%', height: '280px', position: 'relative' }} />
  );
}
