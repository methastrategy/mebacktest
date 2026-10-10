import React, { useEffect, useRef, useState } from 'react';
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
import { calculateEMA, calculateNextEMA } from '../core/indicators';

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
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);

  // Incremental state tracking for O(1) step updates
  const lastEma20Ref = useRef<number | null>(null);
  const lastEma50Ref = useRef<number | null>(null);
  const lastEma200Ref = useRef<number | null>(null);
  const lastProcessedTimeRef = useRef<number | null>(null);

  // Indicators toggle state
  const [showEma20, setShowEma20] = useState<boolean>(true);
  const [showEma50, setShowEma50] = useState<boolean>(true);
  const [showEma200, setShowEma200] = useState<boolean>(true);

  // Shift (rightOffset margin) & Auto-Scroll state
  const [rightOffset, setRightOffset] = useState<number>(20);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

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
        rightOffset: 20,
        fixRightEdge: false,
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

    // EMA series (EMA 20 Sky Blue, EMA 50 Orange, EMA 200 Purple)
    const ema20 = chart.addLineSeries({
      color: '#38bdf8',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'EMA 20',
      visible: showEma20,
    });

    const ema50 = chart.addLineSeries({
      color: '#f97316',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'EMA 50',
      visible: showEma50,
    });

    const ema200 = chart.addLineSeries({
      color: '#c084fc',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'EMA 200',
      visible: showEma200,
    });

    chartRef.current = chart;
    seriesRef.current = series;
    ema20SeriesRef.current = ema20;
    ema50SeriesRef.current = ema50;
    ema200SeriesRef.current = ema200;

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
      ema20SeriesRef.current = null;
      ema50SeriesRef.current = null;
      ema200SeriesRef.current = null;
    };
  }, []);

  // Update Blind Mode formatting dynamically without destroying the chart
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
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
      timeScale: {
        tickMarkFormatter: (time: number) => {
          if (isBlindMode) {
            return '';
          }
          const d = new Date(time * 1000);
          return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        },
      },
    });
  }, [isBlindMode]);

  // Toggle EMA Visibility
  useEffect(() => {
    ema20SeriesRef.current?.applyOptions({ visible: showEma20 });
  }, [showEma20]);

  useEffect(() => {
    ema50SeriesRef.current?.applyOptions({ visible: showEma50 });
  }, [showEma50]);

  useEffect(() => {
    ema200SeriesRef.current?.applyOptions({ visible: showEma200 });
  }, [showEma200]);

  // Apply right offset (shift) and scroll option
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().applyOptions({
        rightOffset,
        fixRightEdge: false,
      });
      if (autoScroll) {
        chartRef.current.timeScale().scrollToRealTime();
      }
    }
  }, [rightOffset, autoScroll]);

  // Set chart data when bars change (initial dataset load, random scenario, date jump)
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

    // Calculate EMAs for visible bars
    const ema20Data = calculateEMA(bars, 20);
    const ema50Data = calculateEMA(bars, 50);
    const ema200Data = calculateEMA(bars, 200);

    ema20SeriesRef.current?.setData(ema20Data);
    ema50SeriesRef.current?.setData(ema50Data);
    ema200SeriesRef.current?.setData(ema200Data);

    lastEma20Ref.current = ema20Data.length > 0 ? ema20Data[ema20Data.length - 1].value : null;
    lastEma50Ref.current = ema50Data.length > 0 ? ema50Data[ema50Data.length - 1].value : null;
    lastEma200Ref.current = ema200Data.length > 0 ? ema200Data[ema200Data.length - 1].value : null;
    lastProcessedTimeRef.current = bars[bars.length - 1]?.time ?? null;

    // Auto scroll to latest bar
    if (autoScroll && chartRef.current) {
      chartRef.current.timeScale().scrollToRealTime();
    }
  }, [bars]);

  // High-performance 60 FPS incremental update on single step forward
  useEffect(() => {
    if (!seriesRef.current || !currentBar) return;

    // If bar time matches last processed, update current bar in place
    if (lastProcessedTimeRef.current !== null && currentBar.time <= lastProcessedTimeRef.current) {
      seriesRef.current.update({
        time: currentBar.time,
        open: currentBar.open,
        high: currentBar.high,
        low: currentBar.low,
        close: currentBar.close,
      });
      return;
    }

    // New candle step forward: append bar via series.update() in O(1)
    seriesRef.current.update({
      time: currentBar.time,
      open: currentBar.open,
      high: currentBar.high,
      low: currentBar.low,
      close: currentBar.close,
    });

    // Incrementally calculate and append EMAs in O(1) time
    const nextEma20 =
      lastEma20Ref.current !== null
        ? calculateNextEMA(currentBar.close, lastEma20Ref.current, 20)
        : currentBar.close;
    lastEma20Ref.current = nextEma20;
    ema20SeriesRef.current?.update({ time: currentBar.time, value: nextEma20 });

    const nextEma50 =
      lastEma50Ref.current !== null
        ? calculateNextEMA(currentBar.close, lastEma50Ref.current, 50)
        : currentBar.close;
    lastEma50Ref.current = nextEma50;
    ema50SeriesRef.current?.update({ time: currentBar.time, value: nextEma50 });

    const nextEma200 =
      lastEma200Ref.current !== null
        ? calculateNextEMA(currentBar.close, lastEma200Ref.current, 200)
        : currentBar.close;
    lastEma200Ref.current = nextEma200;
    ema200SeriesRef.current?.update({ time: currentBar.time, value: nextEma200 });

    lastProcessedTimeRef.current = currentBar.time;

    // Auto scroll if enabled
    if (autoScroll && chartRef.current) {
      chartRef.current.timeScale().scrollToRealTime();
    }
  }, [currentBar, autoScroll]);

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
      // Do not duplicate entry arrow for partial close split slices
      if (!pos.id.includes('_part_')) {
        markers.push({
          time: pos.entryTime as UTCTimestamp,
          position: pos.type === 'BUY' ? 'belowBar' : 'aboveBar',
          color: pos.type === 'BUY' ? '#089981' : '#f23645',
          shape: pos.type === 'BUY' ? 'arrowUp' : 'arrowDown',
          text: `${pos.type} ${pos.volume}L`,
        });
      }

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
        const isBE = Math.abs(pos.stopLoss - pos.entryPrice) < 0.001;
        const slLine = seriesRef.current.createPriceLine({
          price: pos.stopLoss,
          color: isBE ? '#eab308' : '#f23645',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: isBE ? `BE #${pos.id.slice(-4)}` : `SL #${pos.id.slice(-4)}`,
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

  const handleSetRightOffset = (offset: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(offset)));
    setRightOffset(clamped);
    if (chartRef.current) {
      chartRef.current.timeScale().applyOptions({
        rightOffset: clamped,
        fixRightEdge: false,
      });
      chartRef.current.timeScale().scrollToRealTime();
    }
  };

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

      {/* Floating Chart Controls on Top-Right: Indicators, Shift, Auto-Scroll */}
      <div className="absolute top-3 right-4 flex items-center gap-2 z-10 select-none">
        {/* Indicators Control Group */}
        <div className="bg-tv-surface/90 backdrop-blur border border-tv-border px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-lg text-xs">
          <span className="text-[11px] font-semibold text-tv-muted mr-0.5">EMA:</span>
          <button
            onClick={() => setShowEma20((prev) => !prev)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all border ${
              showEma20
                ? 'bg-sky-500/20 text-sky-400 border-sky-400/40 shadow-sm'
                : 'text-tv-muted border-transparent hover:text-white'
            }`}
            title="Toggle EMA 20 (Cyan)"
          >
            20
          </button>
          <button
            onClick={() => setShowEma50((prev) => !prev)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all border ${
              showEma50
                ? 'bg-orange-500/20 text-orange-400 border-orange-400/40 shadow-sm'
                : 'text-tv-muted border-transparent hover:text-white'
            }`}
            title="Toggle EMA 50 (Orange)"
          >
            50
          </button>
          <button
            onClick={() => setShowEma200((prev) => !prev)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all border ${
              showEma200
                ? 'bg-purple-500/20 text-purple-400 border-purple-400/40 shadow-sm'
                : 'text-tv-muted border-transparent hover:text-white'
            }`}
            title="Toggle EMA 200 (Purple)"
          >
            200
          </button>
        </div>

        {/* Shift / Right Margin Offset Control */}
        <div className="bg-tv-surface/90 backdrop-blur border border-tv-border px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-lg text-xs">
          <span className="text-[11px] font-semibold text-tv-muted mr-0.5">Shift:</span>
          <div className="flex items-center gap-1">
            {[0, 15, 25, 45].map((offset) => (
              <button
                key={offset}
                onClick={() => handleSetRightOffset(offset)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all border ${
                  rightOffset === offset
                    ? 'bg-tv-blue text-white border-tv-blue font-bold shadow-sm'
                    : 'text-tv-muted border-transparent hover:text-white'
                }`}
                title={`Shift right margin by ${offset} bars`}
              >
                {offset}b
              </button>
            ))}
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={rightOffset}
            onChange={(e) => handleSetRightOffset(parseInt(e.target.value) || 0)}
            className="w-14 h-1 accent-tv-blue cursor-pointer hidden md:inline-block"
            title={`Adjust blank space right margin (${rightOffset} bars)`}
          />
          <span className="text-[10px] font-mono text-tv-muted min-w-[20px] text-right hidden md:inline-block">
            {rightOffset}b
          </span>
        </div>

        {/* Auto Scroll Toggle */}
        <button
          onClick={() => {
            const next = !autoScroll;
            setAutoScroll(next);
            if (next && chartRef.current) {
              chartRef.current.timeScale().scrollToRealTime();
            }
          }}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border backdrop-blur shadow-lg transition-all flex items-center gap-1.5 ${
            autoScroll
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
              : 'bg-tv-surface/90 text-tv-muted border-tv-border hover:text-white'
          }`}
          title="Auto scroll to latest candle on replay step"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${autoScroll ? 'bg-emerald-400 animate-pulse' : 'bg-tv-muted'}`} />
          Auto-Scroll
        </button>
      </div>
    </div>
  );
};
