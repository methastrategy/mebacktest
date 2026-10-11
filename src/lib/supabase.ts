import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export interface SupabaseProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  tier: 'free' | 'day_pass' | 'week_pass' | 'pro_monthly' | 'pro_yearly' | 'lifetime';
  credit_balance: number;
  referral_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseReplaySession {
  id: string;
  user_id: string;
  title: string;
  symbol: string;
  timeframe: string;
  mode: 'normal' | 'blind' | 'prop_firm';
  initial_balance: number;
  final_equity: number;
  net_profit: number;
  win_rate: number;
  profit_factor: number;
  max_drawdown_pct: number;
  is_prop_breached: boolean;
  state_payload?: any;
  created_at: string;
}

export interface SupabaseTrade {
  id: string;
  session_id: string;
  user_id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  entry_price: number;
  exit_price: number;
  stop_loss?: number | null;
  take_profit?: number | null;
  realized_pnl: number;
  pips: number;
  close_reason: 'MANUAL' | 'SL' | 'TP' | 'BE' | 'PARTIAL';
  setup_tag?: string | null;
  notes?: string | null;
  entry_time: number;
  exit_time: number;
  created_at?: string;
}
