import { CloudSessionRecord, CloudTradeRecord } from '../types/cloud';
import { AccountState, Position } from '../types/trade';
import { PropFirmState } from './PropFirmEngine';
import { Timeframe } from '../types/candle';
import { AuthService } from './AuthService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const SESSIONS_STORAGE_KEY = 'mebacktest_cloud_sessions';
const TRADES_STORAGE_KEY = 'mebacktest_cloud_trades';

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

export class CloudSessionService {
  private static instance: CloudSessionService;

  private constructor() {}

  public static getInstance(): CloudSessionService {
    if (!CloudSessionService.instance) {
      CloudSessionService.instance = new CloudSessionService();
    }
    return CloudSessionService.instance;
  }

  public getSavedSessions(): CloudSessionRecord[] {
    try {
      const data = safeGetItem(SESSIONS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public async fetchRemoteSessions(): Promise<CloudSessionRecord[]> {
    const local = this.getSavedSessions();
    if (!isSupabaseConfigured || !supabase) return local;

    try {
      const user = AuthService.getInstance().getCurrentUser();
      if (!user || !user.id || !user.id.includes('-')) return local;

      const { data, error } = await supabase
        .from('replay_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !data) return local;

      const remoteSessions: CloudSessionRecord[] = data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        symbol: row.symbol,
        timeframe: row.timeframe as Timeframe,
        mode: row.mode,
        initialBalance: Number(row.initial_balance),
        finalEquity: Number(row.final_equity),
        netProfit: Number(row.net_profit),
        winRate: Number(row.win_rate),
        profitFactor: Number(row.profit_factor),
        maxDrawdownPct: Number(row.max_drawdown_pct),
        isPropBreached: Boolean(row.is_prop_breached),
        shareSlug: row.share_slug,
        isPublic: Boolean(row.is_public),
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at || row.created_at).getTime(),
        accountState: row.account_state,
        propFirmState: row.prop_firm_state,
        drawingsCount: row.drawings_count || 0,
      }));

      // Merge remote and local (remote takes precedence)
      const mergedMap = new Map<string, CloudSessionRecord>();
      for (const s of local) mergedMap.set(s.id, s);
      for (const s of remoteSessions) mergedMap.set(s.id, s);

      const merged = Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      safeSetItem(SESSIONS_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch (err) {
      console.warn('Error fetching remote sessions:', err);
      return local;
    }
  }

  public saveSession(params: {
    title: string;
    symbol: string;
    timeframe: Timeframe;
    mode: 'normal' | 'blind' | 'prop_firm';
    accountState: AccountState;
    propFirmState: PropFirmState;
    drawingsCount?: number;
    isPublic?: boolean;
  }): CloudSessionRecord {
    const user = AuthService.getInstance().getCurrentUser();
    const userId = user ? user.id : 'guest_trader';

    const netProfit = params.accountState.balance - params.accountState.initialBalance;
    const shareSlug = `mb_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`;

    const session: CloudSessionRecord = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      title: params.title || `${params.symbol} ${params.timeframe} Replay Session`,
      symbol: params.symbol,
      timeframe: params.timeframe,
      mode: params.mode,
      initialBalance: params.accountState.initialBalance,
      finalEquity: params.accountState.equity,
      netProfit,
      winRate: params.accountState.winRate,
      profitFactor: params.accountState.profitFactor,
      maxDrawdownPct: params.accountState.maxDrawdownPercent,
      isPropBreached:
        params.propFirmState.status === 'BREACHED_DAILY' ||
        params.propFirmState.status === 'BREACHED_TOTAL',
      shareSlug,
      isPublic: params.isPublic ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      accountState: params.accountState,
      propFirmState: params.propFirmState,
      drawingsCount: params.drawingsCount || 0,
    };

    const existing = this.getSavedSessions();
    const updated = [session, ...existing.filter((s) => s.id !== session.id)];
    safeSetItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));

    // Also sync closed positions as individual trades
    this.syncLocalTradesToCloud(params.accountState.closedPositions, session.id, params.symbol);

    // Sync to Supabase in background
    if (isSupabaseConfigured && supabase) {
      const isUuid = userId.length === 36 && userId.includes('-');
      supabase
        .from('replay_sessions')
        .upsert({
          id: session.id,
          user_id: isUuid ? userId : null,
          title: session.title,
          symbol: session.symbol,
          timeframe: session.timeframe,
          mode: session.mode,
          initial_balance: session.initialBalance,
          final_equity: session.finalEquity,
          net_profit: session.netProfit,
          win_rate: session.winRate,
          profit_factor: session.profitFactor,
          max_drawdown_pct: session.maxDrawdownPct,
          is_prop_breached: session.isPropBreached,
          share_slug: session.shareSlug,
          is_public: session.isPublic,
          drawings_count: session.drawingsCount,
          account_state: session.accountState,
          prop_firm_state: session.propFirmState,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.warn('Supabase session sync notice:', error.message);
        });
    }

    return session;
  }

  public getSessionById(sessionId: string): CloudSessionRecord | null {
    const sessions = this.getSavedSessions();
    return sessions.find((s) => s.id === sessionId || s.shareSlug === sessionId) || null;
  }

  public async fetchRemoteSessionBySlug(slug: string): Promise<CloudSessionRecord | null> {
    const local = this.getSessionById(slug);
    if (local) return local;

    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('replay_sessions')
        .select('*')
        .or(`id.eq.${slug},share_slug.eq.${slug}`)
        .single();

      if (error || !data) return null;

      const session: CloudSessionRecord = {
        id: data.id,
        userId: data.user_id || 'remote_trader',
        title: data.title,
        symbol: data.symbol,
        timeframe: data.timeframe as Timeframe,
        mode: data.mode,
        initialBalance: Number(data.initial_balance),
        finalEquity: Number(data.final_equity),
        netProfit: Number(data.net_profit),
        winRate: Number(data.win_rate),
        profitFactor: Number(data.profit_factor),
        maxDrawdownPct: Number(data.max_drawdown_pct),
        isPropBreached: Boolean(data.is_prop_breached),
        shareSlug: data.share_slug,
        isPublic: Boolean(data.is_public),
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at || data.created_at).getTime(),
        accountState: data.account_state,
        propFirmState: data.prop_firm_state,
        drawingsCount: data.drawings_count || 0,
      };

      // Save to local cache so next lookup is instant
      const existing = this.getSavedSessions();
      if (!existing.some((s) => s.id === session.id)) {
        safeSetItem(SESSIONS_STORAGE_KEY, JSON.stringify([session, ...existing]));
      }

      return session;
    } catch {
      return null;
    }
  }

  public deleteSession(sessionId: string): boolean {
    const existing = this.getSavedSessions();
    const filtered = existing.filter((s) => s.id !== sessionId && s.shareSlug !== sessionId);
    safeSetItem(SESSIONS_STORAGE_KEY, JSON.stringify(filtered));

    if (isSupabaseConfigured && supabase) {
      supabase.from('replay_sessions').delete().eq('id', sessionId).then();
    }

    return filtered.length < existing.length;
  }

  public generateShareableUrl(session: CloudSessionRecord): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mebacktest.com';
    return `${origin}?share=${session.shareSlug}`;
  }

  public syncLocalTradesToCloud(
    positions: Position[],
    sessionId: string,
    defaultSymbol: string = 'XAUUSD'
  ): number {
    const user = AuthService.getInstance().getCurrentUser();
    const userId = user ? user.id : 'guest_trader';

    const records: CloudTradeRecord[] = positions.map((p) => ({
      id: p.id,
      sessionId,
      userId,
      symbol: p.symbol || defaultSymbol,
      type: p.type,
      volume: p.volume,
      entryPrice: p.entryPrice,
      exitPrice: p.exitPrice ?? p.currentPrice,
      stopLoss: p.stopLoss,
      takeProfit: p.takeProfit,
      realizedPnL: p.realizedPnL ?? 0,
      pips: p.pips,
      closeReason: p.closeReason || 'MANUAL',
      setupTag: p.setupTag,
      entryTime: p.entryTime,
      exitTime: p.exitTime ?? p.entryTime,
      createdAt: Date.now(),
    }));

    try {
      const existingRaw = safeGetItem(TRADES_STORAGE_KEY);
      const existing: CloudTradeRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [...records, ...existing.filter((e) => !records.some((r) => r.id === e.id))];
      safeSetItem(TRADES_STORAGE_KEY, JSON.stringify(updated.slice(0, 1000)));
    } catch {
      // Ignore
    }

    // Sync to Supabase in background
    if (isSupabaseConfigured && supabase && records.length > 0) {
      const isUuid = userId.length === 36 && userId.includes('-');
      const rows = records.map((r) => ({
        id: r.id,
        session_id: r.sessionId,
        user_id: isUuid ? userId : null,
        symbol: r.symbol,
        type: r.type,
        volume: r.volume,
        entry_price: r.entryPrice,
        exit_price: r.exitPrice,
        stop_loss: r.stopLoss ?? null,
        take_profit: r.takeProfit ?? null,
        realized_pnl: r.realizedPnL,
        pips: r.pips,
        close_reason: r.closeReason,
        setup_tag: r.setupTag ?? null,
        entry_time: r.entryTime,
        exit_time: r.exitTime,
      }));

      supabase
        .from('trades')
        .upsert(rows)
        .then(({ error }) => {
          if (error) console.warn('Supabase trades sync notice:', error.message);
        });
    }

    return records.length;
  }

  public getAllCloudTrades(): CloudTradeRecord[] {
    try {
      const data = safeGetItem(TRADES_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
