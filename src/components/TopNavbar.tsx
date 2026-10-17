import React, { useRef, useState } from 'react';
import { Timeframe } from '../types/candle';
import {
  BarChart2,
  RefreshCw,
  Upload,
  HelpCircle,
  ChevronDown,
  Cloud,
  Share2,
  Crown,
  Gift,
  MessageSquare,
  Globe,
  User,
  Menu,
  X,
} from 'lucide-react';
import { ASSET_SPECS, AssetSpec } from '../core/AssetSpecs';
import { UserProfile } from '../types/auth';
import { BillingEngine } from '../core/BillingEngine';
import { isSupabaseConfigured } from '../lib/supabase';

interface TopNavbarProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  currentTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  onCustomCsvUpload: (csvText: string, filename: string) => void;
  onResetSession: () => void;
  onOpenPerformance: () => void;
  onOpenHelp: () => void;
  onOpenCloudSessions: () => void;
  onOpenSocialShare: () => void;
  onOpenUpgrade: (planId?: string) => void;
  onOpenAffiliate: () => void;
  onOpenFeedback: () => void;
  onOpenAuth: () => void;
  onToggleLanding: () => void;
  currentUser: UserProfile | null;
  isLandingActive: boolean;
  isLoading: boolean;
}

const TIMEFRAMES: Timeframe[] = ['M1', 'M5', 'M15', 'H1', 'D1'];

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentSymbol,
  onSelectSymbol,
  currentTimeframe,
  onSelectTimeframe,
  onCustomCsvUpload,
  onResetSession,
  onOpenPerformance,
  onOpenHelp,
  onOpenCloudSessions,
  onOpenSocialShare,
  onOpenUpgrade,
  onOpenAffiliate,
  onOpenFeedback,
  onOpenAuth,
  onToggleLanding,
  currentUser,
  isLandingActive,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [symbolFilter, setSymbolFilter] = useState('');

  const billingEngine = BillingEngine.getInstance();
  const tier = currentUser?.tier || 'free';
  const passExpiresAt = currentUser?.passExpiresAt;

  const isPro =
    tier === 'pro_monthly' ||
    tier === 'pro_yearly' ||
    tier === 'lifetime' ||
    ((tier === 'day_pass' || tier === 'week_pass') && Boolean(passExpiresAt && passExpiresAt > Date.now()));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onCustomCsvUpload(content, file.name);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTimeframeClick = (tf: Timeframe) => {
    if ((tf === 'M1' || tf === 'M5') && !billingEngine.canAccessFeature(tier, 'timeframe_m1', passExpiresAt)) {
      onOpenUpgrade('day_pass');
      return;
    }
    onSelectTimeframe(tf);
  };

  const handleSymbolSelect = (sym: string) => {
    if (sym !== 'XAUUSD' && !billingEngine.canAccessFeature(tier, 'multi_asset', passExpiresAt)) {
      onOpenUpgrade('pro_monthly');
      setIsSymbolDropdownOpen(false);
      return;
    }
    onSelectSymbol(sym);
    setIsSymbolDropdownOpen(false);
  };

  const currentSpec: AssetSpec = ASSET_SPECS[currentSymbol] || ASSET_SPECS.XAUUSD;

  const filteredSymbols = Object.values(ASSET_SPECS).filter((s) =>
    s.symbol.toLowerCase().includes(symbolFilter.toLowerCase()) ||
    s.name.toLowerCase().includes(symbolFilter.toLowerCase())
  );

  return (
    <header className="h-12 border-b border-tv-border bg-tv-surface px-3 flex items-center justify-between z-30 select-none text-tv-text relative">
      {/* Left: Brand, Symbol Dropdown & Timeframes */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Brand & Landing Toggle */}
        <button
          onClick={onToggleLanding}
          title="Toggle Home / Landing Page"
          className="flex items-center gap-2 group text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-black text-xs shadow-md group-hover:scale-105 transition-transform">
            MB
          </div>
          <span className="font-extrabold text-sm tracking-wide text-white hidden md:inline">
            MeBacktest
          </span>
        </button>

        <div className="h-4 w-px bg-tv-border mx-0.5 hidden sm:block" />

        {/* Symbol Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsSymbolDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-tv-bg hover:bg-tv-border border border-tv-border text-xs font-bold text-white transition-colors"
          >
            <span>{currentSpec.icon}</span>
            <span>{currentSpec.symbol}</span>
            <ChevronDown size={13} className="text-tv-muted" />
          </button>

          {isSymbolDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                onClick={() => setIsSymbolDropdownOpen(false)}
              />
              <div className="absolute top-10 left-0 w-64 bg-[#0d111a] border border-tv-border rounded-2xl shadow-2xl p-2 z-50 animate-fade-in">
                <input
                  type="text"
                  value={symbolFilter}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                  placeholder="Search symbol..."
                  className="w-full bg-tv-bg border border-tv-border focus:border-amber-400 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-tv-muted focus:outline-none mb-1.5"
                  autoFocus
                />

                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredSymbols.map((spec) => {
                    const isLocked = spec.symbol !== 'XAUUSD' && !isPro;
                    return (
                      <button
                        key={spec.symbol}
                        onClick={() => handleSymbolSelect(spec.symbol)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors text-left ${
                          currentSymbol === spec.symbol
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'hover:bg-tv-surface text-tv-text hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{spec.icon}</span>
                          <div>
                            <span className="font-bold block">{spec.symbol}</span>
                            <span className="text-[10px] text-tv-muted block">{spec.name}</span>
                          </div>
                        </div>

                        {isLocked ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold uppercase border border-amber-500/20 flex items-center gap-0.5">
                            <Crown size={9} /> Pro
                          </span>
                        ) : (
                          <span className="text-[10px] text-tv-muted font-mono">{spec.category}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Timeframe Pills */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-tv-bg p-0.5 rounded-lg border border-tv-border">
          {TIMEFRAMES.map((tf) => {
            const isTfLocked = (tf === 'M1' || tf === 'M5') && !isPro;
            return (
              <button
                key={tf}
                onClick={() => handleTimeframeClick(tf)}
                disabled={isLoading}
                title={isTfLocked ? `${tf} requires Pro tier` : `Switch to ${tf}`}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[11px] sm:text-xs font-semibold transition-all relative ${
                  currentTimeframe === tf
                    ? 'bg-tv-blue text-white shadow-sm'
                    : 'text-tv-muted hover:text-tv-text'
                }`}
              >
                {tf}
                {isTfLocked && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>

        {isLoading && (
          <span className="text-xs text-amber-400 animate-pulse flex items-center gap-1 hidden md:flex">
            <RefreshCw size={12} className="animate-spin" />
            Loading...
          </span>
        )}
      </div>

      {/* Right: SaaS Features & Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Hidden Custom CSV Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Desktop-only: Home / Terminal Toggle */}
        <button
          onClick={onToggleLanding}
          title={isLandingActive ? 'Back to Trading Terminal' : 'View Commercial Landing Page'}
          className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-tv-bg hover:bg-tv-border border border-tv-border text-xs font-medium text-tv-muted hover:text-white transition-colors"
        >
          <Globe size={13} />
          <span>{isLandingActive ? 'Terminal' : 'Home'}</span>
        </button>

        {/* Desktop-only: Cloud Sessions */}
        <button
          onClick={onOpenCloudSessions}
          title="Manage & Share Cloud Sessions"
          className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-tv-bg hover:bg-tv-border border border-tv-border text-xs font-medium text-tv-text hover:text-white transition-colors"
        >
          <Cloud size={13} className="text-tv-blue" />
          <span>Cloud</span>
        </button>

        {/* Desktop-only: Share P&L Card */}
        <button
          onClick={onOpenSocialShare}
          title="Export high-fidelity P&L card for social media"
          className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-tv-bg hover:bg-tv-border border border-tv-border text-xs font-medium text-tv-text hover:text-white transition-colors"
        >
          <Share2 size={13} className="text-emerald-400" />
          <span className="hidden xl:inline">Share P&L</span>
        </button>

        {/* Desktop-only: Journal Stats */}
        <button
          onClick={onOpenPerformance}
          title="Strategy Breakdown & Performance Journal"
          className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-tv-bg hover:bg-tv-border border border-tv-border text-xs font-medium text-tv-text hover:text-white transition-colors"
        >
          <BarChart2 size={13} className="text-tv-blue" />
          <span>Journal</span>
        </button>

        {/* Desktop-only: Affiliate 30% Perk */}
        <button
          onClick={onOpenAffiliate}
          title="30% RevShare Partner Program"
          className="hidden xl:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors"
        >
          <Gift size={13} />
          <span>30% Affiliate</span>
        </button>

        {/* Upgrade Pro or Pro Badge (Always visible on all screens) */}
        {!isPro ? (
          <button
            onClick={() => onOpenUpgrade('pro_monthly')}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black text-[11px] sm:text-xs font-extrabold shadow-md transition-all active:scale-95 animate-pulse"
          >
            <Crown size={12} className="fill-black" />
            <span className="hidden xs:inline sm:inline">Upgrade Pro</span>
            <span className="xs:hidden sm:hidden">PRO</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-extrabold">
            <Crown size={12} className="fill-amber-300" />
            <span>PRO</span>
          </div>
        )}

        {/* Desktop-only: Upload Custom CSV */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Upload your own MT5 or TradingView CSV file"
          className="p-1.5 text-tv-muted hover:text-white hover:bg-tv-border/50 rounded-lg transition-colors hidden lg:block"
        >
          <Upload size={14} />
        </button>

        {/* Desktop-only: Reset Session */}
        <button
          onClick={onResetSession}
          title="Reset account balance and positions"
          className="p-1.5 text-tv-muted hover:text-white hover:bg-tv-border/50 rounded-lg transition-colors hidden lg:block"
        >
          <RefreshCw size={14} />
        </button>

        {/* Desktop-only: Feedback Widget */}
        <button
          onClick={onOpenFeedback}
          title="Submit Feedback & Bug Reports"
          className="p-1.5 text-tv-muted hover:text-white hover:bg-tv-border/50 rounded-lg transition-colors hidden lg:block"
        >
          <MessageSquare size={14} />
        </button>

        {/* Desktop-only: Help Shortcuts */}
        <button
          onClick={onOpenHelp}
          title="Help & Shortcuts"
          className="p-1.5 text-tv-muted hover:text-white hover:bg-tv-border/50 rounded-lg transition-colors hidden lg:block"
        >
          <HelpCircle size={15} />
        </button>

        {/* User Profile / Auth Trigger */}
        <button
          onClick={onOpenAuth}
          title={currentUser ? `Logged in as ${currentUser.displayName}` : 'Sign In'}
          className="relative w-7 h-7 rounded-full bg-tv-bg hover:bg-tv-border border border-tv-border flex items-center justify-center text-xs font-bold text-white transition-colors ml-0.5"
        >
          {currentUser ? (
            currentUser.displayName.charAt(0).toUpperCase()
          ) : (
            <User size={13} className="text-tv-muted" />
          )}
          {isSupabaseConfigured && (
            <span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0d111a]"
              title="Supabase Cloud Live"
            />
          )}
        </button>

        {/* Mobile Hamburger Menu Toggle (< lg) */}
        <button
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="lg:hidden p-1.5 text-tv-text hover:text-white hover:bg-tv-border/50 rounded-lg transition-colors border border-tv-border ml-0.5"
          title="Open Menu"
        >
          {isMobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="lg:hidden absolute top-12 right-2 w-72 bg-[#0c1017] border border-tv-border rounded-2xl shadow-2xl p-3 z-50 flex flex-col gap-1.5 animate-fade-in backdrop-blur-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-1">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Features & Tools</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-tv-muted hover:text-white p-1"
            >
              <X size={14} />
            </button>
          </div>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenCloudSessions();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left hover:bg-white/5 transition-colors text-white"
          >
            <Cloud size={16} className="text-tv-blue" />
            <div className="flex flex-col">
              <span className="font-semibold">Cloud Sessions</span>
              <span className="text-[10px] text-tv-muted">Save & share replay links</span>
            </div>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenSocialShare();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left hover:bg-white/5 transition-colors text-white"
          >
            <Share2 size={16} className="text-emerald-400" />
            <div className="flex flex-col">
              <span className="font-semibold">Share P&L Card</span>
              <span className="text-[10px] text-tv-muted">Instagram & Twitter stats</span>
            </div>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenPerformance();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left hover:bg-white/5 transition-colors text-white"
          >
            <BarChart2 size={16} className="text-tv-blue" />
            <div className="flex flex-col">
              <span className="font-semibold">Strategy Journal</span>
              <span className="text-[10px] text-tv-muted">Win rate & equity curves</span>
            </div>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenAffiliate();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left hover:bg-white/5 transition-colors text-amber-300"
          >
            <Gift size={16} className="text-amber-400" />
            <div className="flex flex-col">
              <span className="font-semibold">30% Affiliate Program</span>
              <span className="text-[10px] text-amber-400/80">Earn recurring revenue</span>
            </div>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left hover:bg-white/5 transition-colors text-white"
          >
            <Upload size={16} className="text-purple-400" />
            <div className="flex flex-col">
              <span className="font-semibold">Upload Custom CSV</span>
              <span className="text-[10px] text-tv-muted">Load MT5 / TV bar data</span>
            </div>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onResetSession();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left hover:bg-white/5 transition-colors text-white"
          >
            <RefreshCw size={16} className="text-red-400" />
            <div className="flex flex-col">
              <span className="font-semibold">Reset Session</span>
              <span className="text-[10px] text-tv-muted">Clear balance & trade history</span>
            </div>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenFeedback();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left hover:bg-white/5 transition-colors text-white"
          >
            <MessageSquare size={16} className="text-yellow-400" />
            <div className="flex flex-col">
              <span className="font-semibold">Feedback & Bug Report</span>
              <span className="text-[10px] text-tv-muted">Direct suggestions</span>
            </div>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenHelp();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left hover:bg-white/5 transition-colors text-white"
          >
            <HelpCircle size={16} className="text-tv-muted" />
            <div className="flex flex-col">
              <span className="font-semibold">Help & Shortcuts</span>
              <span className="text-[10px] text-tv-muted">Hotkeys guide</span>
            </div>
          </button>

          <div className="border-t border-white/10 pt-1.5 mt-1">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onToggleLanding();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              <Globe size={14} />
              <span>{isLandingActive ? 'Back to Terminal' : 'View Landing Page'}</span>
            </button>
          </div>
        </div>
      </>
      )}
    </header>
  );
};
