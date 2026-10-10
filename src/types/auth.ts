export type UserTier = 'free' | 'pro_monthly' | 'pro_yearly' | 'lifetime' | 'day_pass' | 'week_pass';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  tier: UserTier;
  creditBalance: number;
  passExpiresAt?: number; // Unix timestamp for Day/Week passes
  referralCode?: string;
  referredBy?: string;
  createdAt: number;
}

export interface AuthSession {
  user: UserProfile | null;
  isAuthenticated: boolean;
  token?: string;
}

export type OAuthProvider = 'google' | 'discord' | 'github';
