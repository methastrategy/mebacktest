import React from 'react';
import {
  Play,
  Zap,
  Shield,
  BarChart2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Sliders,
  QrCode,
  Layers,
} from 'lucide-react';

interface LandingPageProps {
  onLaunchTerminal: () => void;
  onOpenUpgrade: (planId?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchTerminal,
  onOpenUpgrade,
}) => {

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Floating Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#07090e]/80 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-black text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            MB
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              MeBacktest
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase font-mono">
                PRO TERMINAL
              </span>
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
          <a href="#features" className="hover:text-amber-400 transition-colors">
            Core Features
          </a>
          <a href="#comparison" className="hover:text-amber-400 transition-colors">
            Comparison Matrix
          </a>
          <a href="#pricing" className="hover:text-amber-400 transition-colors">
            Pricing & Passes
          </a>
          <a href="#propfirm" className="hover:text-amber-400 transition-colors">
            Prop Firm HUD
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLaunchTerminal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Play size={13} className="fill-black" />
            <span>Launch Terminal</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
        {/* Glow ambient circle */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[140px] pointer-events-none rounded-full" />

        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide uppercase mb-6 shadow-sm">
          <Sparkles size={13} />
          <span>Institutional Price Action Replay Terminal</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.08] max-w-4xl">
          Master The Markets{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
            Before Risking
          </span>{' '}
          Real Capital.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          The blistering speed of TradingView Lightweight Charts at <strong>60 FPS</strong>. The
          strict drawdown rules of <strong>FTMO</strong>. The granular edge analytics of{' '}
          <strong>TradeZella</strong>. Built specifically for Gold & Forex Price Action traders.
        </p>

        {/* Action Buttons */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onLaunchTerminal}
            className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all active:scale-95 flex items-center gap-2"
          >
            <Play size={16} className="fill-black" />
            <span>Launch Free Terminal</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => onOpenUpgrade('pro_monthly')}
            className="px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-sm transition-all"
          >
            Upgrade to Pro Trader
          </button>
        </div>

        {/* Social Proof Stats */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 w-full max-w-3xl pt-8 border-t border-white/10">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">100,000+</div>
            <div className="text-xs text-slate-400 mt-1">M1 Historical Bars</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">60 FPS</div>
            <div className="text-xs text-slate-400 mt-1">Zero Lag Rendering</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">100%</div>
            <div className="text-xs text-slate-400 mt-1">FTMO Rules Matched</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">฿99</div>
            <div className="text-xs text-slate-400 mt-1">PromptPay Day Pass</div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            ENGINEERED FOR SERIOUS TRADERS
          </h2>
          <p className="text-3xl font-black text-white mt-2">
            Everything You Need To Build A Systematic Edge
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">60 FPS M1 Replay Engine</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Stream through 100,000 M1 candles with O(1) incremental rendering. Step forward bar
                by bar, scrub at 10x speed, or run blind drill scenarios.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-semibold text-amber-400">
              No more waiting for TradingView replay lag
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">FTMO & Prop Firm HUD</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Live High-Watermark tracking, 5.0% Daily Drawdown barrier, 10.0% Max Drawdown guard,
                and 8.0% Profit Target evaluator with instant breach alert.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-semibold text-emerald-400">
              Pass your challenge before paying test fees
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <BarChart2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Setup Model Tagging & Journal</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Tag trades with Liquidity Sweep, Fair Value Gap, or Break of Structure. Instantly
                isolate your highest win-rate setup in the Strategy Breakdown modal.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-semibold text-blue-400">
              TradeZella-grade analytical granularity
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Sliders size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Canvas Drawing & Key Levels</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Full left-side drawing toolbar: draw Horizontal Rays, Supply Zones (Red boxes), and
                Demand Zones (Emerald boxes) directly onto the price action.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-semibold text-purple-400">
              High-DPI canvas geometry retention
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                <Layers size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Asset Data Lake</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Switch seamlessly between Gold (XAUUSD), Forex (EURUSD, GBPUSD, USDJPY), Crypto
                (BTCUSD, ETHUSD), and US Indices (US100, US30) with IndexedDB hot cache.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-semibold text-cyan-400">
              Instant symbol switching with zero download wait
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <QrCode size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">PromptPay & Global Stripe</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Thai traders can top up with PromptPay QR from ฿99. Global traders enjoy secure
                Stripe credit card subscriptions with zero hidden fees.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-semibold text-amber-400">
              Instant activation within 2 seconds
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Matrix Table */}
      <section id="comparison" className="py-20 px-6 max-w-6xl mx-auto border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            COMPETITIVE ADVANTAGE
          </h2>
          <p className="text-3xl font-black text-white mt-2">
            Why Top Prop Traders Choose MeBacktest
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                <th className="p-4 font-bold text-slate-400">Capability</th>
                <th className="p-4 font-black text-amber-400 text-sm">MeBacktest</th>
                <th className="p-4 font-semibold text-slate-400">TradingView</th>
                <th className="p-4 font-semibold text-slate-400">FX Replay</th>
                <th className="p-4 font-semibold text-slate-400">TradeZella</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <tr>
                <td className="p-4 font-medium text-white">60 FPS M1 Replay Speed</td>
                <td className="p-4 font-bold text-emerald-400">✅ Instant O(1)</td>
                <td className="p-4 text-slate-400">⚠️ Laggy on M1</td>
                <td className="p-4 text-slate-400">⚠️ Web Latency</td>
                <td className="p-4 text-slate-500">❌ No Replay</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">FTMO Rules HUD & Drawdown Guard</td>
                <td className="p-4 font-bold text-emerald-400">✅ Built-in Realtime</td>
                <td className="p-4 text-slate-500">❌ None</td>
                <td className="p-4 text-slate-400">⚠️ Basic</td>
                <td className="p-4 text-slate-500">❌ Post-trade only</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Realistic Spread Simulation</td>
                <td className="p-4 font-bold text-emerald-400">✅ Bid/Ask Pips</td>
                <td className="p-4 text-slate-500">❌ Mid-price only</td>
                <td className="p-4 text-slate-400">✅ Supported</td>
                <td className="p-4 text-slate-500">❌ N/A</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Break-Even & Partial Close (50%)</td>
                <td className="p-4 font-bold text-emerald-400">✅ One-Click Guard</td>
                <td className="p-4 text-slate-500">❌ Clunky</td>
                <td className="p-4 text-slate-400">⚠️ Limited</td>
                <td className="p-4 text-slate-500">❌ N/A</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Thai PromptPay QR Top-Up</td>
                <td className="p-4 font-bold text-emerald-400">✅ From ฿99</td>
                <td className="p-4 text-slate-500">❌ Credit Card only</td>
                <td className="p-4 text-slate-500">❌ $35/mo minimum</td>
                <td className="p-4 text-slate-500">❌ $29/mo minimum</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Strategy Breakdown Setup Tagging</td>
                <td className="p-4 font-bold text-emerald-400">✅ Instant Analytics</td>
                <td className="p-4 text-slate-500">❌ None</td>
                <td className="p-4 text-slate-400">⚠️ Manual tag</td>
                <td className="p-4 text-emerald-400">✅ Advanced</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-6xl mx-auto border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            TRANSPARENT PRICING
          </h2>
          <p className="text-3xl font-black text-white mt-2">
            Affordable Plans For Every Stage of Your Trading
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Day Pass */}
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Day Pass</h3>
              <p className="text-xs text-slate-400 mt-1">24-hour full access</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">฿99</span>
                <span className="text-xs text-slate-400">/ 24 hrs</span>
              </div>
              <ul className="mt-6 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  Full M1 60 FPS Replay
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  FTMO Challenge HUD
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  PromptPay Instant Unlock
                </li>
              </ul>
            </div>
            <button
              onClick={() => onOpenUpgrade('day_pass')}
              className="mt-6 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
            >
              Get Day Pass
            </button>
          </div>

          {/* Week Pass */}
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Week Pass</h3>
              <p className="text-xs text-slate-400 mt-1">7 days intensive training</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">฿199</span>
                <span className="text-xs text-slate-400">/ 7 days</span>
              </div>
              <ul className="mt-6 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  Everything in Day Pass
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  Multi-Asset Support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  Cloud Session Sync
                </li>
              </ul>
            </div>
            <button
              onClick={() => onOpenUpgrade('week_pass')}
              className="mt-6 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
            >
              Get Week Pass
            </button>
          </div>

          {/* Pro Monthly (Highlight) */}
          <div className="relative p-6 rounded-3xl bg-amber-500/10 border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex flex-col justify-between">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] uppercase tracking-wider">
              MOST POPULAR
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Pro Monthly</h3>
              <p className="text-xs text-amber-300/80 mt-1">For active challenge hunters</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-amber-400">฿490</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <ul className="mt-6 space-y-2 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-amber-400" />
                  Unlimited M1 & M5 Replay
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-amber-400" />
                  FTMO Challenge Engine
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-amber-400" />
                  Full Multi-Asset Data Lake
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-amber-400" />
                  Zero Watermark & Priority CDN
                </li>
              </ul>
            </div>
            <button
              onClick={() => onOpenUpgrade('pro_monthly')}
              className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black font-extrabold text-xs shadow-md transition-all active:scale-95"
            >
              Subscribe Pro Monthly
            </button>
          </div>

          {/* Pro Yearly */}
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Pro Annual</h3>
              <p className="text-xs text-slate-400 mt-1">Save 24% (2 months free)</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">฿4,500</span>
                <span className="text-xs text-slate-400">/ year</span>
              </div>
              <ul className="mt-6 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  Everything in Pro Monthly
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  VIP Trader Discord Role
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  1-on-1 Review Session Sharing
                </li>
              </ul>
            </div>
            <button
              onClick={() => onOpenUpgrade('pro_yearly')}
              className="mt-6 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
            >
              Subscribe Annual
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center font-black text-black text-[10px]">
              MB
            </div>
            <span className="font-bold text-slate-400">MeBacktest SaaS Commercial Edition</span>
          </div>

          <p className="text-slate-500">
            Engineered by เมธา ตรีประพันธ์กิจ (Survey Engineering, KU) • All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={onLaunchTerminal} className="hover:text-white transition-colors">
              Replay Terminal
            </button>
            <button onClick={() => onOpenUpgrade()} className="hover:text-white transition-colors">
              Pricing
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
