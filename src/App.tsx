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
import { Eye, LogOut, Activity, Zap, Layers, ShieldCheck, Sparkles, X, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react';

export const App: React.FC = () => {
  const [currentSymbol, setCurrentSymbol] = useState<string>('XAUUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>('M15');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(500);
  const [isBlindMode, setIsBlindMode] = useState<boolean>(false);
  const [clickedChartPrice, setClickedChartPrice] = useState<number | undefined>();
  const [spreadPips, setSpreadPips] = useState<number>(25);

  // Mobile Tab Navigation ('chart' | 'trade' | 'positions' | 'account')
  const [mobileTab, setMobileTab] = useState<'chart' | 'trade' | 'positions' | 'account'>('chart');

  // Mobile In-Chart Quick Trade Sheet state
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState<boolean>(false);
  const [quickVolume, setQuickVolume] = useState<number>(0.1);
  const [quickSlPips, setQuickSlPips] = useState<number | undefined>(20);
  const [quickTpPips, setQuickTpPips] = useState<number | undefined>(40);

  // Instant Feedback Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  }, []);

  // Dismissible First-Time User Onboarding Guide
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mebacktest_guide_dismissed') !== 'true';
    }
    return false;
  });

  // Prop Firm Mode State
  const [isPropModeEnabled, setIsPropModeEnabled] = useState<boolean>(false);

  // Commercial Landing Page Toggle (Default to Landing Page if unauthenticated)
  const [isLandingActive, setIsLandingActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('session') || params.get('share')) {
        return false; // Direct to shared session inspector
      }
    }
    const user = AuthService.getInstance().getCurrentUser();
    return !user || user.id === 'guest_trader_01' || user.id.startsWith('guest_');
  });

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
  const isRestoringSessionRef = useRef<boolean>(false);
  const prevSymbolRef = useRef<string>('XAUUSD');
  const isFirstMountRef = useRef<boolean>(true);

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
        if (!isRestoringSessionRef.current) {
          setAccountState(tradingEngineRef.current.getState());
        }
      }
      isRestoringSessionRef.current = false;
    } catch (err) {
      console.error('Error loading dataset:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial Mount & URL Query Check (?share=slug)
  useEffect(() => {
    isFirstMountRef.current = false;
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const shareParam = params?.get('share');
    const initSession = async () => {
      if (shareParam) {
        const sess = await CloudSessionService.getInstance().fetchRemoteSessionBySlug(shareParam);
        if (sess) {
          isRestoringSessionRef.current = true;
          setIsReadOnlySession(true);
          setSharedSessionTitle(sess.title);
          tradingEngineRef.current.restoreState(sess.accountState, sess.symbol);
          propFirmEngineRef.current.restoreState(sess.propFirmState);
          setAccountState(sess.accountState);
          setPropFirmState(sess.propFirmState);
          setCurrentSymbol(sess.symbol);
          setTimeframe(sess.timeframe);
          prevSymbolRef.current = sess.symbol;
          loadDataset(sess.symbol, sess.timeframe);
          return;
        }
      }

      const spec = getAssetSpec(currentSymbol);
      setSpreadPips(spec.defaultSpread);
      loadDataset(currentSymbol, timeframe);
    };

    initSession();
  }, []); // Run on mount only

  // Symbol Change Handler (does NOT trigger on timeframe change)
  useEffect(() => {
    if (isFirstMountRef.current) return;
    if (prevSymbolRef.current === currentSymbol) return;
    prevSymbolRef.current = currentSymbol;

    const spec = getAssetSpec(currentSymbol);
    setSpreadPips(spec.defaultSpread);
    if (!isRestoringSessionRef.current) {
      tradingEngineRef.current.reset(propFirmState.initialBalance, spec.defaultSpread, currentSymbol);
      propFirmEngineRef.current.reset(propFirmState.initialBalance);
    }
    loadDataset(currentSymbol, timeframe);
  }, [currentSymbol, loadDataset, propFirmState.initialBalance, timeframe]);

  // Timeframe Change Handler (loads new candles WITHOUT resetting account)
  useEffect(() => {
    if (isFirstMountRef.current) return;
    loadDataset(currentSymbol, timeframe);
  }, [timeframe, currentSymbol, loadDataset]);

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
      const digits = getAssetSpec(currentSymbol).digits;
      showToast(`✅ ${params.type} ${params.volume}L @ ${currentBar.close.toFixed(digits)} เปิดสำเร็จ`);
    },
    [currentBar, cursorIndex, spreadPips, isReadOnlySession, currentSymbol, showToast]
  );

  // Close position manually
  const handleClosePosition = useCallback(
    (id: string) => {
      if (!currentBar || isReadOnlySession) return;
      tradingEngineRef.current.closePosition(id, currentBar.close, currentBar.time, 'MANUAL');
      const acc = tradingEngineRef.current.getState();
      setAccountState(acc);
      setPropFirmState(propFirmEngineRef.current.updateEquity(acc.equity, acc.balance, currentBar.time));
      showToast('ปิดออเดอร์เรียบร้อย');
    },
    [currentBar, isReadOnlySession, showToast]
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
      showToast('เลื่อน Stop Loss มาที่ทุน (Break-Even) แล้ว');
    },
    [currentBar, isReadOnlySession, showToast]
  );

  // Partially close position
  const handlePartialClose = useCallback(
    (id: string, ratio: number = 0.5) => {
      if (!currentBar || isReadOnlySession) return;
      tradingEngineRef.current.partialClosePosition(id, ratio, currentBar.close, currentBar.time);
      const acc = tradingEngineRef.current.getState();
      setAccountState(acc);
      setPropFirmState(propFirmEngineRef.current.updateEquity(acc.equity, acc.balance, currentBar.time));
      showToast('แบ่งปิดทำกำไร 50% เรียบร้อย');
    },
    [currentBar, isReadOnlySession, showToast]
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
  const handleLoadCloudSession = useCallback(
    (sess: CloudSessionRecord) => {
      isRestoringSessionRef.current = true;
      prevSymbolRef.current = sess.symbol;
      tradingEngineRef.current.restoreState(sess.accountState, sess.symbol);
      propFirmEngineRef.current.restoreState(sess.propFirmState);
      setAccountState(sess.accountState);
      setPropFirmState(sess.propFirmState);
      setCurrentSymbol(sess.symbol);
      setTimeframe(sess.timeframe);
      setIsReadOnlySession(false);
      loadDataset(sess.symbol, sess.timeframe);
    },
    [loadDataset]
  );

  // Auto-detect and load shared replay session from URL (?session=:slug or ?share=:slug)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('session') || params.get('share');
    if (slug) {
      CloudSessionService.getInstance().fetchRemoteSessionBySlug(slug).then((remoteSess) => {
        if (remoteSess) {
          handleLoadCloudSession(remoteSess);
          setIsReadOnlySession(true);
          setSharedSessionTitle(remoteSess.title);
          setIsLandingActive(false);
          showToast(`🔍 กำลังดูเซสชันที่แชร์: ${remoteSess.title}`);
        }
      });
    }
  }, [handleLoadCloudSession, showToast]);

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
      <>
        <LandingPage
          onLaunchTerminal={() => {
            if (!currentUser || currentUser.id === 'guest_trader_01' || currentUser.id.startsWith('guest_')) {
              setIsAuthModalOpen(true);
            } else {
              setIsLandingActive(false);
            }
          }}
          onOpenUpgrade={(planId) => {
            setUpgradePlanInit(planId || 'pro_monthly');
            setIsUpgradeModalOpen(true);
          }}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onUserChanged={(u) => {
            setCurrentUser(u);
            if (u && !u.id.startsWith('guest_')) {
              setIsLandingActive(false);
              showToast(`🎉 ยินดีต้อนรับ ${u.displayName}! คุณได้รับสิทธิ์ Pro Trial ฟรี 7 วัน`);
            }
          }}
        />
      </>
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

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-[#0f1422]/95 border border-amber-500/50 text-amber-200 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none animate-fade-in max-w-[90vw]">
          <Sparkles size={14} className="text-amber-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
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

      {/* First-Time User Quick Onboarding Banner */}
      {showOnboarding && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/30 px-3 py-1.5 flex items-center justify-between text-xs text-slate-200 z-30 shrink-0 select-none">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
            <Sparkles size={14} className="text-amber-400 shrink-0" />
            <span className="truncate">
              <strong>ยินดีต้อนรับสู่ MeBacktest!</strong> กด <strong>Step Bar</strong> (หรือ Spacebar) เพื่อเลื่อนแท่งเทียน • กด <strong>Trade</strong> เพื่อเปิดออเดอร์ • เปิด <strong>Prop Mode</strong> เพื่อฝึกสอบ FTMO
            </span>
          </div>
          <button
            onClick={() => {
              setShowOnboarding(false);
              localStorage.setItem('mebacktest_guide_dismissed', 'true');
            }}
            className="text-slate-400 hover:text-white ml-2 shrink-0 px-2 py-0.5 rounded-lg hover:bg-white/10 text-[11px] flex items-center gap-1 transition-colors"
          >
            <span>เข้าใจแล้ว</span>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Main Trading Workstation */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center Area: Candlestick Chart */}
        <div
          className={`flex-1 relative flex-col h-full overflow-hidden ${
            mobileTab === 'chart' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Subtle Free Tier Watermark */}
          {!isPro && (
            <ChartWatermark
              onUpgradeClick={() => {
                setUpgradePlanInit('day_pass');
                setIsUpgradeModalOpen(true);
              }}
            />
          )}

          {/* Prop Firm Challenge HUD Ribbon (Top Center on Desktop - Never overlaps Chart Controls!) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[95vw]">
            <PropFirmHUD
              isEnabled={isPropModeEnabled}
              onToggleEnabled={() => setIsPropModeEnabled((prev) => !prev)}
              state={propFirmState}
              onSelectAccountSize={handleSelectAccountSize}
              onResetChallenge={handleResetChallenge}
            />
          </div>

          {/* Mobile Floating Floating P/L Pill (< lg) */}
          {accountState.openPositions.length > 0 && (
            <button
              onClick={() => setMobileTab('positions')}
              className={`lg:hidden absolute top-14 left-3 z-20 px-2.5 py-1.5 rounded-full border shadow-xl flex items-center gap-1.5 text-xs font-mono font-bold backdrop-blur-md active:scale-95 transition-transform ${
                accountState.unrealizedPnL >= 0
                  ? 'bg-emerald-950/85 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/85 border-rose-500/50 text-rose-300'
              }`}
              title="View Open Positions"
            >
              <span>{accountState.unrealizedPnL >= 0 ? `+$${accountState.unrealizedPnL.toFixed(2)}` : `-$${Math.abs(accountState.unrealizedPnL).toFixed(2)}`}</span>
              <span className="text-[10px] px-1 py-0.2 bg-black/40 rounded-full">({accountState.openPositions.length})</span>
            </button>
          )}

          {/* Quick Trade Floating Button on Mobile Chart (< lg) */}
          <button
            onClick={() => setIsQuickTradeOpen((prev) => !prev)}
            className="lg:hidden absolute top-14 right-3 z-20 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-xs shadow-xl flex items-center gap-1.5 active:scale-95 transition-transform"
            title="Open In-Chart Quick Trade Bar"
          >
            <Zap size={13} className="fill-black" />
            <span>⚡ Trade</span>
          </button>

          {/* Mobile In-Chart Quick Order Execution Sheet */}
          {isQuickTradeOpen && (() => {
            const spec = getAssetSpec(currentSymbol);
            const pipValue = 1 / spec.pipScale;
            const halfSpread = (spreadPips * pipValue) / 2;
            const bid = currentBar ? currentBar.close - halfSpread : 0;
            const ask = currentBar ? currentBar.close + halfSpread : 0;

            return (
              <>
                <div
                  className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs lg:hidden"
                  onClick={() => setIsQuickTradeOpen(false)}
                />
                <div className="lg:hidden absolute top-24 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-sm bg-[#0c1017]/95 border border-tv-border rounded-2xl shadow-2xl p-3.5 backdrop-blur-xl animate-fade-in flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Zap size={15} className="text-amber-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{currentSymbol} Quick Trade</span>
                      <span className="text-[10px] text-tv-muted font-mono">Spread: {spreadPips}p</span>
                    </div>
                    <button
                      onClick={() => setIsQuickTradeOpen(false)}
                      className="text-tv-muted hover:text-white p-1"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Volume Selector */}
                  <div className="flex items-center justify-between bg-tv-bg border border-tv-border rounded-xl p-1.5">
                    <span className="text-xs text-tv-muted font-semibold pl-1.5">Volume (Lots):</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setQuickVolume((v) => Math.max(0.01, +(v - 0.05).toFixed(2)))}
                        className="p-1 rounded-lg bg-tv-surface hover:bg-white/10 text-tv-text active:scale-90"
                      >
                        <Minus size={13} />
                      </button>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="50"
                        value={quickVolume}
                        onChange={(e) => setQuickVolume(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                        className="w-14 bg-transparent text-center font-mono font-bold text-xs text-amber-400 focus:outline-none"
                      />
                      <button
                        onClick={() => setQuickVolume((v) => Math.min(50, +(v + 0.05).toFixed(2)))}
                        className="p-1 rounded-lg bg-tv-surface hover:bg-white/10 text-tv-text active:scale-90"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Volume Quick Presets */}
                  <div className="grid grid-cols-5 gap-1">
                    {[0.01, 0.05, 0.1, 0.5, 1.0].map((lot) => (
                      <button
                        key={lot}
                        onClick={() => setQuickVolume(lot)}
                        className={`py-1 rounded-lg text-[10px] font-mono font-bold transition-colors ${
                          quickVolume === lot
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-tv-bg text-tv-muted hover:text-white'
                        }`}
                      >
                        {lot}L
                      </button>
                    ))}
                  </div>

                  {/* SL & TP Pips */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-tv-bg border border-tv-border rounded-xl p-1.5 flex flex-col gap-0.5">
                      <span className="text-[10px] text-rose-400 font-semibold">SL (Pips)</span>
                      <input
                        type="number"
                        placeholder="No SL"
                        value={quickSlPips ?? ''}
                        onChange={(e) => setQuickSlPips(e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value)))}
                        className="bg-transparent font-mono text-white text-xs focus:outline-none"
                      />
                    </div>
                    <div className="bg-tv-bg border border-tv-border rounded-xl p-1.5 flex flex-col gap-0.5">
                      <span className="text-[10px] text-emerald-400 font-semibold">TP (Pips)</span>
                      <input
                        type="number"
                        placeholder="No TP"
                        value={quickTpPips ?? ''}
                        onChange={(e) => setQuickTpPips(e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value)))}
                        className="bg-transparent font-mono text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Big Buy & Sell Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        if (!currentBar) return;
                        const sl = quickSlPips ? currentBar.close + (quickSlPips * pipValue) : undefined;
                        const tp = quickTpPips ? currentBar.close - (quickTpPips * pipValue) : undefined;
                        handlePlaceOrder({
                          type: 'SELL',
                          volume: quickVolume,
                          stopLoss: sl,
                          takeProfit: tp,
                        });
                        setIsQuickTradeOpen(false);
                      }}
                      disabled={isReadOnlySession || !currentBar}
                      className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg flex flex-col items-center justify-center active:scale-95 transition-all disabled:opacity-40"
                    >
                      <div className="flex items-center gap-1">
                        <TrendingDown size={14} />
                        <span>SELL</span>
                      </div>
                      <span className="font-mono text-[11px] font-normal opacity-90">
                        {currentBar ? bid.toFixed(spec.digits) : '---'}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        if (!currentBar) return;
                        const sl = quickSlPips ? currentBar.close - (quickSlPips * pipValue) : undefined;
                        const tp = quickTpPips ? currentBar.close + (quickTpPips * pipValue) : undefined;
                        handlePlaceOrder({
                          type: 'BUY',
                          volume: quickVolume,
                          stopLoss: sl,
                          takeProfit: tp,
                        });
                        setIsQuickTradeOpen(false);
                      }}
                      disabled={isReadOnlySession || !currentBar}
                      className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-extrabold text-xs shadow-lg flex flex-col items-center justify-center active:scale-95 transition-all disabled:opacity-40"
                    >
                      <div className="flex items-center gap-1">
                        <TrendingUp size={14} />
                        <span>BUY</span>
                      </div>
                      <span className="font-mono text-[11px] font-normal opacity-90">
                        {currentBar ? ask.toFixed(spec.digits) : '---'}
                      </span>
                    </button>
                  </div>

                  {/* Link to advanced trade panel */}
                  <button
                    onClick={() => {
                      setIsQuickTradeOpen(false);
                      setMobileTab('trade');
                    }}
                    className="text-[11px] text-tv-muted hover:text-amber-400 text-center transition-colors pt-0.5"
                  >
                    เปิดพาเนลคำนวณความเสี่ยงละเอียด (Risk Calculator) →
                  </button>
                </div>
              </>
            );
          })()}

          <TradingChart
            bars={visibleBars}
            currentBar={currentBar}
            positions={accountState.openPositions}
            closedPositions={accountState.closedPositions}
            isBlindMode={isBlindMode}
            onPriceClick={(price) => setClickedChartPrice(price)}
            symbol={currentSymbol}
          />

          {/* Floating Bottom Replay Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
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

        {/* Right Sidebar: Trade Execution & Positions (Responsive on Mobile) */}
        <div
          className={`border-l border-tv-border bg-tv-surface/40 flex-col p-3 gap-3 overflow-y-auto z-10 ${
            mobileTab !== 'chart' ? 'flex flex-1 w-full' : 'hidden lg:flex w-80 md:w-96'
          }`}
        >
          {/* On Mobile: Render tab-specific view; On Desktop: Render full stack */}
          {(mobileTab === 'trade' || mobileTab === 'account' || typeof window === 'undefined' || window.innerWidth >= 1024) && (
            <AccountSummary account={accountState} />
          )}

          {(mobileTab === 'trade' || typeof window === 'undefined' || window.innerWidth >= 1024) && (
            <OrderEntryPanel
              currentPrice={currentBar?.close || 0}
              onPlaceOrder={(params) => {
                handlePlaceOrder(params);
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setMobileTab('chart');
                }
              }}
              clickedPrice={clickedChartPrice}
              spreadPips={spreadPips}
              onChangeSpread={handleChangeSpread}
              symbol={currentSymbol}
              isReadOnly={isReadOnlySession}
            />
          )}

          {(mobileTab === 'positions' || typeof window === 'undefined' || window.innerWidth >= 1024) && (
            <PositionList
              positions={accountState.openPositions}
              onClosePosition={handleClosePosition}
              onBreakEven={handleMoveToBreakEven}
              onPartialClose={handlePartialClose}
            />
          )}

          {mobileTab === 'account' && (
            <div className="lg:hidden flex flex-col gap-3 mt-2">
              <div className="bg-tv-surface border border-tv-border rounded-xl p-3">
                <span className="text-xs font-bold text-white block mb-2">FTMO Prop Firm Mode</span>
                <PropFirmHUD
                  isEnabled={isPropModeEnabled}
                  onToggleEnabled={() => setIsPropModeEnabled((prev) => !prev)}
                  state={propFirmState}
                  onSelectAccountSize={handleSelectAccountSize}
                  onResetChallenge={handleResetChallenge}
                />
              </div>

              <button
                onClick={handleResetSession}
                className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition-colors"
              >
                Reset Balance & History
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (< lg) */}
      <nav className="lg:hidden h-14 bg-[#0a0d14] border-t border-tv-border flex items-center justify-around z-40 select-none px-2 shrink-0">
        <button
          onClick={() => setMobileTab('chart')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            mobileTab === 'chart' ? 'text-amber-400 font-bold' : 'text-tv-muted hover:text-white'
          }`}
        >
          <Activity size={18} />
          <span className="text-[10px] mt-0.5">Chart</span>
        </button>

        <button
          onClick={() => setMobileTab('trade')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            mobileTab === 'trade' ? 'text-amber-400 font-bold' : 'text-tv-muted hover:text-white'
          }`}
        >
          <Zap size={18} />
          <span className="text-[10px] mt-0.5">Trade</span>
        </button>

        <button
          onClick={() => setMobileTab('positions')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors relative ${
            mobileTab === 'positions' ? 'text-amber-400 font-bold' : 'text-tv-muted hover:text-white'
          }`}
        >
          <Layers size={18} />
          <span className="text-[10px] mt-0.5">Orders</span>
          {accountState.openPositions.length > 0 && (
            <span className="absolute top-1 right-5 w-4 h-4 rounded-full bg-amber-500 text-black font-extrabold text-[9px] flex items-center justify-center">
              {accountState.openPositions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setMobileTab('account')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            mobileTab === 'account' ? 'text-amber-400 font-bold' : 'text-tv-muted hover:text-white'
          }`}
        >
          <ShieldCheck size={18} />
          <span className="text-[10px] mt-0.5">Account</span>
        </button>
      </nav>

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
