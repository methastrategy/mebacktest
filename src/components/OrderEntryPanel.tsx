import React, { useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, ShieldAlert, Target, DollarSign, Tag } from 'lucide-react';
import { OrderType } from '../types/trade';

interface OrderEntryPanelProps {
  currentPrice: number;
  onPlaceOrder: (params: {
    type: OrderType;
    volume: number;
    stopLoss?: number;
    takeProfit?: number;
    spread?: number;
    setupTag?: string;
  }) => void;
  clickedPrice?: number;
  spreadPips?: number;
  onChangeSpread?: (pips: number) => void;
}

const LOT_PRESETS = [0.01, 0.05, 0.1, 0.25, 0.5, 1.0];
const SPREAD_PRESETS = [0, 15, 25, 40];
const SETUP_TAGS = [
  'Liquidity Sweep',
  'Break of Structure',
  'Fair Value Gap',
  'Trend Pullback',
  'ChoCH Reversal',
  'Range Scalp',
];

export const OrderEntryPanel: React.FC<OrderEntryPanelProps> = ({
  currentPrice,
  onPlaceOrder,
  clickedPrice,
  spreadPips = 20,
  onChangeSpread,
}) => {
  const [volume, setVolume] = useState<number>(0.1);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [targetType, setTargetType] = useState<OrderType>('BUY');
  const [setupTag, setSetupTag] = useState<string>('Liquidity Sweep');

  const spreadOffset = spreadPips / 100.0;
  const askPrice = currentPrice > 0 ? currentPrice + spreadOffset : 0;
  const bidPrice = currentPrice;

  // If user clicked on chart price, autofill SL or TP depending on relative level
  useEffect(() => {
    if (clickedPrice && currentPrice > 0) {
      if (clickedPrice < currentPrice) {
        // Below current price -> default SL for BUY or TP for SELL
        if (targetType === 'BUY') {
          setStopLoss(clickedPrice.toFixed(2));
        } else {
          setTakeProfit(clickedPrice.toFixed(2));
        }
      } else {
        // Above current price -> default TP for BUY or SL for SELL
        if (targetType === 'BUY') {
          setTakeProfit(clickedPrice.toFixed(2));
        } else {
          setStopLoss(clickedPrice.toFixed(2));
        }
      }
    }
  }, [clickedPrice, currentPrice, targetType]);

  // Apply Quick Pip Offsets
  // In Gold: 100 pips = $1.00 move
  const applyPipOffsetSL = (pips: number) => {
    if (!currentPrice) return;
    const offset = pips / 100.0;
    if (targetType === 'BUY') {
      setStopLoss((currentPrice - offset).toFixed(2));
    } else {
      setStopLoss((currentPrice + offset).toFixed(2));
    }
  };

  const applyPipOffsetTP = (pips: number) => {
    if (!currentPrice) return;
    const offset = pips / 100.0;
    if (targetType === 'BUY') {
      setTakeProfit((currentPrice + offset).toFixed(2));
    } else {
      setTakeProfit((currentPrice - offset).toFixed(2));
    }
  };

  // Risk / Reward calculations
  const parsedSL = stopLoss ? parseFloat(stopLoss) : undefined;
  const parsedTP = takeProfit ? parseFloat(takeProfit) : undefined;

  let riskAmount = 0;
  let rewardAmount = 0;
  let riskRewardRatio = '1 : -';

  if (currentPrice > 0 && parsedSL) {
    const slDist = Math.abs(currentPrice - parsedSL);
    riskAmount = slDist * volume * 100;
  }

  if (currentPrice > 0 && parsedTP) {
    const tpDist = Math.abs(currentPrice - parsedTP);
    rewardAmount = tpDist * volume * 100;
  }

  if (riskAmount > 0 && rewardAmount > 0) {
    const rr = (rewardAmount / riskAmount).toFixed(2);
    riskRewardRatio = `1 : ${rr}`;
  }

  const handleBuy = () => {
    if (volume <= 0 || !currentPrice) return;
    onPlaceOrder({
      type: 'BUY',
      volume,
      stopLoss: parsedSL,
      takeProfit: parsedTP,
      spread: spreadPips,
      setupTag,
    });
  };

  const handleSell = () => {
    if (volume <= 0 || !currentPrice) return;
    onPlaceOrder({
      type: 'SELL',
      volume,
      stopLoss: parsedSL,
      takeProfit: parsedTP,
      spread: spreadPips,
      setupTag,
    });
  };

  return (
    <div className="bg-tv-surface border border-tv-border rounded-xl p-4 flex flex-col gap-3.5 shadow-xl">
      <div className="flex items-center justify-between border-b border-tv-border pb-2.5">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-white">
          <DollarSign size={16} className="text-amber-400" />
          <span>New Order (Manual Trade)</span>
        </h3>
        <div className="text-right">
          <div className="text-xs font-mono font-bold text-amber-300">
            {currentPrice ? currentPrice.toFixed(2) : '---'}
          </div>
          {spreadPips > 0 && currentPrice > 0 && (
            <div className="text-[10px] font-mono text-tv-muted">
              Ask: <span className="text-tv-text">{askPrice.toFixed(2)}</span> ({spreadPips}p)
            </div>
          )}
        </div>
      </div>

      {/* Spread Simulation Control */}
      <div className="flex flex-col gap-1 bg-tv-bg/60 border border-tv-border/80 rounded-lg p-2">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-tv-muted font-medium">Spread Simulation:</span>
          <span className="text-amber-400 font-mono font-bold">
            {spreadPips} pips (${(spreadPips / 100).toFixed(2)})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            max="200"
            step="1"
            value={spreadPips}
            onChange={(e) => onChangeSpread && onChangeSpread(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-16 bg-tv-bg border border-tv-border focus:border-amber-400 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-white text-center focus:outline-none"
          />
          <div className="flex items-center gap-1 flex-1">
            {SPREAD_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => onChangeSpread && onChangeSpread(p)}
                className={`flex-1 py-0.5 rounded text-[10px] font-mono transition-colors border ${
                  spreadPips === p
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-tv-bg border-tv-border text-tv-muted hover:text-white'
                }`}
              >
                {p}p
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lot Size Selector */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-xs">
          <label className="text-tv-muted font-medium">Volume (Lots):</label>
          <span className="text-[11px] text-tv-muted">1.0 Lot = $100 / $1 move</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
            className="w-24 bg-tv-bg border border-tv-border focus:border-tv-blue rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-white focus:outline-none"
          />
          <div className="flex flex-wrap gap-1 flex-1">
            {LOT_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setVolume(preset)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors border ${
                  volume === preset
                    ? 'bg-tv-blue text-white border-tv-blue font-bold'
                    : 'bg-tv-bg border-tv-border text-tv-muted hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Order Side Selector for SL/TP Quick Presets */}
      <div className="flex bg-tv-bg p-1 rounded-lg border border-tv-border">
        <button
          onClick={() => setTargetType('BUY')}
          className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
            targetType === 'BUY' ? 'bg-tv-green text-white font-bold' : 'text-tv-muted'
          }`}
        >
          Long / Buy Mode
        </button>
        <button
          onClick={() => setTargetType('SELL')}
          className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
            targetType === 'SELL' ? 'bg-tv-red text-white font-bold' : 'text-tv-muted'
          }`}
        >
          Short / Sell Mode
        </button>
      </div>

      {/* Stop Loss (SL) Input & Quick Pips */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="flex items-center gap-1 text-red-400 font-medium">
            <ShieldAlert size={13} />
            Stop Loss (SL):
          </span>
          {riskAmount > 0 && (
            <span className="text-red-400 font-mono text-[11px]">
              -${riskAmount.toFixed(1)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            step="0.01"
            placeholder="Price (e.g. 2400.00)"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="flex-1 bg-tv-bg border border-tv-border focus:border-red-500 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
          />
          {stopLoss && (
            <button
              onClick={() => setStopLoss('')}
              className="text-xs text-tv-muted hover:text-white px-1.5"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-tv-muted mr-1">Quick SL:</span>
          {[20, 50, 100, 200].map((pips) => (
            <button
              key={pips}
              onClick={() => applyPipOffsetSL(pips)}
              className="px-1.5 py-0.5 rounded bg-tv-bg hover:bg-tv-border text-tv-muted hover:text-red-300 font-mono text-[10px] border border-tv-border"
            >
              {pips}p
            </button>
          ))}
        </div>
      </div>

      {/* Take Profit (TP) Input & Quick Pips */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <Target size={13} />
            Take Profit (TP):
          </span>
          {rewardAmount > 0 && (
            <span className="text-emerald-400 font-mono text-[11px]">
              +${rewardAmount.toFixed(1)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            step="0.01"
            placeholder="Price (e.g. 2420.00)"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            className="flex-1 bg-tv-bg border border-tv-border focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
          />
          {takeProfit && (
            <button
              onClick={() => setTakeProfit('')}
              className="text-xs text-tv-muted hover:text-white px-1.5"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-tv-muted mr-1">Quick TP:</span>
          {[50, 100, 200, 400].map((pips) => (
            <button
              key={pips}
              onClick={() => applyPipOffsetTP(pips)}
              className="px-1.5 py-0.5 rounded bg-tv-bg hover:bg-tv-border text-tv-muted hover:text-emerald-300 font-mono text-[10px] border border-tv-border"
            >
              {pips}p
            </button>
          ))}
        </div>
      </div>

      {/* Setup Tag Selector */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-tv-muted font-medium">
            <Tag size={12} className="text-indigo-400" />
            Setup Model (Strategy Tag):
          </span>
          <span className="text-[11px] text-indigo-300 font-mono font-medium">{setupTag}</span>
        </div>
        <select
          value={setupTag}
          onChange={(e) => setSetupTag(e.target.value)}
          className="bg-tv-bg border border-tv-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
        >
          {SETUP_TAGS.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {/* R:R Ratio Preview */}
      <div className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-tv-bg rounded-lg border border-tv-border">
        <span className="text-tv-muted">Risk : Reward Ratio:</span>
        <span className="font-mono font-bold text-amber-400">{riskRewardRatio}</span>
      </div>

      {/* Instant Action Execution Buttons */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          onClick={handleBuy}
          disabled={!currentPrice}
          className="flex flex-col items-center justify-center py-2.5 bg-tv-green hover:bg-tv-greenHover active:scale-98 text-white rounded-xl font-bold transition-all shadow-lg shadow-tv-green/20"
        >
          <div className="flex items-center gap-1.5 text-sm">
            <ArrowUpCircle size={16} />
            <span>BUY MARKET</span>
          </div>
          {currentPrice > 0 && (
            <span className="text-[11px] font-mono opacity-90 font-medium">
              Ask {askPrice.toFixed(2)}
            </span>
          )}
        </button>

        <button
          onClick={handleSell}
          disabled={!currentPrice}
          className="flex flex-col items-center justify-center py-2.5 bg-tv-red hover:bg-tv-redHover active:scale-98 text-white rounded-xl font-bold transition-all shadow-lg shadow-tv-red/20"
        >
          <div className="flex items-center gap-1.5 text-sm">
            <ArrowDownCircle size={16} />
            <span>SELL MARKET</span>
          </div>
          {currentPrice > 0 && (
            <span className="text-[11px] font-mono opacity-90 font-medium">
              Bid {bidPrice.toFixed(2)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
