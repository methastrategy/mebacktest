import React from 'react';
import { ShieldCheck, ShieldAlert, Target, Award, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { PropFirmState } from '../core/PropFirmEngine';

interface PropFirmHUDProps {
  isEnabled: boolean;
  onToggleEnabled: () => void;
  state: PropFirmState;
  onSelectAccountSize: (size: number) => void;
  onResetChallenge: () => void;
}

const ACCOUNT_SIZES = [10000, 25000, 50000, 100000, 200000];

export const PropFirmHUD: React.FC<PropFirmHUDProps> = ({
  isEnabled,
  onToggleEnabled,
  state,
  onSelectAccountSize,
  onResetChallenge,
}) => {
  if (!isEnabled) {
    return (
      <button
        onClick={onToggleEnabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 text-xs font-semibold shadow-md transition-all hover:scale-102"
        title="เปิดโหมดจำลองสอบกองทุน FTMO (Daily Loss 5%, Max Loss 10%)"
      >
        <ShieldCheck size={14} className="text-indigo-400" />
        <span>เปิดโหมดสอบกองทุน (Prop Mode)</span>
      </button>
    );
  }

  const dailyProgress = Math.min(100, (state.dailyLossAmount / state.dailyLossLimitAmount) * 100);
  const totalProgress = Math.min(100, (state.totalLossAmount / state.totalLossLimitAmount) * 100);
  const profitProgress = Math.min(
    100,
    Math.max(0, (state.profitAmount / state.profitTargetAmount) * 100)
  );

  const isBreached = state.status === 'BREACHED_DAILY' || state.status === 'BREACHED_TOTAL';
  const isPassed = state.status === 'PASSED';

  return (
    <div className="relative bg-tv-surface/95 backdrop-blur-md border border-tv-border px-4 py-2.5 rounded-xl shadow-2xl flex flex-wrap items-center gap-4 text-xs select-none z-30">
      {/* Title & Account Size */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={16} className="text-indigo-400" />
          <span className="font-bold text-white tracking-wide">FTMO SIMULATOR</span>
        </div>

        <select
          value={state.initialBalance}
          onChange={(e) => onSelectAccountSize(Number(e.target.value))}
          className="bg-tv-bg border border-tv-border rounded-md px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
        >
          {ACCOUNT_SIZES.map((size) => (
            <option key={size} value={size}>
              ${(size / 1000).toFixed(0)}k Account
            </option>
          ))}
        </select>
      </div>

      <div className="h-4 w-px bg-tv-border hidden sm:block" />

      {/* Metric 1: Profit Target */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-tv-muted flex items-center gap-1">
            <Target size={11} className="text-emerald-400" />
            Profit Target
          </span>
          <span className={`font-mono font-bold ${state.profitAmount >= 0 ? 'text-emerald-400' : 'text-tv-muted'}`}>
            ${state.profitAmount.toFixed(0)} / ${state.profitTargetAmount.toFixed(0)}
          </span>
        </div>
        <div className="w-full bg-tv-bg h-1.5 rounded-full overflow-hidden border border-white/5">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${profitProgress}%` }}
          />
        </div>
      </div>

      {/* Metric 2: Daily Loss Limit (Max 5%) */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-tv-muted flex items-center gap-1">
            <AlertTriangle size={11} className="text-amber-400" />
            Daily Loss (5%)
          </span>
          <span
            className={`font-mono font-bold ${
              dailyProgress > 80
                ? 'text-red-400'
                : dailyProgress > 50
                ? 'text-amber-400'
                : 'text-tv-text'
            }`}
          >
            -${state.dailyLossAmount.toFixed(0)} / -${state.dailyLossLimitAmount.toFixed(0)}
          </span>
        </div>
        <div className="w-full bg-tv-bg h-1.5 rounded-full overflow-hidden border border-white/5">
          <div
            className={`h-full transition-all duration-300 ${
              dailyProgress > 80
                ? 'bg-red-500'
                : dailyProgress > 50
                ? 'bg-amber-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${dailyProgress}%` }}
          />
        </div>
      </div>

      {/* Metric 3: Max Total Loss (Max 10%) */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-tv-muted flex items-center gap-1">
            <ShieldAlert size={11} className="text-red-400" />
            Max Loss (10%)
          </span>
          <span
            className={`font-mono font-bold ${
              totalProgress > 80
                ? 'text-red-400'
                : totalProgress > 50
                ? 'text-amber-400'
                : 'text-tv-text'
            }`}
          >
            -${state.totalLossAmount.toFixed(0)} / -${state.totalLossLimitAmount.toFixed(0)}
          </span>
        </div>
        <div className="w-full bg-tv-bg h-1.5 rounded-full overflow-hidden border border-white/5">
          <div
            className={`h-full transition-all duration-300 ${
              totalProgress > 80
                ? 'bg-red-500'
                : totalProgress > 50
                ? 'bg-amber-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 ml-auto">
        {isPassed && (
          <span className="bg-emerald-950/80 border border-emerald-500 text-emerald-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[11px] animate-bounce">
            <Award size={13} />
            CHALLENGE PASSED!
          </span>
        )}

        {isBreached && (
          <span className="bg-red-950/80 border border-red-500 text-red-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[11px] animate-pulse">
            <AlertTriangle size={13} />
            {state.status === 'BREACHED_DAILY' ? 'DAILY LOSS BREACHED' : 'MAX LOSS BREACHED'}
          </span>
        )}

        {!isPassed && !isBreached && (
          <span className="bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 px-2.5 py-1 rounded-lg font-mono text-[11px]">
            ACTIVE
          </span>
        )}

        {/* Reset Button */}
        <button
          onClick={onResetChallenge}
          title="Reset Challenge"
          className="p-1 rounded bg-tv-bg hover:bg-tv-border text-tv-muted hover:text-white transition-colors"
        >
          <RefreshCw size={13} />
        </button>

        {/* Close Button */}
        <button
          onClick={onToggleEnabled}
          title="Close Prop Mode"
          className="p-1 text-tv-muted hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
