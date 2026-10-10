import React, { useState, useEffect } from 'react';
import { X, Check, Zap, CreditCard, QrCode, Sparkles, Copy, CheckCircle2 } from 'lucide-react';
import { BILLING_PLANS, BillingEngine, PlanConfig } from '../core/BillingEngine';
import { AuthService } from '../core/AuthService';
import { UserTier } from '../types/auth';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess?: () => void;
  initialPlan?: string;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgradeSuccess,
  initialPlan = 'pro_monthly',
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlan);
  const [paymentMethod, setPaymentMethod] = useState<'promptpay' | 'stripe'>('promptpay');
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponFeedback, setCouponFeedback] = useState<{
    valid: boolean;
    discountPercent: number;
    finalPriceTHB: number;
    message: string;
  } | null>(null);

  const [promptPayData, setPromptPayData] = useState<{
    payload: string;
    referenceId: string;
    qrSvgData: string;
  } | null>(null);

  const [copiedRef, setCopiedRef] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(899); // 15 mins

  const billingEngine = BillingEngine.getInstance();
  const selectedPlan: PlanConfig = BILLING_PLANS[selectedPlanId] || BILLING_PLANS.pro_monthly;

  // Recalculate price and QR code when plan or coupon changes
  useEffect(() => {
    let finalTHB = selectedPlan.priceTHB;
    if (couponCode.trim()) {
      const res = billingEngine.applyCoupon(couponCode, selectedPlan.priceTHB);
      setCouponFeedback(res);
      if (res.valid) {
        finalTHB = res.finalPriceTHB;
      }
    } else {
      setCouponFeedback(null);
    }

    const qr = billingEngine.generatePromptPayPayload('0812345678', finalTHB);
    setPromptPayData(qr);
  }, [selectedPlanId, couponCode, selectedPlan.priceTHB, billingEngine]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPriceTHB = couponFeedback?.valid
    ? couponFeedback.finalPriceTHB
    : selectedPlan.priceTHB;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const res = billingEngine.applyCoupon(couponCode, selectedPlan.priceTHB);
    setCouponFeedback(res);
  };

  const handleCopyReference = () => {
    if (promptPayData?.referenceId) {
      navigator.clipboard.writeText(promptPayData.referenceId);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleConfirmPromptPayPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      // Upgrade user tier in AuthService
      const targetTier: UserTier =
        selectedPlanId === 'day_pass'
          ? 'day_pass'
          : selectedPlanId === 'week_pass'
          ? 'week_pass'
          : selectedPlanId === 'pro_yearly'
          ? 'pro_yearly'
          : 'pro_monthly';

      const durationHours =
        selectedPlanId === 'day_pass' ? 24 : selectedPlanId === 'week_pass' ? 168 : undefined;

      AuthService.getInstance().updateTier(targetTier, durationHours);
      if (onUpgradeSuccess) onUpgradeSuccess();
      onClose();
    }, 1200);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0b0e14] border border-amber-500/40 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden text-tv-text my-auto">
        {/* Top Accent Ribbon */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-start justify-between border-b border-tv-border/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold tracking-wider uppercase flex items-center gap-1">
                <Sparkles size={11} />
                MeBacktest Pro Trader Suite
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">Unlock High-Performance Trading Terminal</h2>
            <p className="text-xs text-tv-muted mt-0.5">
              100,000+ M1 Bars, FTMO Rules Engine, Supply/Demand Zones & Multi-Asset Data Lake
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-tv-muted hover:text-white hover:bg-tv-border transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Plan Selection & Coupons */}
          <div className="md:col-span-7 flex flex-col gap-3.5">
            <label className="text-xs font-semibold text-tv-text uppercase tracking-wider">
              1. Choose Access Pass
            </label>

            {/* Plan Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {Object.values(BILLING_PLANS).map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative cursor-pointer p-3 rounded-2xl border transition-all text-left ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-tv-surface/60 border-tv-border hover:border-tv-muted'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-md bg-amber-500 text-black font-extrabold text-[9px] uppercase tracking-wider">
                        {plan.badge}
                      </span>
                    )}
                    <h3 className="text-xs font-bold text-white">{plan.name}</h3>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-lg font-black text-amber-400">
                        ฿{plan.priceTHB.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-tv-muted">
                        {plan.billingInterval === 'month'
                          ? '/mo'
                          : plan.billingInterval === 'year'
                          ? '/yr'
                          : 'pass'}
                      </span>
                    </div>
                    <p className="text-[10px] text-tv-muted mt-1 line-clamp-2">{plan.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="mt-1 flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Discount Code (e.g. LAUNCH50)"
                className="flex-1 bg-tv-bg border border-tv-border focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder-tv-muted uppercase font-mono tracking-wider focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-tv-surface hover:bg-tv-border border border-tv-border text-tv-text hover:text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Apply
              </button>
            </form>

            {couponFeedback && (
              <p
                className={`text-[11px] font-medium flex items-center gap-1 ${
                  couponFeedback.valid ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {couponFeedback.valid ? <Check size={12} /> : <X size={12} />}
                {couponFeedback.message}
              </p>
            )}

            {/* Feature Checklist */}
            <div className="mt-2 p-3 rounded-xl bg-tv-bg border border-tv-border/80">
              <h4 className="text-[11px] font-bold text-white mb-2 flex items-center gap-1">
                <Zap size={12} className="text-amber-400" />
                Included with {selectedPlan.name}:
              </h4>
              <ul className="space-y-1.5">
                {selectedPlan.features.map((feat, i) => (
                  <li key={i} className="text-[11px] text-tv-text/90 flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Checkout & Payment */}
          <div className="md:col-span-5 flex flex-col justify-between p-4 rounded-2xl bg-tv-surface border border-tv-border">
            <div>
              {/* Payment Method Switcher */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-tv-bg rounded-xl border border-tv-border mb-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('promptpay')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    paymentMethod === 'promptpay'
                      ? 'bg-tv-blue text-white shadow-sm'
                      : 'text-tv-muted hover:text-white'
                  }`}
                >
                  <QrCode size={13} />
                  PromptPay
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('stripe')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    paymentMethod === 'stripe'
                      ? 'bg-tv-blue text-white shadow-sm'
                      : 'text-tv-muted hover:text-white'
                  }`}
                >
                  <CreditCard size={13} />
                  Credit Card
                </button>
              </div>

              {/* PromptPay View */}
              {paymentMethod === 'promptpay' ? (
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-white rounded-2xl shadow-md border-2 border-slate-200">
                    {promptPayData && (
                      <img
                        src={promptPayData.qrSvgData}
                        alt="PromptPay QR Code"
                        className="w-44 h-44 object-contain rounded-lg"
                      />
                    )}
                  </div>

                  <div className="mt-3">
                    <span className="text-[10px] text-tv-muted">Total Payment</span>
                    <div className="text-2xl font-black text-white">
                      ฿{currentPriceTHB.toLocaleString()}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-tv-muted bg-tv-bg px-2.5 py-1 rounded-lg border border-tv-border">
                    <span className="font-mono text-white/80">{promptPayData?.referenceId}</span>
                    <button
                      onClick={handleCopyReference}
                      title="Copy Reference"
                      className="p-1 text-tv-muted hover:text-white"
                    >
                      {copiedRef ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>

                  <p className="text-[10px] text-amber-400 mt-2 font-mono">
                    Scan expires in: {formatTimer(secondsRemaining)}
                  </p>
                </div>
              ) : (
                /* Stripe View */
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-14 h-14 rounded-2xl bg-tv-blue/10 border border-tv-blue/30 flex items-center justify-center text-tv-blue mb-3">
                    <CreditCard size={28} />
                  </div>
                  <h4 className="text-sm font-bold text-white">Stripe Global Checkout</h4>
                  <p className="text-xs text-tv-muted mt-1 px-3">
                    Secure Visa, Mastercard, and Amex processing via Stripe 256-bit encryption.
                  </p>
                  <div className="text-2xl font-black text-white mt-4">
                    ${selectedPlan.priceUSD.toFixed(2)}{' '}
                    <span className="text-xs text-tv-muted font-normal">USD</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="mt-4 pt-3 border-t border-tv-border">
              <button
                type="button"
                onClick={handleConfirmPromptPayPayment}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span>Verifying Payment...</span>
                ) : (
                  <>
                    <Zap size={14} className="fill-black" />
                    <span>Confirm & Activate Pro Instantly</span>
                  </>
                )}
              </button>
              <p className="text-[9px] text-center text-tv-muted mt-2">
                Instant auto-activation • 100% money-back guarantee within 7 days
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
