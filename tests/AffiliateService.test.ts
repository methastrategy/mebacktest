import { describe, it, expect, beforeEach } from 'vitest';
import { AffiliateService } from '../src/core/AffiliateService';

const storageMap = new Map<string, string>();
if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) || null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
    clear: () => storageMap.clear(),
  };
}

describe('AffiliateService', () => {
  let affiliate: AffiliateService;

  beforeEach(() => {
    (globalThis as any).localStorage.clear();
    affiliate = AffiliateService.getInstance();
  });

  it('provides default affiliate stats and 30% rev share', () => {
    const stats = affiliate.getStats();
    expect(stats.commissionRate).toBe(0.3);
    expect(stats.referralCode).toBeDefined();
    expect(stats.recentCommissions.length).toBeGreaterThan(0);
  });

  it('records referral purchase and adds 30% commission to pending earnings', () => {
    const beforeStats = affiliate.getStats();
    const initialPending = beforeStats.pendingEarningsTHB;

    affiliate.recordReferralPurchase('newtrader@gmail.com', 'Pro Monthly', 490);
    const afterStats = affiliate.getStats();

    // 490 * 0.3 = 147
    expect(afterStats.pendingEarningsTHB).toBeCloseTo(initialPending + 147, 1);
    expect(afterStats.totalReferrals).toBe(beforeStats.totalReferrals + 1);
  });

  it('handles payout request with minimum ฿500 threshold', () => {
    const stats = affiliate.getStats();
    expect(stats.pendingEarningsTHB).toBeGreaterThanOrEqual(500);

    const res = affiliate.requestPayout();
    expect(res.success).toBe(true);
    expect(res.amountTHB).toBeGreaterThanOrEqual(500);

    const updated = affiliate.getStats();
    expect(updated.pendingEarningsTHB).toBe(0);
    expect(updated.paidEarningsTHB).toBeGreaterThan(0);

    // Second request immediately should be rejected due to ฿0 pending
    const secondReq = affiliate.requestPayout();
    expect(secondReq.success).toBe(false);
  });

  it('generates valid referral link', () => {
    const url = affiliate.getReferralUrl();
    expect(url).toContain('?ref=');
  });
});
