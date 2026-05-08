import { AreaSeries, createChart, LineSeries } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

export type DepthLevel = {
  price: number;
  cumulativeQty: number;
};

type Props = {
  bids: DepthLevel[];
  asks: DepthLevel[];
  midPrice?: number;
};

export function DepthChart({ bids, asks, midPrice }: Props) {
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

    // Bids (green area, left side)
    const bidSeries = chart.addSeries(AreaSeries, {
      lineColor: '#00e89d',
      topColor: 'rgba(0, 232, 157, 0.25)',
      bottomColor: 'rgba(0, 232, 157, 0)',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'Bids',
    });

    // Asks (red area, right side)
    const askSeries = chart.addSeries(AreaSeries, {
      lineColor: '#ff3358',
      topColor: 'rgba(255, 51, 88, 0.25)',
      bottomColor: 'rgba(255, 51, 88, 0)',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'Asks',
    });

    // Mid price line
    if (midPrice) {
      const midSeries = chart.addSeries(LineSeries, {
        color: 'rgba(99, 102, 241, 0.6)',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      // Use bid/ask range to place the mid price marker
      const allPrices = [...bids.map((b) => b.price), ...asks.map((a) => a.price)];
      if (allPrices.length > 0) {
        const minP = Math.min(...allPrices);
        const maxP = Math.max(...allPrices);
        const maxQty = Math.max(
          ...bids.map((b) => b.cumulativeQty),
          ...asks.map((a) => a.cumulativeQty)
        );
        midSeries.setData([
          { time: minP as unknown as string, value: 0 },
          { time: midPrice as unknown as string, value: maxQty },
          { time: maxP as unknown as string, value: 0 },
        ]);
      }
    }

    // Bids: sort descending by price (highest bid first)
    const sortedBids = [...bids].sort((a, b) => b.price - a.price);
    if (sortedBids.length) {
      bidSeries.setData(
        sortedBids.map((b) => ({
          time: b.price as unknown as string,
          value: b.cumulativeQty,
        }))
      );
    }

    // Asks: sort ascending by price (lowest ask first)
    const sortedAsks = [...asks].sort((a, b) => a.price - b.price);
    if (sortedAsks.length) {
      askSeries.setData(
        sortedAsks.map((a) => ({
          time: a.price as unknown as string,
          value: a.cumulativeQty,
        }))
      );
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
  }, [bids, asks, midPrice]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '240px', position: 'relative' }} />
  );
}
