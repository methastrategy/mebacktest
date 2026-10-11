import { describe, it, expect } from 'vitest';
import { isSupabaseConfigured, supabase } from '../src/lib/supabase';
import { AuthService } from '../src/core/AuthService';
import { CloudSessionService } from '../src/core/CloudSessionService';

describe('Supabase Integration & Configuration', () => {
  it('correctly detects configured Supabase environment parameters', () => {
    // When running with .env loaded
    expect(typeof isSupabaseConfigured).toBe('boolean');
    if (isSupabaseConfigured) {
      expect(supabase).not.toBeNull();
    }
  });

  it('AuthService initializes and supports email authentication seamlessly', () => {
    const auth = AuthService.getInstance();
    const user = auth.signInWithEmail('trader@methastrategy.com', 'Metha Gold Trader');

    expect(user.email).toBe('trader@methastrategy.com');
    expect(user.displayName).toBe('Metha Gold Trader');
    expect(auth.isAuthenticated()).toBe(true);
    expect(user.creditBalance).toBeGreaterThan(0);
  });

  it('AuthService supports Pro tier upgrades and credit operations', () => {
    const auth = AuthService.getInstance();
    auth.updateTier('pro_monthly');

    expect(auth.isPro()).toBe(true);
    // Consuming credit should return true for Pro users
    expect(auth.consumeCredit()).toBe(true);
  });

  it('CloudSessionService handles remote share URL generation', () => {
    const cloud = CloudSessionService.getInstance();
    const mockSession = {
      id: 'sess_test_123',
      userId: 'usr_metha',
      title: 'Gold Test Run',
      symbol: 'XAUUSD',
      timeframe: 'M1' as const,
      mode: 'normal' as const,
      initialBalance: 100000,
      finalEquity: 105000,
      netProfit: 5000,
      winRate: 60,
      profitFactor: 2.1,
      maxDrawdownPct: 2.5,
      isPropBreached: false,
      shareSlug: 'mb_gold_test',
      isPublic: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      accountState: {
        balance: 105000,
        equity: 105000,
        initialBalance: 100000,
        openPositions: [],
        closedPositions: [],
        peakEquity: 106000,
        maxDrawdown: 1000,
        maxDrawdownPercent: 1.0,
        winRate: 60,
        profitFactor: 2.1,
      },
      propFirmState: {
        initialBalance: 100000,
        peakEquity: 106000,
        todayStartBalance: 100000,
        maxDailyLoss: 5000,
        maxDailyLossPercent: 5.0,
        dailyLossRemaining: 5000,
        currentDailyDrawdownPct: 0,
        maxTotalLoss: 10000,
        maxTotalLossPercent: 10.0,
        totalLossRemaining: 10000,
        currentTotalDrawdownPct: 0,
        profitTarget: 8000,
        profitTargetPercent: 8.0,
        profitTargetRemaining: 3000,
        currentProfitPct: 5.0,
        status: 'ACTIVE' as const,
        breachedReason: null,
      },
      drawingsCount: 3,
    };

    const shareUrl = cloud.generateShareableUrl(mockSession);
    expect(shareUrl).toContain('?share=mb_gold_test');
  });
});
