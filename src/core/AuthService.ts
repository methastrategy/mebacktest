import { UserProfile, UserTier, OAuthProvider } from '../types/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY = 'mebacktest_auth_user';

export type AuthListener = (user: UserProfile | null) => void;

export class AuthService {
  private static instance: AuthService;
  private currentUser: UserProfile | null = null;
  private listeners: Set<AuthListener> = new Set();
  private isSupabaseInitialized: boolean = false;

  private constructor() {
    this.loadFromStorage();
    this.initSupabaseListener();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private initSupabaseListener(): void {
    if (this.isSupabaseInitialized || !isSupabaseConfigured || !supabase) return;
    this.isSupabaseInitialized = true;

    try {
      // Check current Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          this.syncSupabaseUser(session.user);
        }
      });

      // Listen to auth state transitions
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          this.syncSupabaseUser(session.user);
        } else {
          // If signed out on Supabase and current user was a Supabase user, reset
          if (this.currentUser && this.currentUser.id.includes('-')) {
            this.currentUser = null;
            this.saveToStorage();
          }
        }
      });
    } catch (err) {
      console.warn('Supabase auth listener initialization error:', err);
    }
  }

  private async syncSupabaseUser(user: any): Promise<void> {
    if (!supabase) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const email = user.email || 'trader@mebacktest.com';
      const displayName =
        profile?.display_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.display_name ||
        email.split('@')[0];

      const tier: UserTier = profile?.tier || 'free';
      const creditBalance = profile?.credit_balance ?? 10;
      const referralCode = profile?.referral_code || `MB-${user.id.substring(0, 6).toUpperCase()}`;

      this.currentUser = {
        id: user.id,
        email,
        displayName,
        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url,
        tier,
        creditBalance,
        referralCode,
        passExpiresAt: profile?.pass_expires_at ? new Date(profile.pass_expires_at).getTime() : undefined,
        trialEndsAt: new Date(user.created_at || Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000,
        createdAt: new Date(user.created_at || Date.now()).getTime(),
      };

      this.saveToStorage();
    } catch (err) {
      console.warn('Error syncing Supabase user profile:', err);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (data) {
        this.currentUser = JSON.parse(data);
      } else {
        this.currentUser = null;
      }
    } catch {
      this.currentUser = null;
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        if (this.currentUser) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentUser));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
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
    return this.currentUser !== null && !this.isGuestUser();
  }

  public isGuestUser(): boolean {
    return !this.currentUser || this.currentUser.id === 'guest_trader_01' || this.currentUser.id.startsWith('guest_');
  }

  public isInTrial(): boolean {
    if (!this.currentUser) return false;
    const { tier, trialEndsAt } = this.currentUser;
    if (tier === 'pro_monthly' || tier === 'pro_yearly' || tier === 'lifetime') return false;
    return Boolean(trialEndsAt && trialEndsAt > Date.now());
  }

  public getTrialRemainingDays(): number {
    if (!this.currentUser || !this.currentUser.trialEndsAt) return 0;
    const diffMs = this.currentUser.trialEndsAt - Date.now();
    return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
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
    if (this.isInTrial()) {
      return true;
    }
    return false;
  }

  // --- Real Supabase Cloud Auth Methods ---

  public async signInWithSupabaseEmail(email: string, password: string): Promise<{ error: Error | null; user?: UserProfile }> {
    if (!isSupabaseConfigured || !supabase) {
      // Fallback to local sign in
      const u = this.signInWithEmail(email);
      return { error: null, user: u };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      await this.syncSupabaseUser(data.user);
    }

    return { error: null, user: this.currentUser || undefined };
  }

  public async signUpWithSupabaseEmail(
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ error: Error | null; user?: UserProfile }> {
    if (!isSupabaseConfigured || !supabase) {
      const u = this.signInWithEmail(email, displayName);
      return { error: null, user: u };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      await this.syncSupabaseUser(data.user);
    }

    return { error: null, user: this.currentUser || undefined };
  }

  public async signInWithSupabaseMagicLink(email: string): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured || !supabase) {
      this.signInWithEmail(email);
      return { error: null };
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mebacktest.com';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: origin,
      },
    });

    return { error };
  }

  public async signInWithSupabaseOAuth(provider: 'google' | 'discord' | 'github'): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured || !supabase) {
      this.signInWithOAuth(provider === 'github' ? 'google' : provider);
      return { error: null };
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mebacktest.com';
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: origin,
      },
    });

    return { error };
  }

  // --- Local / Testing Synchronous Helpers ---

  public signInWithEmail(email: string, displayName?: string): UserProfile {
    const isProEmail = email.toLowerCase().includes('pro') || email.toLowerCase().includes('ftmo');
    const now = Date.now();
    const user: UserProfile = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      email,
      displayName: displayName || email.split('@')[0],
      tier: isProEmail ? 'pro_monthly' : 'free',
      creditBalance: isProEmail ? 9999 : 10,
      trialEndsAt: now + 7 * 24 * 60 * 60 * 1000,
      referralCode: `REF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      createdAt: now,
    };
    this.currentUser = user;
    this.saveToStorage();
    return user;
  }

  public signInWithOAuth(provider: OAuthProvider): UserProfile {
    const now = Date.now();
    const user: UserProfile = {
      id: `${provider}_${Math.random().toString(36).substring(2, 9)}`,
      email: `${provider}_trader@mebacktest.com`,
      displayName: `${provider.toUpperCase()} Trader`,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${provider}`,
      tier: 'free',
      creditBalance: 100,
      trialEndsAt: now + 7 * 24 * 60 * 60 * 1000,
      referralCode: `VIP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      createdAt: now,
    };
    this.currentUser = user;
    this.saveToStorage();
    return user;
  }

  public signOut(): void {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
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

    // Sync to Supabase profile if connected
    if (isSupabaseConfigured && supabase && this.currentUser.id.includes('-')) {
      supabase
        .from('profiles')
        .update({
          tier,
          pass_expires_at: this.currentUser.passExpiresAt ? new Date(this.currentUser.passExpiresAt).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.currentUser.id)
        .then();
    }
  }

  public consumeCredit(): boolean {
    if (!this.currentUser) return false;
    if (this.isPro()) return true;
    if (this.currentUser.creditBalance > 0) {
      this.currentUser.creditBalance -= 1;
      this.saveToStorage();

      if (isSupabaseConfigured && supabase && this.currentUser.id.includes('-')) {
        supabase
          .from('profiles')
          .update({
            credit_balance: this.currentUser.creditBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', this.currentUser.id)
          .then();
      }
      return true;
    }
    return false;
  }

  public addCredits(amount: number): void {
    if (!this.currentUser) return;
    this.currentUser.creditBalance += amount;
    this.saveToStorage();

    if (isSupabaseConfigured && supabase && this.currentUser.id.includes('-')) {
      supabase
        .from('profiles')
        .update({
          credit_balance: this.currentUser.creditBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.currentUser.id)
        .then();
    }
  }
}
