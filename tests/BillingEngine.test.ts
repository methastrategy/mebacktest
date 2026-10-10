import { describe, it, expect } from 'vitest';
import { BillingEngine, BILLING_PLANS } from '../src/core/BillingEngine';

describe('BillingEngine', () => {
  const engine = BillingEngine.getInstance();

  it('correctly provides all commercial plans with pricing and features', () => {
    expect(BILLING_PLANS.day_pass.priceTHB).toBe(99);
    expect(BILLING_PLANS.week_pass.priceTHB).toBe(199);
    expect(BILLING_PLANS.pro_monthly.priceTHB).toBe(490);
    expect(BILLING_PLANS.pro_yearly.priceTHB).toBe(4500);

    expect(BILLING_PLANS.day_pass.features.length).toBeGreaterThan(0);
  });

  it('enforces feature gating for Free tier users', () => {
    expect(engine.canAccessFeature('free', 'timeframe_m1')).toBe(false);
    expect(engine.canAccessFeature('free', 'timeframe_m5')).toBe(false);
    expect(engine.canAccessFeature('free', 'prop_firm_mode')).toBe(false);
    expect(engine.canAccessFeature('free', 'multi_asset')).toBe(false);
    expect(engine.canAccessFeature('free', 'custom_csv')).toBe(true);
    expect(engine.hasWatermark('free')).toBe(true);
  });

  it('unlocks all features for Pro Monthly, Pro Yearly, and Lifetime tiers', () => {
    const proTiers = ['pro_monthly', 'pro_yearly', 'lifetime'] as const;
    for (const tier of proTiers) {
      expect(engine.canAccessFeature(tier, 'timeframe_m1')).toBe(true);
      expect(engine.canAccessFeature(tier, 'timeframe_m5')).toBe(true);
      expect(engine.canAccessFeature(tier, 'prop_firm_mode')).toBe(true);
      expect(engine.canAccessFeature(tier, 'multi_asset')).toBe(true);
      expect(engine.hasWatermark(tier)).toBe(false);
    }
  });

  it('unlocks features for active Day Pass and blocks expired Day Pass', () => {
    const validFuture = Date.now() + 3600 * 1000 * 24; // 24h future
    const expiredPast = Date.now() - 1000;

    expect(engine.canAccessFeature('day_pass', 'timeframe_m1', validFuture)).toBe(true);
    expect(engine.hasWatermark('day_pass', validFuture)).toBe(false);

    expect(engine.canAccessFeature('day_pass', 'timeframe_m1', expiredPast)).toBe(false);
    expect(engine.hasWatermark('day_pass', expiredPast)).toBe(true);
  });

  it('applies valid discount coupons correctly', () => {
    const res50 = engine.applyCoupon('LAUNCH50', 490);
    expect(res50.valid).toBe(true);
    expect(res50.discountPercent).toBe(50);
    expect(res50.finalPriceTHB).toBe(245);

    const res30 = engine.applyCoupon('PROPTRADER', 4500);
    expect(res30.valid).toBe(true);
    expect(res30.discountPercent).toBe(30);
    expect(res30.finalPriceTHB).toBe(3150);

    const invalid = engine.applyCoupon('FAKECODE', 490);
    expect(invalid.valid).toBe(false);
    expect(invalid.finalPriceTHB).toBe(490);
  });

  it('generates valid PromptPay EMVCo payload with verified CRC-16 checksum', () => {
    const res = engine.generatePromptPayPayload('0812345678', 490);
    expect(res.payload).toContain('00020101021229370016A00000067701011101130066812345678');
    expect(res.referenceId.startsWith('PAY-')).toBe(true);
    expect(res.qrSvgData.startsWith('data:image/svg+xml')).toBe(true);

    // Verify CRC-16 Checksum
    expect(res.payload.length).toBeGreaterThan(60);
    expect(engine.verifyPromptPayChecksum(res.payload)).toBe(true);

    // Corrupted payload must fail checksum verification
    const corrupted = res.payload.substring(0, res.payload.length - 1) + '0';
    expect(engine.verifyPromptPayChecksum(corrupted)).toBe(false);
  });

  it('handles 13-digit National ID / Tax ID in PromptPay format', () => {
    const taxId = '1100701234567';
    const res = engine.generatePromptPayPayload(taxId, 199);
    // Subtag 02 for 13-digit National/Tax ID
    expect(res.payload).toContain('0016A00000067701011102131100701234567');
    expect(engine.verifyPromptPayChecksum(res.payload)).toBe(true);
  });

  it('generates authentic scannable QR SVG with module rects', () => {
    const res = engine.generatePromptPayPayload('0812345678', 99);
    expect(res.qrSvgData).toContain('<svg');
    expect(res.qrSvgData).toContain('<rect');
    expect(res.qrSvgData).toContain('fill="#0f172a"');
  });
});
