import React from 'react';
import { Crown } from 'lucide-react';

interface ChartWatermarkProps {
  onUpgradeClick: () => void;
}

export const ChartWatermark: React.FC<ChartWatermarkProps> = ({ onUpgradeClick }) => {
  return (
    <div className="absolute top-16 left-6 z-10 pointer-events-auto select-none">
      <div
        onClick={onUpgradeClick}
        className="group cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 hover:border-amber-500/50 transition-all duration-300 shadow-lg"
      >
        <div className="w-5 h-5 rounded bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black text-[10px] shadow-sm">
          <Crown size={12} className="text-black fill-black" />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-white/90 group-hover:text-amber-400 transition-colors flex items-center gap-1">
            MeBacktest Free
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">Trial</span>
          </span>
          <span className="text-[9px] text-gray-400 group-hover:text-gray-200 transition-colors">
            Tap to unlock M1 Replay & FTMO Engine
          </span>
        </div>
      </div>
    </div>
  );
};
