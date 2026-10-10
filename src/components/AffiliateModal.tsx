import React, { useState, useEffect } from 'react';
import { X, Copy, Check, TrendingUp, Gift, CreditCard } from 'lucide-react';
import { AffiliateService, AffiliateStats } from '../core/AffiliateService';

interface AffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AffiliateModal: React.FC<AffiliateModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);

  const affiliateService = AffiliateService.getInstance();

  useEffect(() => {
    if (isOpen) {
      setStats(affiliateService.getStats());
      setPayoutMessage(null);
    }
  }, [isOpen]);

  if (!isOpen || !stats) return null;

  const referralUrl = affiliateService.getReferralUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestPayout = () => {
    const result = affiliateService.requestPayout();
    setPayoutMessage(result.message);
    setStats(affiliateService.getStats());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0b0e14] border border-tv-border rounded-3xl shadow-2xl overflow-hidden p-6 text-tv-text my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-tv-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Gift size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Affiliate & Partner Program</h2>
              <p className="text-xs text-tv-muted">Earn 30% recurring lifetime commission on every trader you invite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-tv-muted hover:text-white hover:bg-tv-border transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Share Link Banner */}
        <div className="my-4 p-4 rounded-2xl bg-tv-surface/80 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">
              Your Unique Referral Link
            </span>
            <span className="text-xs font-mono text-white/90 break-all select-all">{referralUrl}</span>
          </div>

          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 active:scale-95"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
          <div className="p-3 rounded-xl bg-tv-bg border border-tv-border">
            <span className="text-[10px] text-tv-muted block">Link Clicks</span>
            <span className="text-lg font-black text-white">{stats.totalClicks}</span>
          </div>
          <div className="p-3 rounded-xl bg-tv-bg border border-tv-border">
            <span className="text-[10px] text-tv-muted block">Total Referrals</span>
            <span className="text-lg font-black text-white">{stats.totalReferrals}</span>
          </div>
          <div className="p-3 rounded-xl bg-tv-bg border border-tv-border">
            <span className="text-[10px] text-tv-muted block">Active Subs</span>
            <span className="text-lg font-black text-emerald-400">{stats.activeSubscribers}</span>
          </div>
          <div className="p-3 rounded-xl bg-tv-bg border border-tv-border">
            <span className="text-[10px] text-tv-muted block">Commission</span>
            <span className="text-lg font-black text-amber-400">{stats.commissionRate * 100}%</span>
          </div>
        </div>

        {/* Earnings Card & Payout Request */}
        <div className="my-3 p-4 rounded-xl bg-[#0f172a]/70 border border-tv-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-tv-muted block">Unpaid Commission (PromptPay Payout)</span>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">
              ฿{stats.pendingEarningsTHB.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
              <span className="text-xs text-tv-muted font-normal">
                (Total Paid: ฿{stats.paidEarningsTHB.toLocaleString()})
              </span>
            </div>
          </div>

          <button
            onClick={handleRequestPayout}
            className="px-4 py-2.5 rounded-xl bg-tv-blue hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shrink-0"
          >
            <CreditCard size={14} />
            <span>Request PromptPay Payout</span>
          </button>
        </div>

        {payoutMessage && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
            <Check size={14} />
            {payoutMessage}
          </div>
        )}

        {/* Recent Referral Commissions Log */}
        <div className="mt-2">
          <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
            <TrendingUp size={13} className="text-amber-400" />
            Recent Referral Activity
          </h4>

          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {stats.recentCommissions.map((comm) => (
              <div
                key={comm.id}
                className="p-2.5 rounded-lg bg-tv-bg border border-tv-border flex items-center justify-between text-xs"
              >
                <div>
                  <span className="text-white font-medium block">{comm.referredUser}</span>
                  <span className="text-[10px] text-tv-muted">{comm.plan}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-400 font-mono">
                    +฿{comm.commissionTHB.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-tv-muted block">30% RevShare</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
