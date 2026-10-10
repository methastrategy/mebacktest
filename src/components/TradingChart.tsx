import React, { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  IPriceLine,
  SeriesMarker,
  UTCTimestamp,
  LineStyle,
} from 'lightweight-charts';
import { CandleBar } from '../types/candle';
import { Position } from '../types/trade';

interface TradingChartProps {
  bars: CandleBar[];
  currentBar: CandleBar | null;
  positions: Position[];
  closedPositions: Position[];
  isBlindMode: boolean;
  onPriceClick?: (price: number) => void;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  bars,
  currentBar,
  positions,
  closedPositions,
  isBlindMode,
  onPriceClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#131722' },
        textColor: '#d1d4dc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, sans-serif',
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      crosshair: {
        mode: 1, // Magnet / normal
        vertLine: {
          color: '#787b86',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#2a2e39',
        },
        horzLine: {
          color: '#787b86',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#2a2e39',
        },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: {
          top: 0.1,
          bottom: 0.15,
        },
        autoScale: true,
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: number) => {
          if (isBlindMode) {
            return '';
          }
          const d = new Date(time * 1000);
          return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        },
      },
      localization: {
        timeFormatter: (time: number) => {
          if (isBlindMode) {
            return 'Blind Test (Date Hidden)';
          }
          const d = new Date(time * 1000);
          return d.toLocaleString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
        },
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#089981',
      downColor: '#f23645',
      borderVisible: false,
      wickUpColor: '#089981',
      wickDownColor: '#f23645',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Click handler on chart
    if (onPriceClick) {
      chart.subscribeClick((param) => {
        if (param.point && seriesRef.current) {
          const price = seriesRef.current.coordinateToPrice(param.point.y);
          if (price !== null) {
            onPriceClick(Math.round(price * 100) / 100);
          }
        }
      });
    }

    // Resize observer
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [isBlindMode]);

  // Set chart data when bars change
  useEffect(() => {
    if (!seriesRef.current || bars.length === 0) return;

    const formattedBars = bars.map((b) => ({
      time: b.time,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));

    seriesRef.current.setData(formattedBars);

    // Auto scroll to latest bar
    if (chartRef.current) {
      chartRef.current.timeScale().scrollToRealTime();
    }
  }, [bars]);

  // Update current bar if single update
  useEffect(() => {
    if (!seriesRef.current || !currentBar) return;
    seriesRef.current.update({
      time: currentBar.time,
      open: currentBar.open,
      high: currentBar.high,
      low: currentBar.low,
      close: currentBar.close,
    });
  }, [currentBar]);

  // Render Markers (Buy / Sell entry / exit markers on chart)
  useEffect(() => {
    if (!seriesRef.current) return;

    const markers: SeriesMarker<UTCTimestamp>[] = [];

    // Active positions markers
    for (const pos of positions) {
      markers.push({
        time: pos.entryTime as UTCTimestamp,
        position: pos.type === 'BUY' ? 'belowBar' : 'aboveBar',
        color: pos.type === 'BUY' ? '#089981' : '#f23645',
        shape: pos.type === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: `${pos.type} ${pos.volume}L @ ${pos.entryPrice.toFixed(2)}`,
      });
    }

    // Closed positions markers (show recent 20)
    const recentClosed = closedPositions.slice(-20);
    for (const pos of recentClosed) {
      markers.push({
        time: pos.entryTime as UTCTimestamp,
        position: pos.type === 'BUY' ? 'belowBar' : 'aboveBar',
        color: pos.type === 'BUY' ? '#089981' : '#f23645',
        shape: pos.type === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: `${pos.type} ${pos.volume}L`,
      });

      if (pos.exitTime && pos.exitPrice) {
        const isWin = (pos.realizedPnL || 0) >= 0;
        markers.push({
          time: pos.exitTime as UTCTimestamp,
          position: pos.type === 'BUY' ? 'aboveBar' : 'belowBar',
          color: isWin ? '#089981' : '#f23645',
          shape: 'circle',
          text: `Closed ${pos.status === 'CLOSED_SL' ? 'SL' : pos.status === 'CLOSED_TP' ? 'TP' : 'Exit'}: ${isWin ? '+' : ''}$${(pos.realizedPnL || 0).toFixed(1)}`,
        });
      }
    }

    // Sort markers by time
    markers.sort((a, b) => (a.time as number) - (b.time as number));

    seriesRef.current.setMarkers(markers);
  }, [positions, closedPositions]);

  // Render Price Lines for active open positions (Entry line, SL line, TP line)
  useEffect(() => {
    if (!seriesRef.current) return;

    // Remove old price lines
    for (const line of priceLinesRef.current) {
      seriesRef.current.removePriceLine(line);
    }
    priceLinesRef.current = [];

    // Draw active position lines
    for (const pos of positions) {
      // Entry Line
      const entryLine = seriesRef.current.createPriceLine({
        price: pos.entryPrice,
        color: '#2962ff',
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `${pos.type} ${pos.volume}L`,
      });
      priceLinesRef.current.push(entryLine);

      // Stop Loss Line
      if (pos.stopLoss) {
        const slLine = seriesRef.current.createPriceLine({
          price: pos.stopLoss,
          color: '#f23645',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `SL #${pos.id.slice(-4)}`,
        });
        priceLinesRef.current.push(slLine);
      }

      // Take Profit Line
      if (pos.takeProfit) {
        const tpLine = seriesRef.current.createPriceLine({
          price: pos.takeProfit,
          color: '#089981',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `TP #${pos.id.slice(-4)}`,
        });
        priceLinesRef.current.push(tpLine);
      }
    }
  }, [positions]);

  return (
    <div className="relative w-full h-full flex flex-col bg-tv-bg">
      {/* Chart Canvas */}
      <div ref={containerRef} className="w-full flex-1" />

      {/* Floating Status Badge on Top-Left */}
      <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-none z-10">
        <div className="bg-tv-surface/90 backdrop-blur border border-tv-border px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg text-xs">
          <span className="font-bold text-amber-400">XAU/USD (Gold)</span>
          <span className="text-tv-muted">|</span>
          {currentBar ? (
            <div className="flex items-center gap-2 font-mono">
              <span>O: <strong className="text-tv-text">{currentBar.open.toFixed(2)}</strong></span>
              <span>H: <strong className="text-tv-green">{currentBar.high.toFixed(2)}</strong></span>
              <span>L: <strong className="text-tv-red">{currentBar.low.toFixed(2)}</strong></span>
              <span>C: <strong className={currentBar.close >= currentBar.open ? 'text-tv-green' : 'text-tv-red'}>
                {currentBar.close.toFixed(2)}
              </strong></span>
            </div>
          ) : (
            <span className="text-tv-muted">Loading candle data...</span>
          )}
        </div>

        {isBlindMode && (
          <div className="bg-purple-900/60 border border-purple-500/50 text-purple-200 px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 backdrop-blur shadow-md">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            BLIND MODE (Date Hidden)
          </div>
        )}
      </div>
    </div>
  );
};
