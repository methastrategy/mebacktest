import React, { useRef } from 'react';
import { Timeframe } from '../types/candle';
import { BarChart2, RefreshCw, Upload, HelpCircle } from 'lucide-react';

interface TopNavbarProps {
  currentTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  onCustomCsvUpload: (csvText: string, filename: string) => void;
  onResetSession: () => void;
  onOpenPerformance: () => void;
  onOpenHelp: () => void;
  isLoading: boolean;
}

const TIMEFRAMES: Timeframe[] = ['M5', 'M15', 'H1', 'D1'];

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentTimeframe,
  onSelectTimeframe,
  onCustomCsvUpload,
  onResetSession,
  onOpenPerformance,
  onOpenHelp,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <header className="h-12 border-b border-tv-border bg-tv-surface px-4 flex items-center justify-between z-20 select-none">
      {/* Brand & Symbol */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-black text-xs shadow-md">
            G
          </div>
          <span className="font-bold text-sm tracking-wide text-white">XAUUSD Replay Studio</span>
        </div>

        <div className="h-4 w-px bg-tv-border mx-1" />

        {/* Timeframe Pills */}
        <div className="flex items-center gap-1 bg-tv-bg p-0.5 rounded-lg border border-tv-border">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => onSelectTimeframe(tf)}
              disabled={isLoading}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                currentTimeframe === tf
                  ? 'bg-tv-blue text-white shadow-sm'
                  : 'text-tv-muted hover:text-tv-text'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {isLoading && (
          <span className="text-xs text-amber-400 animate-pulse flex items-center gap-1">
            <RefreshCw size={12} className="animate-spin" />
            Loading bars...
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Hidden Custom CSV Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload Custom CSV */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Upload your own MT5 or TradingView CSV file"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-tv-bg border border-tv-border hover:border-tv-muted text-tv-text text-xs font-medium transition-colors"
        >
          <Upload size={14} className="text-tv-muted" />
          <span className="hidden sm:inline">Upload CSV</span>
        </button>

        {/* Performance Journal */}
        <button
          onClick={onOpenPerformance}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tv-bg border border-tv-border hover:border-tv-muted text-tv-text text-xs font-medium transition-colors"
        >
          <BarChart2 size={14} className="text-tv-blue" />
          <span>Journal & Stats</span>
        </button>

        {/* Reset Session */}
        <button
          onClick={onResetSession}
          title="Reset account balance and positions"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-tv-bg hover:bg-tv-border text-tv-muted hover:text-white border border-tv-border text-xs transition-colors"
        >
          <RefreshCw size={13} />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Shortcuts Help */}
        <button
          onClick={onOpenHelp}
          title="Help & Shortcuts"
          className="p-1.5 text-tv-muted hover:text-white transition-colors"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
};
