import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Timeframe, CandleBar } from './types/candle';
import { AccountState, OrderType } from './types/trade';
import { parseCandleCsv } from './core/DataParser';
import { ReplayEngine } from './core/ReplayEngine';
import { GoldTradingEngine } from './core/GoldTradingEngine';
import { PropFirmEngine, PropFirmState } from './core/PropFirmEngine';
import { TopNavbar } from './components/TopNavbar';
import { TradingChart } from './components/TradingChart';
import { ReplayControls } from './components/ReplayControls';
import { OrderEntryPanel } from './components/OrderEntryPanel';
import { AccountSummary } from './components/AccountSummary';
import { PositionList } from './components/PositionList';
import { PerformanceModal } from './components/PerformanceModal';
import { ShortcutsHelpModal } from './components/ShortcutsHelpModal';
import { PropFirmHUD } from './components/PropFirmHUD';

export const App: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('M15');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(500);
  const [isBlindMode, setIsBlindMode] = useState<boolean>(false);
  const [clickedChartPrice, setClickedChartPrice] = useState<number | undefined>();

  const [spreadPips, setSpreadPips] = useState<number>(25);

  // Prop Firm Mode State
  const [isPropModeEnabled, setIsPropModeEnabled] = useState<boolean>(false);

  // Modals
  const [isPerfModalOpen, setIsPerfModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Engines Refs (Preserve state across renders)
  const replayEngineRef = useRef<ReplayEngine>(new ReplayEngine());
  const tradingEngineRef = useRef<GoldTradingEngine>(new GoldTradingEngine(100000, 25));
  const propFirmEngineRef = useRef<PropFirmEngine>(new PropFirmEngine({ initialBalance: 100000 }));
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reactive state for UI
  const [visibleBars, setVisibleBars] = useState<CandleBar[]>([]);
  const [currentBar, setCurrentBar] = useState<CandleBar | null>(null);
  const [cursorIndex, setCursorIndex] = useState<number>(-1);
  const [totalBars, setTotalBars] = useState<number>(0);
  const [accountState, setAccountState] = useState<AccountState>(() =>
    tradingEngineRef.current.getState()
  );
  const [propFirmState, setPropFirmState] = useState<PropFirmState>(() =>
    propFirmEngineRef.current.getStatus()
  );

  // Load dataset for given timeframe
  const loadDatasetForTimeframe = useCallback(async (tf: Timeframe) => {
    setIsLoading(true);
    setIsPlaying(false);
    if (playTimerRef.current) clearInterval(playTimerRef.current);

    try {
      const response = await fetch(`/data/XAUUSD_${tf}.csv`);
      if (!response.ok) {
        throw new Error(`Failed to load dataset: ${response.statusText}`);
      }
      const csvText = await response.text();
      const bars = parseCandleCsv(csvText);

      replayEngineRef.current.loadDataset(bars, 60); // 60 initial bars
      const initialVisible = replayEngineRef.current.getVisibleBars();
      const initialBar = replayEngineRef.current.getCurrentBar();

      setVisibleBars(initialVisible);
      setCurrentBar(initialBar);
      setCursorIndex(replayEngineRef.current.getCurrentCursor());
      setTotalBars(replayEngineRef.current.getTotalBars());

      if (initialBar) {
        tradingEngineRef.current.updateMarketPrice(initialBar.close);
        setAccountState(tradingEngineRef.current.getState());
      }
    } catch (err) {
      console.error('Error loading dataset:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDatasetForTimeframe(timeframe);
  }, [timeframe, loadDatasetForTimeframe]);

  // Handle single Step Forward (60 FPS Performance Optimized)
  const handleStepForward = useCallback(() => {
    const replay = replayEngineRef.current;
    const trader = tradingEngineRef.current;

    const nextBar = replay.nextStep();
    if (!nextBar) {
      setIsPlaying(false);
      return;
    }

    // Process SL/TP triggers on new candle
    trader.processBarTriggers(nextBar);

    // CRITICAL OPTIMIZATION: Do not call setVisibleBars(...) here!
    // Updating only currentBar triggers O(1) incremental series.update(nextBar)
    // in TradingChart, eliminating setData() overhead and locking 60 FPS.
    setCurrentBar(nextBar);
    setCursorIndex(replay.getCurrentCursor());
    const acc = trader.getState();
    setAccountState(acc);
    setPropFirmState(propFirmEngineRef.current.updateEquity(acc.equity, acc.balance, nextBar.time));
  }, []);

  // Play / Pause loop
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        handleStepForward();
      }, speedMs);
    } else {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, speedMs, handleStepForward]);

  // Toggle Play / Pause
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Trigger Random Scenario
  const handleRandomScenario = useCallback(() => {
    setIsPlaying(false);
    replayEngineRef.current.triggerRandomScenario(60);
    const visible = replayEngineRef.current.getVisibleBars();
    const bar = replayEngineRef.current.getCurrentBar();

    setVisibleBars(visible);
    setCurrentBar(bar);
    setCursorIndex(replayEngineRef.current.getCurrentCursor());

    if (bar) {
      tradingEngineRef.current.updateMarketPrice(bar.close);
      setAccountState(tradingEngineRef.current.getState());
    }
  }, []);

  // Toggle Blind Mode
  const handleToggleBlindMode = useCallback(() => {
    const nextState = replayEngineRef.current.toggleBlindMode();
    setIsBlindMode(nextState);
  }, []);

  // Jump to specific Date
  const handleJumpToDate = useCallback((dateStr: string) => {
    setIsPlaying(false);
    const bar = replayEngineRef.current.jumpToDate(dateStr);
    if (bar) {
      setVisibleBars(replayEngineRef.current.getVisibleBars());
      setCurrentBar(bar);
      setCursorIndex(replayEngineRef.current.getCurrentCursor());
      tradingEngineRef.current.updateMarketPrice(bar.close);
      setAccountState(tradingEngineRef.current.getState());
    }
  }, []);

  // Spread change handler
  const handleChangeSpread = useCallback(
    (newSpread: number) => {
      setSpreadPips(newSpread);
      tradingEngineRef.current.setSpread(newSpread);
      if (currentBar) {
        tradingEngineRef.current.updateMarketPrice(currentBar.close);
        setAccountState(tradingEngineRef.current.getState());
      }
    },
    [currentBar]
  );

  // Place manual trade with configurable spread
  const handlePlaceOrder = useCallback(
    (params: {
      type: OrderType;
      volume: number;
      stopLoss?: number;
      takeProfit?: number;
      spread?: number;
      setupTag?: string;
    }) => {
      if (!currentBar) return;

      tradingEngineRef.current.openMarketOrder({
        type: params.type,
        volume: params.volume,
        price: currentBar.close,
        time: currentBar.time,
        barIndex: cursorIndex,
        stopLoss: params.stopLoss,
        takeProfit: params.takeProfit,
        spread: params.spread !== undefined ? params.spread : spreadPips,
        setupTag: params.setupTag,
      });

      const acc = tradingEngineRef.current.getState();
      setAccountState(acc);
      setPropFirmState(propFirmEngineRef.current.updateEquity(acc.equity, acc.balance, currentBar.time));
    },
    [currentBar, cursorIndex, spreadPips]
  );

  // Close position manually
  const handleClosePosition = useCallback(
    (id: string) => {
      if (!currentBar) return;
      tradingEngineRef.current.closePosition(id, currentBar.close, currentBar.time, 'MANUAL');
      const acc = tradingEngineRef.current.getState();
      setAccountState(acc);
      setPropFirmState(propFirmEngineRef.current.updateEquity(acc.equity, acc.balance, currentBar.time));
    },
    [currentBar]
  );

  // Move position SL to Break-Even (Entry Price)
  const handleMoveToBreakEven = useCallback((id: string) => {
    tradingEngineRef.current.moveToBreakEven(id);
    const acc = tradingEngineRef.current.getState();
    setAccountState(acc);
    if (currentBar) {
      setPropFirmState(propFirmEngineRef.current.updateEquity(acc.equity, acc.balance, currentBar.time));
    }
  }, [currentBar]);

  // Partially close position (e.g. 50%)
  const handlePartialClose = useCallback(
    (id: string, ratio: number = 0.5) => {
      if (!currentBar) return;
      tradingEngineRef.current.partialClosePosition(id, ratio, currentBar.close, currentBar.time);
      const acc = tradingEngineRef.current.getState();
      setAccountState(acc);
      setPropFirmState(propFirmEngineRef.current.updateEquity(acc.equity, acc.balance, currentBar.time));
    },
    [currentBar]
  );

  // Select Prop Firm Challenge Account Size
  const handleSelectAccountSize = useCallback(
    (size: number) => {
      tradingEngineRef.current.reset(size, spreadPips);
      propFirmEngineRef.current.reset(size);
      if (currentBar) {
        tradingEngineRef.current.updateMarketPrice(currentBar.close);
      }
      const acc = tradingEngineRef.current.getState();
      setAccountState(acc);
      if (currentBar) {
        setPropFirmState(propFirmEngineRef.current.updateEquity(acc.equity, acc.balance, currentBar.time));
      } else {
        setPropFirmState(propFirmEngineRef.current.getStatus());
      }
    },
    [currentBar, spreadPips]
  );

  const handleResetChallenge = useCallback(() => {
    handleSelectAccountSize(propFirmState.initialBalance);
  }, [handleSelectAccountSize, propFirmState.initialBalance]);

  // Reset Session
  const handleResetSession = useCallback(() => {
    if (window.confirm('ต้องการรีเซ็ตยอดเงินและประวัติการเทรดทั้งหมดหรือไม่?')) {
      handleSelectAccountSize(propFirmState.initialBalance);
    }
  }, [handleSelectAccountSize, propFirmState.initialBalance]);

  // Custom CSV Upload
  const handleCustomCsvUpload = useCallback((csvText: string, filename: string) => {
    try {
      const bars = parseCandleCsv(csvText);
      if (bars.length === 0) {
        alert('ไม่พบข้อมูลแท่งเทียนที่ถูกต้องในไฟล์ CSV');
        return;
      }
      setIsPlaying(false);
      replayEngineRef.current.loadDataset(bars, 60);
      const visible = replayEngineRef.current.getVisibleBars();
      const initialBar = replayEngineRef.current.getCurrentBar();

      setVisibleBars(visible);
      setCurrentBar(initialBar);
      setCursorIndex(replayEngineRef.current.getCurrentCursor());
      setTotalBars(replayEngineRef.current.getTotalBars());

      if (initialBar) {
        tradingEngineRef.current.updateMarketPrice(initialBar.close);
        setAccountState(tradingEngineRef.current.getState());
      }
      alert(`โหลดข้อมูล ${filename} สำเร็จ (${bars.length.toLocaleString()} แท่งเทียน)`);
    } catch (err) {
      alert(`Error parsing CSV: ${err}`);
    }
  }, []);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleStepForward();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleStepForward();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRandomScenario();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleBlindMode();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handlePlaceOrder({ type: 'BUY', volume: 0.1 });
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handlePlaceOrder({ type: 'SELL', volume: 0.1 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleStepForward,
    handleTogglePlay,
    handleRandomScenario,
    handleToggleBlindMode,
    handlePlaceOrder,
  ]);

  return (
    <div className="flex flex-col w-screen h-screen bg-tv-bg text-tv-text overflow-hidden">
      {/* Top Navigation */}
      <TopNavbar
        currentTimeframe={timeframe}
        onSelectTimeframe={setTimeframe}
        onCustomCsvUpload={handleCustomCsvUpload}
        onResetSession={handleResetSession}
        onOpenPerformance={() => setIsPerfModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        isLoading={isLoading}
      />

      {/* Main Trading Workstation */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center Area: Candlestick Chart */}
        <div className="flex-1 relative flex flex-col h-full overflow-hidden">
          {/* Prop Firm Challenge HUD Ribbon (Top Right) */}
          <div className="absolute top-3 right-4 z-20">
            <PropFirmHUD
              isEnabled={isPropModeEnabled}
              onToggleEnabled={() => setIsPropModeEnabled((prev) => !prev)}
              state={propFirmState}
              onSelectAccountSize={handleSelectAccountSize}
              onResetChallenge={handleResetChallenge}
            />
          </div>

          <TradingChart
            bars={visibleBars}
            currentBar={currentBar}
            positions={accountState.openPositions}
            closedPositions={accountState.closedPositions}
            isBlindMode={isBlindMode}
            onPriceClick={(price) => setClickedChartPrice(price)}
          />

          {/* Floating Bottom Replay Controls */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
            <ReplayControls
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onStepForward={handleStepForward}
              speedMs={speedMs}
              onChangeSpeed={setSpeedMs}
              onRandomScenario={handleRandomScenario}
              isBlindMode={isBlindMode}
              onToggleBlindMode={handleToggleBlindMode}
              onJumpToDate={handleJumpToDate}
              cursorIndex={cursorIndex}
              totalBars={totalBars}
              activeScenario={replayEngineRef.current.getActiveScenario()}
              onOpenHelp={() => setIsHelpModalOpen(true)}
            />
          </div>
        </div>

        {/* Right Sidebar: Trade Execution & Positions */}
        <div className="w-80 md:w-96 border-l border-tv-border bg-tv-surface/40 flex flex-col p-3 gap-3 overflow-y-auto z-10">
          <AccountSummary account={accountState} />

          <OrderEntryPanel
            currentPrice={currentBar?.close || 0}
            onPlaceOrder={handlePlaceOrder}
            clickedPrice={clickedChartPrice}
            spreadPips={spreadPips}
            onChangeSpread={handleChangeSpread}
          />

          <PositionList
            positions={accountState.openPositions}
            onClosePosition={handleClosePosition}
            onBreakEven={handleMoveToBreakEven}
            onPartialClose={handlePartialClose}
          />
        </div>
      </div>

      {/* Modals */}
      <PerformanceModal
        isOpen={isPerfModalOpen}
        onClose={() => setIsPerfModalOpen(false)}
        account={accountState}
      />

      <ShortcutsHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
};
