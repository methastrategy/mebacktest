import { CloudSessionRecord, CloudTradeRecord } from '../types/cloud';
import { AccountState, Position } from '../types/trade';
import { PropFirmState } from './PropFirmEngine';
import { Timeframe } from '../types/candle';
import { AuthService } from './AuthService';

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

    return session;
  }

  public getSessionById(sessionId: string): CloudSessionRecord | null {
    const sessions = this.getSavedSessions();
    return sessions.find((s) => s.id === sessionId || s.shareSlug === sessionId) || null;
  }

  public deleteSession(sessionId: string): boolean {
    const existing = this.getSavedSessions();
    const filtered = existing.filter((s) => s.id !== sessionId && s.shareSlug !== sessionId);
    safeSetItem(SESSIONS_STORAGE_KEY, JSON.stringify(filtered));
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
      safeSetItem(TRADES_STORAGE_KEY, JSON.stringify(updated.slice(0, 1000))); // keep up to 1000
    } catch {
      // Ignore
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
