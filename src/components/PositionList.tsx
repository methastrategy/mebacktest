import React from 'react';
import { Layers, X, TrendingUp, TrendingDown } from 'lucide-react';
import { Position } from '../types/trade';

interface PositionListProps {
  positions: Position[];
  onClosePosition: (id: string) => void;
}

export const PositionList: React.FC<PositionListProps> = ({
  positions,
  onClosePosition,
}) => {
  return (
    <div className="bg-tv-surface border border-tv-border rounded-xl p-3 flex flex-col gap-2.5 shadow-xl select-none flex-1 overflow-hidden min-h-[160px]">
      <div className="flex items-center justify-between border-b border-tv-border pb-2">
        <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
          <Layers size={15} className="text-tv-blue" />
          <span>Active Positions ({positions.length})</span>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-tv-muted text-xs py-4 text-center">
          <span className="opacity-60">No open positions</span>
          <span className="text-[11px] text-tv-muted/70 mt-1">Place a Buy or Sell order to start trading</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {positions.map((pos) => {
            const isProfit = pos.unrealizedPnL >= 0;
            return (
              <div
                key={pos.id}
                className="bg-tv-bg border border-tv-border rounded-lg p-2.5 flex flex-col gap-1.5 transition-all hover:border-tv-muted"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        pos.type === 'BUY'
                          ? 'bg-tv-green/20 text-tv-green border border-tv-green/30'
                          : 'bg-tv-red/20 text-tv-red border border-tv-red/30'
                      }`}
                    >
                      {pos.type} {pos.volume}L
                    </span>
                    <span className="font-mono text-xs text-white">
                      @{pos.entryPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => onClosePosition(pos.id)}
                    title="Close Position Now"
                    className="flex items-center gap-1 px-2 py-0.5 bg-red-900/40 hover:bg-red-800 text-red-200 border border-red-500/30 rounded text-[11px] font-medium transition-colors"
                  >
                    <X size={12} />
                    <span>Close</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-tv-border/50">
                  <div className="text-[11px] text-tv-muted font-mono flex items-center gap-2">
                    <span>SL: {pos.stopLoss ? pos.stopLoss.toFixed(2) : '-'}</span>
                    <span>TP: {pos.takeProfit ? pos.takeProfit.toFixed(2) : '-'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono">
                    <span className={`text-[11px] ${isProfit ? 'text-tv-green' : 'text-tv-red'}`}>
                      {pos.pips >= 0 ? '+' : ''}{pos.pips.toFixed(1)}p
                    </span>
                    <span
                      className={`font-bold flex items-center gap-0.5 ${
                        isProfit ? 'text-tv-green' : 'text-tv-red'
                      }`}
                    >
                      {isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {isProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
