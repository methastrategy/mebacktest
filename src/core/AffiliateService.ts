import { AuthService } from './AuthService';

export interface AffiliateStats {
  referralCode: string;
  commissionRate: number; // e.g. 0.30 (30%)
  totalClicks: number;
  totalReferrals: number;
  activeSubscribers: number;
  pendingEarningsTHB: number;
  paidEarningsTHB: number;
  recentCommissions: Array<{
    id: string;
    referredUser: string;
    plan: string;
    amountTHB: number;
    commissionTHB: number;
    date: number;
  }>;
}

const AFFILIATE_STORAGE_KEY = 'mebacktest_affiliate_stats';

const memoryStore = new Map<string, string>();

function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // Ignore
  }
  return memoryStore.get(key) || null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // Ignore
  }
  memoryStore.set(key, value);
}

export class AffiliateService {
  private static instance: AffiliateService;

  private constructor() {}

  public static getInstance(): AffiliateService {
    if (!AffiliateService.instance) {
      AffiliateService.instance = new AffiliateService();
    }
    return AffiliateService.instance;
  }

  public getStats(): AffiliateStats {
    const user = AuthService.getInstance().getCurrentUser();
    const code = user?.referralCode || 'ME-GOLD88';

    try {
      const data = safeGetItem(AFFILIATE_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Ignore
    }

    // Default stats for active partner
    const initialStats: AffiliateStats = {
      referralCode: code,
      commissionRate: 0.3,
      totalClicks: 142,
      totalReferrals: 18,
      activeSubscribers: 12,
      pendingEarningsTHB: 1764.0,
      paidEarningsTHB: 4410.0,
      recentCommissions: [
        {
          id: 'comm_01',
          referredUser: 'somchai_trader@gmail.com',
          plan: 'Pro Trader Monthly (฿490)',
          amountTHB: 490,
          commissionTHB: 147,
          date: Date.now() - 3600 * 24 * 1000 * 2,
        },
        {
          id: 'comm_02',
          referredUser: 'anupong_fx@hotmail.com',
          plan: 'Pro Trader Annual (฿4,500)',
          amountTHB: 4500,
          commissionTHB: 1350,
          date: Date.now() - 3600 * 24 * 1000 * 5,
        },
        {
          id: 'comm_03',
          referredUser: 'natthapon@yahoo.com',
          plan: 'Day Pass (฿99)',
          amountTHB: 99,
          commissionTHB: 29.7,
          date: Date.now() - 3600 * 24 * 1000 * 7,
        },
      ],
    };

    safeSetItem(AFFILIATE_STORAGE_KEY, JSON.stringify(initialStats));
    return initialStats;
  }

  public recordReferralPurchase(referredEmail: string, planName: string, amountTHB: number): void {
    const stats = this.getStats();
    const commission = Math.round(amountTHB * stats.commissionRate * 10) / 10;

    stats.totalReferrals += 1;
    stats.activeSubscribers += 1;
    stats.pendingEarningsTHB += commission;
    stats.recentCommissions.unshift({
      id: `comm_${Date.now()}`,
      referredUser: referredEmail,
      plan: planName,
      amountTHB,
      commissionTHB: commission,
      date: Date.now(),
    });

    safeSetItem(AFFILIATE_STORAGE_KEY, JSON.stringify(stats));
  }

  public requestPayout(): { success: boolean; amountTHB: number; message: string } {
    const stats = this.getStats();
    if (stats.pendingEarningsTHB < 500) {
      return {
        success: false,
        amountTHB: stats.pendingEarningsTHB,
        message: 'Minimum payout is ฿500. Keep sharing your link!',
      };
    }

    const paidOut = stats.pendingEarningsTHB;
    stats.paidEarningsTHB += paidOut;
    stats.pendingEarningsTHB = 0;
    safeSetItem(AFFILIATE_STORAGE_KEY, JSON.stringify(stats));

    return {
      success: true,
      amountTHB: paidOut,
      message: `Payout request of ฿${paidOut.toLocaleString()} submitted via PromptPay!`,
    };
  }

  public getReferralUrl(): string {
    const stats = this.getStats();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mebacktest.com';
    return `${origin}?ref=${stats.referralCode}`;
  }
}
