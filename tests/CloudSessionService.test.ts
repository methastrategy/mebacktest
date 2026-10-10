import { describe, it, expect, beforeEach } from 'vitest';
import { CloudSessionService } from '../src/core/CloudSessionService';
import { GoldTradingEngine } from '../src/core/GoldTradingEngine';
import { PropFirmEngine } from '../src/core/PropFirmEngine';

const storageMap = new Map<string, string>();
if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) || null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
    clear: () => storageMap.clear(),
  };
}

describe('CloudSessionService', () => {
  let cloudService: CloudSessionService;

  beforeEach(() => {
    (globalThis as any).localStorage.clear();
    cloudService = CloudSessionService.getInstance();
  });

  it('saves and retrieves cloud replay sessions', () => {
    const trader = new GoldTradingEngine(10000);
    const prop = new PropFirmEngine({ initialBalance: 10000 });

    const session = cloudService.saveSession({
      title: 'XAUUSD Scalp Strategy Test',
      symbol: 'XAUUSD',
      timeframe: 'M15',
      mode: 'normal',
      accountState: trader.getState(),
      propFirmState: prop.getStatus(),
    });

    expect(session.id.startsWith('sess_')).toBe(true);
    expect(session.title).toBe('XAUUSD Scalp Strategy Test');

    const sessions = cloudService.getSavedSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0].id).toBe(session.id);
  });

  it('generates unique shareable URL', () => {
    const trader = new GoldTradingEngine(10000);
    const prop = new PropFirmEngine({ initialBalance: 10000 });

    const session = cloudService.saveSession({
      title: 'Share Test',
      symbol: 'EURUSD',
      timeframe: 'H1',
      mode: 'prop_firm',
      accountState: trader.getState(),
      propFirmState: prop.getStatus(),
    });

    const url = cloudService.generateShareableUrl(session);
    expect(url).toContain(`?share=${session.shareSlug}`);
  });

  it('deletes session correctly', () => {
    const trader = new GoldTradingEngine(10000);
    const prop = new PropFirmEngine({ initialBalance: 10000 });

    const s1 = cloudService.saveSession({
      title: 'To Delete',
      symbol: 'XAUUSD',
      timeframe: 'M1',
      mode: 'normal',
      accountState: trader.getState(),
      propFirmState: prop.getStatus(),
    });

    expect(cloudService.getSavedSessions().length).toBe(1);
    const deleted = cloudService.deleteSession(s1.id);
    expect(deleted).toBe(true);
    expect(cloudService.getSavedSessions().length).toBe(0);
  });

  it('syncs multi-asset trades with correct symbols into cloud trades storage', () => {
    const mockPositions: any[] = [
      {
        id: 'pos_1',
        symbol: 'BTCUSD',
        type: 'BUY',
        volume: 0.1,
        entryPrice: 65000,
        currentPrice: 66000,
        realizedPnL: 100,
        pips: 1000,
        entryTime: 1700000000,
      },
      {
        id: 'pos_2',
        symbol: 'EURUSD',
        type: 'SELL',
        volume: 1.0,
        entryPrice: 1.08500,
        currentPrice: 1.08400,
        realizedPnL: 100,
        pips: 10,
        entryTime: 1700000050,
      },
    ];

    const count = cloudService.syncLocalTradesToCloud(mockPositions, 'sess_multi_123', 'XAUUSD');
    expect(count).toBe(2);

    const trades = cloudService.getAllCloudTrades();
    expect(trades.length).toBe(2);
    expect(trades.find((t) => t.id === 'pos_1')?.symbol).toBe('BTCUSD');
    expect(trades.find((t) => t.id === 'pos_2')?.symbol).toBe('EURUSD');
  });
});

