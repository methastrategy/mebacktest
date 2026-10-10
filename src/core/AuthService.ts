import { UserProfile, UserTier, OAuthProvider } from '../types/auth';

const STORAGE_KEY = 'mebacktest_auth_user';

export type AuthListener = (user: UserProfile | null) => void;

export class AuthService {
  private static instance: AuthService;
  private currentUser: UserProfile | null = null;
  private listeners: Set<AuthListener> = new Set();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.currentUser = JSON.parse(data);
      } else {
        // Default guest user with free tier & 10 initial credits
        this.currentUser = {
          id: 'guest_trader_01',
          email: 'trader@mebacktest.com',
          displayName: 'Gold Scalper (Free)',
          tier: 'free',
          creditBalance: 10,
          referralCode: 'GOLD77',
          createdAt: Date.now(),
        };
        this.saveToStorage();
      }
    } catch {
      this.currentUser = null;
    }
  }

  private saveToStorage(): void {
    try {
      if (this.currentUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore localStorage errors (e.g. incognito/test env)
    }
    this.notifyListeners();
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public isPro(): boolean {
    if (!this.currentUser) return false;
    const { tier, passExpiresAt } = this.currentUser;
    if (tier === 'pro_monthly' || tier === 'pro_yearly' || tier === 'lifetime') {
      return true;
    }
    if ((tier === 'day_pass' || tier === 'week_pass') && passExpiresAt && passExpiresAt > Date.now()) {
      return true;
    }
    return false;
  }

  public signInWithEmail(email: string, displayName?: string): UserProfile {
    const isProEmail = email.toLowerCase().includes('pro') || email.toLowerCase().includes('ftmo');
    const user: UserProfile = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      email,
      displayName: displayName || email.split('@')[0],
      tier: isProEmail ? 'pro_monthly' : 'free',
      creditBalance: isProEmail ? 9999 : 10,
      referralCode: `REF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      createdAt: Date.now(),
    };
    this.currentUser = user;
    this.saveToStorage();
    return user;
  }

  public signInWithOAuth(provider: OAuthProvider): UserProfile {
    const user: UserProfile = {
      id: `${provider}_${Math.random().toString(36).substring(2, 9)}`,
      email: `${provider}_trader@mebacktest.com`,
      displayName: `${provider.toUpperCase()} Trader`,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${provider}`,
      tier: 'pro_monthly', // OAuth users get complimentary pro monthly trial
      creditBalance: 100,
      referralCode: `VIP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      createdAt: Date.now(),
    };
    this.currentUser = user;
    this.saveToStorage();
    return user;
  }

  public signOut(): void {
    this.currentUser = null;
    this.saveToStorage();
  }

  public updateTier(tier: UserTier, durationHours?: number): void {
    if (!this.currentUser) return;
    this.currentUser.tier = tier;
    if (durationHours) {
      this.currentUser.passExpiresAt = Date.now() + durationHours * 3600 * 1000;
    }
    this.saveToStorage();
  }

  public consumeCredit(): boolean {
    if (!this.currentUser) return false;
    if (this.isPro()) return true; // Pro users have unlimited credits
    if (this.currentUser.creditBalance > 0) {
      this.currentUser.creditBalance -= 1;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public addCredits(amount: number): void {
    if (!this.currentUser) return;
    this.currentUser.creditBalance += amount;
    this.saveToStorage();
  }
}
