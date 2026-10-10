import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Timeframe, CandleBar } from './types/candle';
import { AccountState, OrderType } from './types/trade';
import { parseCandleCsv } from './core/DataParser';
import { ReplayEngine } from './core/ReplayEngine';
import { GoldTradingEngine } from './core/GoldTradingEngine';
import { PropFirmEngine, PropFirmState } from './core/PropFirmEngine';
import { DataLakeService } from './core/DataLakeService';
import { AuthService } from './core/AuthService';
import { CloudSessionService } from './core/CloudSessionService';
import { getAssetSpec } from './core/AssetSpecs';
import { UserProfile } from './types/auth';
import { CloudSessionRecord } from './types/cloud';

import { TopNavbar } from './components/TopNavbar';
import { TradingChart } from './components/TradingChart';
import { ReplayControls } from './components/ReplayControls';
import { OrderEntryPanel } from './components/OrderEntryPanel';
import { AccountSummary } from './components/AccountSummary';
import { PositionList } from './components/PositionList';
import { PerformanceModal } from './components/PerformanceModal';
import { ShortcutsHelpModal } from './components/ShortcutsHelpModal';
import { PropFirmHUD } from './components/PropFirmHUD';
import { ChartWatermark } from './components/ChartWatermark';
import { AuthModal } from './components/AuthModal';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { CloudSessionsModal } from './components/CloudSessionsModal';
import { SocialShareModal } from './components/SocialShareModal';
import { AffiliateModal } from './components/AffiliateModal';
import { FeedbackModal } from './components/FeedbackModal';
import { LandingPage } from './components/LandingPage';
import { Eye, LogOut } from 'lucide-react';

export const App: React.FC = () => {
  const [currentSymbol, setCurrentSymbol] = useState<string>('XAUUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>('M15');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(500);
  const [isBlindMode, setIsBlindMode] = useState<boolean>(false);
  const [clickedChartPrice, setClickedChartPrice] = useState<number | undefined>();
  const [spreadPips, setSpreadPips] = useState<number>(25);

  // Prop Firm Mode State
  const [isPropModeEnabled, setIsPropModeEnabled] = useState<boolean>(false);

  // Commercial Landing Page Toggle
  const [isLandingActive, setIsLandingActive] = useState<boolean>(false);

  // Read-only Shared Session Mode
  const [isReadOnlySession, setIsReadOnlySession] = useState<boolean>(false);
  const [sharedSessionTitle, setSharedSessionTitle] = useState<string>('');

  // Modals
  const [isPerfModalOpen, setIsPerfModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [upgradePlanInit, setUpgradePlanInit] = useState<string>('pro_monthly');
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [isSocialShareModalOpen, setIsSocialShareModalOpen] = useState<boolean>(false);
  const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState<boolean>(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);

  // User Profile
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    AuthService.getInstance().getCurrentUser()
  );

  // Engines Refs (Preserve state across renders)
  const replayEngineRef = useRef<ReplayEngine>(new ReplayEngine());
  const tradingEngineRef = useRef<GoldTradingEngine>(new GoldTradingEngine(100000, 25, 'XAUUSD'));
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

  // Subscribe to Auth changes
  useEffect(() => {
    const unsub = AuthService.getInstance().subscribe((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Load dataset for given symbol and timeframe via DataLakeService
  const loadDataset = useCallback(async (sym: string, tf: Timeframe) => {
    setIsLoading(true);
    setIsPlaying(false);
    if (playTimerRef.current) clearInterval(playTimerRef.current);

    try {
      const bars = await DataLakeService.getInstance().loadCandles(sym, tf);

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

  // Symbol or Timeframe change
  useEffect(() => {
    const spec = getAssetSpec(currentSymbol);
    setSpreadPips(spec.defaultSpread);
    tradingEngineRef.current.reset(propFirmState.initialBalance, spec.defaultSpread, currentSymbol);
    loadDataset(currentSymbol, timeframe);
  }, [currentSymbol, timeframe, loadDataset, propFirmState.initialBalance]);

  // Check URL query for share link e.g. ?share=slug
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get('share');
    if (shareParam) {
      const sess = CloudSessionService.getInstance().getSessionById(shareParam);
      if (sess) {
        setIsReadOnlySession(true);
        setSharedSessionTitle(sess.title);
        setCurrentSymbol(sess.symbol);
        setTimeframe(sess.timeframe);
        setAccountState(sess.accountState);
        setPropFirmState(sess.propFirmState);
      }
    }
  }, []);

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

  // Place manual trade
  const handlePlaceOrder = useCallback(
    (params: {
      type: OrderType;
      volume: number;
      stopLoss?: number;
      takeProfit?: number;
      spread?: number;
      setupTag?: string;
    }) => {
      if (!currentBar || isReadOnlySession) return;

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
    [currentBar, cursorIndex, spreadPips, isReadOnlySession]
  );

  // Close position manually
  const handleClosePosition = useCallback(
    (id: string) => {
      if (!currentBar || isReadOnlySession) return;
      tradingEngineRef.current.closePosition(id, currentBar.close, currentBar.time, 'MANUAL');
      const acc = tradingEngineRef.current.getState();
      setAccountState(acc);
      setPropFirmState(propFirmEngineRef.current.updateEquity(acc.equity, acc.balance, currentBar.time));
    },
    [currentBar, isReadOnlySession]
  );

  // Move position SL to Break-Even
  const handleMoveToBreakEven = useCallback(
    (id: string) => {
      if (isReadOnlySession) return;
      tradingEngineRef.current.moveToBreakEven(id);
      const acc = tradingEngineRef.current.getState();
      setAccountState(acc);
      if (currentBar) {
        setPropFirmState(propFirmEngineRef.current.updateEquity(acc.equity, acc.balance, currentBar.time));
      }
    },
    [currentBar, isReadOnlySession]
  );

  // Partially close position
  const handlePartialClose = useCallback(
    (id: string, ratio: number = 0.5) => {
      if (!currentBar || isReadOnlySession) return;
      tradingEngineRef.current.partialClosePosition(id, ratio, currentBar.close, currentBar.time);
      const acc = tradingEngineRef.current.getState();
      setAccountState(acc);
      setPropFirmState(propFirmEngineRef.current.updateEquity(acc.equity, acc.balance, currentBar.time));
    },
    [currentBar, isReadOnlySession]
  );

  // Select Prop Firm Challenge Account Size
  const handleSelectAccountSize = useCallback(
    (size: number) => {
      tradingEngineRef.current.reset(size, spreadPips, currentSymbol);
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
    [currentBar, spreadPips, currentSymbol]
  );

  const handleResetChallenge = useCallback(() => {
    handleSelectAccountSize(propFirmState.initialBalance);
  }, [handleSelectAccountSize, propFirmState.initialBalance]);

  // Reset Session
  const handleResetSession = useCallback(() => {
    if (window.confirm('Reset current balance and trade history?')) {
      handleSelectAccountSize(propFirmState.initialBalance);
      setIsReadOnlySession(false);
    }
  }, [handleSelectAccountSize, propFirmState.initialBalance]);

  // Load past Cloud Session into Terminal
  const handleLoadCloudSession = useCallback((sess: CloudSessionRecord) => {
    setCurrentSymbol(sess.symbol);
    setTimeframe(sess.timeframe);
    setAccountState(sess.accountState);
    setPropFirmState(sess.propFirmState);
    setIsReadOnlySession(false);
  }, []);

  // Custom CSV Upload
  const handleCustomCsvUpload = useCallback((csvText: string, filename: string) => {
    try {
      const bars = parseCandleCsv(csvText);
      if (bars.length === 0) {
        alert('No valid candle bars detected in CSV');
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
      alert(`Loaded ${filename} successfully (${bars.length.toLocaleString()} bars)`);
    } catch (err) {
      alert(`Error parsing CSV: ${err}`);
    }
  }, []);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowRight') {
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

  const isPro = AuthService.getInstance().isPro();

  // If Commercial Landing Page is activated
  if (isLandingActive) {
    return (
      <LandingPage
        onLaunchTerminal={() => setIsLandingActive(false)}
        onOpenUpgrade={(planId) => {
          setUpgradePlanInit(planId || 'pro_monthly');
          setIsUpgradeModalOpen(true);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col w-screen h-screen bg-tv-bg text-tv-text overflow-hidden select-none">
      {/* Read-Only Replay Banner if in shared session mode */}
      {isReadOnlySession && (
        <div className="h-8 bg-amber-500/20 border-b border-amber-500/40 px-4 flex items-center justify-between text-xs font-semibold text-amber-300 z-40">
          <div className="flex items-center gap-2">
            <Eye size={14} />
            <span>Viewing Shared Replay Session: <strong>{sharedSessionTitle}</strong> (Read-Only Mode)</span>
          </div>
          <button
            onClick={() => setIsReadOnlySession(false)}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <LogOut size={13} />
            <span>Exit Inspector</span>
          </button>
        </div>
      )}

      {/* Top Navigation Bar */}
      <TopNavbar
        currentSymbol={currentSymbol}
        onSelectSymbol={setCurrentSymbol}
        currentTimeframe={timeframe}
        onSelectTimeframe={setTimeframe}
        onCustomCsvUpload={handleCustomCsvUpload}
        onResetSession={handleResetSession}
        onOpenPerformance={() => setIsPerfModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenCloudSessions={() => setIsCloudModalOpen(true)}
        onOpenSocialShare={() => setIsSocialShareModalOpen(true)}
        onOpenUpgrade={(planId) => {
          setUpgradePlanInit(planId || 'pro_monthly');
          setIsUpgradeModalOpen(true);
        }}
        onOpenAffiliate={() => setIsAffiliateModalOpen(true)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onToggleLanding={() => setIsLandingActive(true)}
        currentUser={currentUser}
        isLandingActive={isLandingActive}
        isLoading={isLoading}
      />

      {/* Main Trading Workstation */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center Area: Candlestick Chart */}
        <div className="flex-1 relative flex flex-col h-full overflow-hidden">
          {/* Subtle Free Tier Watermark */}
          {!isPro && (
            <ChartWatermark
              onUpgradeClick={() => {
                setUpgradePlanInit('day_pass');
                setIsUpgradeModalOpen(true);
              }}
            />
          )}

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

      {/* Modals & Dialogs */}
      <PerformanceModal
        isOpen={isPerfModalOpen}
        onClose={() => setIsPerfModalOpen(false)}
        account={accountState}
      />

      <ShortcutsHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={(u) => setCurrentUser(u)}
      />

      <ProUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        initialPlan={upgradePlanInit}
        onUpgradeSuccess={() => setCurrentUser(AuthService.getInstance().getCurrentUser())}
      />

      <CloudSessionsModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        currentAccountState={accountState}
        currentPropFirmState={propFirmState}
        currentSymbol={currentSymbol}
        currentTimeframe={timeframe}
        onLoadSession={handleLoadCloudSession}
      />

      <SocialShareModal
        isOpen={isSocialShareModalOpen}
        onClose={() => setIsSocialShareModalOpen(false)}
        account={accountState}
        propFirmState={propFirmState}
        symbol={currentSymbol}
      />

      <AffiliateModal
        isOpen={isAffiliateModalOpen}
        onClose={() => setIsAffiliateModalOpen(false)}
      />

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
};
