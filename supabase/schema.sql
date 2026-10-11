-- ====================================================================
-- MeBacktest — Complete Production Supabase PostgreSQL Schema
-- Project: methastrategy's Project (auyzorkmduqojzdgxrxn)
-- ====================================================================

-- 1. PROFILES TABLE (Linked with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'day_pass', 'week_pass', 'pro_monthly', 'pro_yearly', 'lifetime')),
  credit_balance INTEGER NOT NULL DEFAULT 10,
  referral_code TEXT UNIQUE,
  pass_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to auto-create profile on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, tier, credit_balance, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'free',
    10,
    'MB-' || upper(substring(NEW.id::text from 1 for 6))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. REPLAY SESSIONS TABLE (Cloud Saved Runs & Shareable Links)
CREATE TABLE IF NOT EXISTS public.replay_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  symbol TEXT NOT NULL DEFAULT 'XAUUSD',
  timeframe TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('normal', 'blind', 'prop_firm')),
  initial_balance NUMERIC(14, 2) NOT NULL DEFAULT 100000.00,
  final_equity NUMERIC(14, 2) NOT NULL,
  net_profit NUMERIC(14, 2) NOT NULL,
  win_rate NUMERIC(6, 2) NOT NULL,
  profit_factor NUMERIC(8, 2) NOT NULL,
  max_drawdown_pct NUMERIC(6, 2) NOT NULL,
  is_prop_breached BOOLEAN DEFAULT FALSE,
  share_slug TEXT UNIQUE,
  is_public BOOLEAN DEFAULT TRUE,
  drawings_count INTEGER DEFAULT 0,
  account_state JSONB,
  prop_firm_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.replay_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage own replay sessions"
  ON public.replay_sessions FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can view public shared replay sessions"
  ON public.replay_sessions FOR SELECT
  USING (is_public = TRUE);

CREATE INDEX IF NOT EXISTS idx_replay_sessions_user_id ON public.replay_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_replay_sessions_share_slug ON public.replay_sessions(share_slug);


-- 3. TRADES TABLE (Trade Journal)
CREATE TABLE IF NOT EXISTS public.trades (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES public.replay_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  volume NUMERIC(8, 2) NOT NULL,
  entry_price NUMERIC(12, 4) NOT NULL,
  exit_price NUMERIC(12, 4) NOT NULL,
  stop_loss NUMERIC(12, 4),
  take_profit NUMERIC(12, 4),
  realized_pnl NUMERIC(14, 2) NOT NULL,
  pips NUMERIC(10, 1) NOT NULL,
  close_reason TEXT NOT NULL CHECK (close_reason IN ('MANUAL', 'SL', 'TP', 'BE', 'PARTIAL')),
  setup_tag TEXT,
  notes TEXT,
  entry_time BIGINT NOT NULL,
  exit_time BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own trades"
  ON public.trades FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_trades_session_id ON public.trades(session_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);


-- 4. SUBSCRIPTIONS & TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'promptpay')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'expired')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount_thb NUMERIC(10, 2) NOT NULL,
  amount_usd NUMERIC(10, 2),
  type TEXT NOT NULL CHECK (type IN ('subscription', 'topup_credits', 'day_pass', 'week_pass', 'lifetime')),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'promptpay')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  credits_awarded INTEGER DEFAULT 0,
  reference_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);
