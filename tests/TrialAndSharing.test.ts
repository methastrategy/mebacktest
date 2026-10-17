import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../src/core/AuthService';
import { CloudSessionService } from '../src/core/CloudSessionService';

const storageMap = new Map<string, string>();
if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) || null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
    clear: () => storageMap.clear(),
  };
}

describe('Phase 2: 7-Day Trial System & Public Replay Sharing', () => {
  beforeEach(() => {
    (globalThis as any).localStorage.clear();
    // Reset currentUser to clean state
    AuthService.getInstance().signOut();
  });

  it('correctly sets trialEndsAt to 7 days from creation for new users', () => {
    const auth = AuthService.getInstance();
    const now = Date.now();
    const user = auth.signInWithEmail('newtrader@example.com', 'Newbie Trader');

    expect(user.trialEndsAt).toBeDefined();
    expect(user.trialEndsAt!).toBeGreaterThan(now);
    // Should be approximately 7 days from now (within 5 seconds tolerance)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(Math.abs(user.trialEndsAt! - (now + sevenDaysMs))).toBeLessThan(5000);
  });

  it('grants full Pro status to users currently in 7-day trial', () => {
    const auth = AuthService.getInstance();
    const user = auth.signInWithEmail('test_trial@example.com', 'Trial Tester');
    user.tier = 'free'; // base tier is free

    expect(auth.isInTrial()).toBe(true);
    expect(auth.getTrialRemainingDays()).toBe(7);
    expect(auth.isPro()).toBe(true);
  });

  it('revokes Pro status when 7-day trial expires unless upgraded', () => {
    const auth = AuthService.getInstance();
    const user = auth.signInWithEmail('expired_trial@example.com', 'Expired Tester');
    user.tier = 'free';
    // Artificially expire the trial
    user.trialEndsAt = Date.now() - 1000;

    expect(auth.isInTrial()).toBe(false);
    expect(auth.getTrialRemainingDays()).toBe(0);
    expect(auth.isPro()).toBe(false);

    // If upgraded to pro_monthly, isPro returns true even if trial expired
    auth.updateTier('pro_monthly');
    expect(auth.isPro()).toBe(true);
  });

  it('identifies unauthenticated or guest visitors to enforce Landing Page gate', () => {
    const auth = AuthService.getInstance();
    auth.signOut();
    expect(auth.isGuestUser()).toBe(true);

    auth.signInWithEmail('member@example.com');
    expect(auth.isGuestUser()).toBe(false);
  });

  it('CloudSessionService resolves public shared sessions by slug for inspector replay', () => {
    const cloud = CloudSessionService.getInstance();
    const saved = cloud.saveSession({
      title: 'XAUUSD Replay Gold Run',
      symbol: 'XAUUSD',
      timeframe: 'M15',
      mode: 'normal',
      accountState: {
        balance: 105000,
        equity: 105000,
        initialBalance: 100000,
        openPositions: [],
        closedPositions: [],
        peakEquity: 106000,
        maxDrawdownPercent: 1.5,
        winRate: 75,
        profitFactor: 2.5,
        realizedPnL: 5000,
        unrealizedPnL: 0,
        history: [],
      },
      propFirmState: {
        currentBalance: 105000,
        currentEquity: 105000,
        dailyStartingEquity: 100000,
        highWaterMark: 106000,
        dailyDrawdownPct: 0,
        maxDrawdownPct: 1.5,
        profitTargetPct: 5.0,
        status: 'PASSED',
        tradingDaysCount: 5,
        initialBalance: 100000,
      },
    });

    expect(saved.shareSlug).toBeDefined();
    // Resolve by shareSlug
    const found = cloud.getSessionById(saved.shareSlug!);
    expect(found).not.toBeNull();
    expect(found?.title).toBe('XAUUSD Replay Gold Run');
    expect(found?.winRate).toBe(75);
  });
});
