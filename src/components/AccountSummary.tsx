import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Percent, Award } from 'lucide-react';
import { AccountState } from '../types/trade';

interface AccountSummaryProps {
  account: AccountState;
}

export const AccountSummary: React.FC<AccountSummaryProps> = ({ account }) => {
  const isProfit = account.unrealizedPnL >= 0;
  const isNetProfit = account.realizedPnL >= 0;

  return (
    <div className="bg-tv-surface border border-tv-border rounded-xl p-3 flex flex-col gap-2.5 shadow-xl select-none">
      <div className="flex items-center justify-between border-b border-tv-border pb-2">
        <div className="flex items-center gap-1.5 text-xs text-tv-muted font-medium">
          <Wallet size={15} className="text-tv-blue" />
          <span>Account Overview</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-tv-muted">
          <span>Trades:</span>
          <strong className="text-white">{account.tradeCount}</strong>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Balance */}
        <div className="bg-tv-bg p-2 rounded-lg border border-tv-border flex flex-col">
          <span className="text-tv-muted text-[11px]">Balance</span>
          <span className="font-mono font-bold text-white text-sm">
            ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Equity */}
        <div className="bg-tv-bg p-2 rounded-lg border border-tv-border flex flex-col">
          <span className="text-tv-muted text-[11px]">Equity</span>
          <span className={`font-mono font-bold text-sm ${isProfit ? 'text-tv-green' : 'text-tv-red'}`}>
            ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Unrealized PnL */}
        <div className="bg-tv-bg p-2 rounded-lg border border-tv-border flex flex-col">
          <div className="flex items-center justify-between text-tv-muted text-[11px]">
            <span>Floating PnL</span>
            {isProfit ? <TrendingUp size={12} className="text-tv-green" /> : <TrendingDown size={12} className="text-tv-red" />}
          </div>
          <span className={`font-mono font-bold text-sm ${isProfit ? 'text-tv-green' : 'text-tv-red'}`}>
            {isProfit ? '+' : ''}${account.unrealizedPnL.toFixed(2)}
          </span>
        </div>

        {/* Realized Net PnL */}
        <div className="bg-tv-bg p-2 rounded-lg border border-tv-border flex flex-col">
          <div className="flex items-center justify-between text-tv-muted text-[11px]">
            <span>Net Realized</span>
          </div>
          <span className={`font-mono font-bold text-sm ${isNetProfit ? 'text-tv-green' : 'text-tv-red'}`}>
            {isNetProfit ? '+' : ''}${account.realizedPnL.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Mini Performance Badges */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-tv-muted border-t border-tv-border">
        <div className="flex items-center gap-1">
          <Percent size={12} className="text-amber-400" />
          <span>Win Rate:</span>
          <strong className="text-white font-mono">{account.winRate.toFixed(1)}%</strong>
        </div>

        <div className="flex items-center gap-1">
          <Award size={12} className="text-indigo-400" />
          <span>Profit Factor:</span>
          <strong className="text-white font-mono">{account.profitFactor.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
};
