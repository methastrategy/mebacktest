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
});
