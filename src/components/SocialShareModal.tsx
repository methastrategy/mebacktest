import React, { useRef, useEffect, useState } from 'react';
import { X, Download, Copy, Share2, Check, Sparkles } from 'lucide-react';
import { AccountState } from '../types/trade';
import { PropFirmState } from '../core/PropFirmEngine';
import { AuthService } from '../core/AuthService';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: AccountState;
  propFirmState?: PropFirmState;
  symbol: string;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  account,
  propFirmState,
  symbol,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [dataUrl, setDataUrl] = useState<string>('');

  const currentUser = AuthService.getInstance().getCurrentUser();
  const traderName = currentUser?.displayName || 'Prop Hunter';

  const netPnL = account.balance - account.initialBalance;
  const pnlPercent = account.initialBalance > 0 ? (netPnL / account.initialBalance) * 100 : 0;
  const isProfit = netPnL >= 0;
  const isPassed = propFirmState?.status === 'PASSED';

  // Render high-fidelity canvas card
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    // Background gradient: Midnight Obsidian
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#080a0f');
    bgGrad.addColorStop(0.5, '#0d131f');
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Ambient radial glow top right (Gold/Amber)
    const glow1 = ctx.createRadialGradient(width - 200, 100, 10, width - 200, 100, 450);
    glow1.addColorStop(0, 'rgba(245, 158, 11, 0.18)');
    glow1.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    // Ambient radial glow bottom left (Emerald or Red depending on PnL)
    const glow2 = ctx.createRadialGradient(200, height - 100, 10, 200, height - 100, 400);
    glow2.addColorStop(
      0,
      isProfit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
    );
    glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);

    // Outer card border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Inner subtle glow border
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(34, 34, width - 68, height - 68);

    // Header: Logo & Branding
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(90, 85, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MB', 90, 93);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Inter", sans-serif';
    ctx.fillText('MeBacktest', 128, 86);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 14px "Inter", sans-serif';
    ctx.fillText('Institutional Replay Terminal • Verified P&L Report', 128, 106);

    // Trader Profile Tag (Top Right)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Inter", sans-serif';
    ctx.fillText(`@${traderName}`, width - 70, 84);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '600 13px "Inter", sans-serif';
    ctx.fillText(`Symbol: ${symbol} • Price Action Drill`, width - 70, 106);

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(70, 135);
    ctx.lineTo(width - 70, 135);
    ctx.stroke();

    // Central Highlight: Net PnL Callout
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 15px "Inter", sans-serif';
    ctx.fillText('TOTAL NET REALIZED P&L', 70, 185);

    const sign = isProfit ? '+' : '';
    const pnlFormatted = `${sign}$${netPnL.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    ctx.fillStyle = isProfit ? '#10b981' : '#f43f5e';
    ctx.font = '900 68px "Inter", monospace';
    ctx.fillText(pnlFormatted, 70, 255);

    // Return percentage pill
    ctx.fillStyle = isProfit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';
    ctx.beginPath();
    ctx.roundRect(70, 275, 180, 36, 18);
    ctx.fill();

    ctx.strokeStyle = isProfit ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = isProfit ? '#34d399' : '#fb7185';
    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.fillText(`${sign}${pnlPercent.toFixed(2)}% Return`, 90, 299);

    // FTMO / Challenge Status Stamp (Center Right)
    if (isPassed) {
      ctx.save();
      ctx.translate(width - 250, 240);
      ctx.rotate((-8 * Math.PI) / 180);

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.strokeRect(-180, -40, 360, 80);

      ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
      ctx.fillRect(-180, -40, 360, 80);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 24px "Inter", sans-serif';
      ctx.fillText('FTMO PASSED', 0, 8);

      ctx.font = 'bold 11px "Inter", sans-serif';
      ctx.fillText('TARGET ACHIEVED • DISCIPLINE VERIFIED', 0, 28);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(width - 250, 240);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-160, -35, 320, 70);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Inter", sans-serif';
      ctx.fillText('PRO DRILL SESSION', 0, 5);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 12px "Inter", sans-serif';
      ctx.fillText('High-Frequency Bar Replay', 0, 24);
      ctx.restore();
    }

    // Grid of Performance Stats (4 Cards at Bottom)
    const stats = [
      { label: 'WIN RATE', value: `${account.winRate.toFixed(1)}%`, color: '#ffffff' },
      {
        label: 'PROFIT FACTOR',
        value: account.profitFactor >= 99 ? '∞' : account.profitFactor.toFixed(2),
        color: '#ffffff',
      },
      {
        label: 'TOTAL TRADES',
        value: `${account.tradeCount} (${account.winCount}W / ${account.lossCount}L)`,
        color: '#ffffff',
      },
      {
        label: 'MAX DRAWDOWN',
        value: `${account.maxDrawdownPercent.toFixed(1)}%`,
        color: account.maxDrawdownPercent > 5 ? '#f43f5e' : '#10b981',
      },
    ];

    const cardY = 370;
    const cardHeight = 110;
    const cardWidth = 250;
    const startX = 70;
    const gap = 20;

    stats.forEach((st, idx) => {
      const x = startX + idx * (cardWidth + gap);

      // Card Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.beginPath();
      ctx.roundRect(x, cardY, cardWidth, cardHeight, 14);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Card Label
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px "Inter", sans-serif';
      ctx.fillText(st.label, x + 20, cardY + 34);

      // Card Value
      ctx.fillStyle = st.color;
      ctx.font = 'bold 26px "Inter", monospace';
      ctx.fillText(st.value, x + 20, cardY + 75);
    });

    // Footer Watermark & URL
    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = '500 13px "Inter", sans-serif';
    ctx.fillText('Built for Gold Scalpers & Prop Firm Hunters • mebacktest.com', 70, 560);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 13px "Inter", sans-serif';
    ctx.fillText('Powered by MeBacktest 60 FPS Replay Engine', width - 70, 560);

    const generatedUrl = canvas.toDataURL('image/png');
    setDataUrl(generatedUrl);
  }, [isOpen, account, propFirmState, symbol, isProfit, isPassed, netPnL, pnlPercent, traderName]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `MeBacktest_PnL_${symbol}_${Date.now()}.png`;
    a.click();
  };

  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      // Fallback
    }
  };

  const handleShareToTwitter = () => {
    const text = `Just finished backtesting ${symbol} on @MeBacktest! Net P&L: ${isProfit ? '+' : ''}$${netPnL.toFixed(
      2
    )} (${pnlPercent.toFixed(1)}%) with ${account.winRate.toFixed(1)}% win rate! 🔥📊 #MeBacktest #Trading #XAUUSD`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0b0e14] border border-tv-border rounded-3xl shadow-2xl overflow-hidden p-6 text-tv-text my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-tv-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black text-sm">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Social P&L Card</h2>
              <p className="text-xs text-tv-muted">
                High-resolution proof card ready for Twitter, Discord, and Instagram
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-tv-muted hover:text-white hover:bg-tv-border transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hidden Master Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Card Preview */}
        <div className="my-4 flex items-center justify-center bg-black/50 p-3 rounded-2xl border border-tv-border/80">
          {dataUrl && (
            <img
              src={dataUrl}
              alt="Social Share Card Preview"
              className="w-full max-h-[50vh] object-contain rounded-xl shadow-2xl border border-white/10"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-tv-border">
          <div className="text-xs text-tv-muted">
            Format: <strong>1200 x 630 HD PNG</strong> • Retains vector clarity
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyToClipboard}
              className="px-3.5 py-2 rounded-xl bg-tv-surface hover:bg-tv-border border border-tv-border text-tv-text hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied Image!' : 'Copy to Clipboard'}</span>
            </button>

            <button
              onClick={handleShareToTwitter}
              className="px-3.5 py-2 rounded-xl bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 border border-[#1DA1F2]/40 text-[#1DA1F2] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Share2 size={14} />
              <span>Share on X</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
            >
              <Download size={14} className="fill-black" />
              <span>Download Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
