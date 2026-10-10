-- MeBacktest Commercial SaaS Database Schema
-- Supabase PostgreSQL + Row-Level Security (RLS)

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro_monthly', 'pro_yearly', 'lifetime', 'day_pass', 'week_pass')),
  credit_balance INTEGER NOT NULL DEFAULT 10,
  pass_expires_at TIMESTAMPTZ,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'promptpay_pass', 'crypto')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'expired')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Transactions Table (Stripe & PromptPay top-ups)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_thb NUMERIC(10, 2) NOT NULL,
  amount_usd NUMERIC(10, 2),
  type TEXT NOT NULL CHECK (type IN ('subscription', 'topup_credits', 'day_pass', 'week_pass')),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'promptpay', 'gbprimepay', 'omise')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  credits_awarded INTEGER DEFAULT 0,
  reference_id TEXT UNIQUE,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Replay Sessions Table (Cloud Save & Shareable Replay Link)
CREATE TABLE IF NOT EXISTS public.replay_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  symbol TEXT NOT NULL DEFAULT 'XAUUSD',
  timeframe TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('normal', 'blind', 'prop_firm')),
  initial_balance NUMERIC(12, 2) NOT NULL DEFAULT 10000.00,
  final_equity NUMERIC(12, 2) NOT NULL,
  net_profit NUMERIC(12, 2) NOT NULL,
  win_rate NUMERIC(5, 2) NOT NULL,
  profit_factor NUMERIC(6, 2) NOT NULL,
  max_drawdown_pct NUMERIC(5, 2) NOT NULL,
  is_prop_breached BOOLEAN DEFAULT FALSE,
  share_slug TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE public.replay_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions"
  ON public.replay_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public sessions readable by anyone"
  ON public.replay_sessions FOR SELECT
  USING (is_public = TRUE);

-- 5. Trades Table (Cloud Trade Journal)
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.replay_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  volume NUMERIC(6, 2) NOT NULL,
  entry_price NUMERIC(10, 3) NOT NULL,
  exit_price NUMERIC(10, 3) NOT NULL,
  stop_loss NUMERIC(10, 3),
  take_profit NUMERIC(10, 3),
  realized_pnl NUMERIC(12, 2) NOT NULL,
  pips NUMERIC(8, 1) NOT NULL,
  close_reason TEXT NOT NULL CHECK (close_reason IN ('MANUAL', 'SL', 'TP', 'BE', 'PARTIAL')),
  setup_tag TEXT,
  notes TEXT,
  entry_time BIGINT NOT NULL,
  exit_time BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own trades"
  ON public.trades FOR ALL
  USING (auth.uid() = user_id);

-- 6. Affiliates & Referrals Table
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC(4, 2) NOT NULL DEFAULT 0.30, -- 30% rev share
  total_referrals INTEGER NOT NULL DEFAULT 0,
  pending_earnings_thb NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  paid_earnings_thb NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate account"
  ON public.affiliates FOR SELECT
  USING (auth.uid() = user_id);

-- 7. Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_session_id ON public.trades(session_id);
CREATE INDEX IF NOT EXISTS idx_replay_sessions_share_slug ON public.replay_sessions(share_slug);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
