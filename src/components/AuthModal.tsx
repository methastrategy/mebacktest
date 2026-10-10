import React, { useState } from 'react';
import { X, Mail, Shield, LogOut, Sparkles } from 'lucide-react';
import { AuthService } from '../core/AuthService';
import { UserProfile, OAuthProvider } from '../types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChanged: (user: UserProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}) => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const authService = AuthService.getInstance();

  if (!isOpen) return null;

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const user = authService.signInWithEmail(email.trim(), displayName.trim() || undefined);
    onUserChanged(user);
    onClose();
  };

  const handleOAuthSignIn = (provider: OAuthProvider) => {
    const user = authService.signInWithOAuth(provider);
    onUserChanged(user);
    onClose();
  };

  const handleSignOut = () => {
    authService.signOut();
    onUserChanged(null);
    onClose();
  };

  const handleQuickSwitch = (tier: 'free' | 'pro_monthly') => {
    if (tier === 'pro_monthly') {
      const user = authService.signInWithEmail('pro_hunter@mebacktest.com', 'Elite Prop Hunter');
      user.tier = 'pro_monthly';
      authService.updateTier('pro_monthly');
      onUserChanged(user);
    } else {
      const user = authService.signInWithEmail('trader_free@mebacktest.com', 'Gold Scalper (Free)');
      user.tier = 'free';
      authService.updateTier('free');
      onUserChanged(user);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0d111a] border border-tv-border rounded-2xl shadow-2xl overflow-hidden p-6 text-tv-text">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-tv-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black text-sm shadow-md">
              MB
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Trader Account & Cloud Sync</h2>
              <p className="text-xs text-tv-muted">Sign in to sync your journals across all devices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-tv-muted hover:text-white hover:bg-tv-border/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current User Card if Logged In */}
        {currentUser && (
          <div className="mt-4 p-3.5 rounded-xl bg-tv-surface/80 border border-tv-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tv-blue/20 border border-tv-blue/30 flex items-center justify-center text-tv-blue font-bold text-sm">
                {currentUser.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{currentUser.displayName}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      currentUser.tier.includes('pro')
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-tv-muted/20 text-tv-muted'
                    }`}
                  >
                    {currentUser.tier}
                  </span>
                </div>
                <p className="text-xs text-tv-muted">{currentUser.email}</p>
                <p className="text-[11px] text-tv-text/70 mt-0.5">
                  Credits: <strong className="text-amber-400">{currentUser.creditBalance}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 text-tv-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            onClick={() => handleOAuthSignIn('google')}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-semibold text-xs shadow-md transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuthSignIn('discord')}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold text-xs shadow-md transition-all active:scale-[0.98]"
          >
            <Shield size={16} />
            Continue with Discord (Trader Guild)
          </button>
        </div>

        {/* Separator */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-tv-border"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#0d111a] px-2 text-tv-muted">Or sign in with email</span>
          </div>
        </div>

        {/* Email Sign In Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-tv-text mb-1">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-3 text-tv-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                required
                className="w-full bg-tv-bg border border-tv-border focus:border-tv-blue rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-tv-muted focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-tv-text mb-1">
              Trader Nickname <span className="text-tv-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. GoldSniper99"
              className="w-full bg-tv-bg border border-tv-border focus:border-tv-blue rounded-xl px-3 py-2 text-xs text-white placeholder-tv-muted focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-tv-blue hover:bg-blue-600 text-white font-semibold text-xs transition-colors shadow-md"
          >
            Sign In / Register
          </button>
        </form>

        {/* Quick Demo Mode Switcher */}
        <div className="mt-5 pt-4 border-t border-tv-border/60">
          <p className="text-[11px] text-tv-muted mb-2 font-medium flex items-center gap-1">
            <Sparkles size={12} className="text-amber-400" />
            Quick Test Switcher (Instant Sandbox Role):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSwitch('free')}
              className="px-2.5 py-1.5 rounded-lg bg-tv-surface hover:bg-tv-border border border-tv-border text-[11px] font-medium text-tv-text transition-colors text-left"
            >
              Test as <strong>Free User</strong>
              <span className="block text-[10px] text-tv-muted">M15 only, Watermark</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickSwitch('pro_monthly')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-medium text-amber-300 transition-colors text-left"
            >
              Test as <strong>Pro Trader</strong>
              <span className="block text-[10px] text-amber-400/80">M1, FTMO, Multi-Asset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
