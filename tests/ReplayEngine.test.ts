import { describe, it, expect, beforeEach } from 'vitest';
import { ReplayEngine } from '../src/core/ReplayEngine';
import { CandleBar } from '../src/types/candle';
import { UTCTimestamp } from 'lightweight-charts';

describe('ReplayEngine', () => {
  let engine: ReplayEngine;
  let mockBars: CandleBar[];

  beforeEach(() => {
    // Generate 100 mock bars
    mockBars = Array.from({ length: 100 }, (_, i) => ({
      time: (1700000000 + i * 300) as UTCTimestamp,
      open: 2400 + i * 0.5,
      high: 2402 + i * 0.5,
      low: 2399 + i * 0.5,
      close: 2401 + i * 0.5,
      rawTimeStr: new Date((1700000000 + i * 300) * 1000).toISOString(),
    }));
    engine = new ReplayEngine();
    engine.loadDataset(mockBars, 20); // 20 initial context bars
  });

  it('initializes with context bars revealed', () => {
    const visible = engine.getVisibleBars();
    expect(visible.length).toBe(20);
    expect(engine.getCurrentCursor()).toBe(19);
    expect(engine.getCurrentBar()?.close).toBe(mockBars[19].close);
  });

  it('steps forward one bar at a time without lookahead leak', () => {
    const nextBar = engine.nextStep();
    expect(nextBar).not.toBeNull();
    expect(nextBar?.time).toBe(mockBars[20].time);
    expect(engine.getCurrentCursor()).toBe(20);
    expect(engine.getVisibleBars().length).toBe(21);
  });

  it('generates random scenario with proper context window', () => {
    const scenario = engine.triggerRandomScenario(25);
    expect(scenario).toBeDefined();
    expect(scenario.startIndex).toBeGreaterThanOrEqual(25);
    expect(scenario.startIndex).toBeLessThan(mockBars.length);
    expect(engine.getVisibleBars().length).toBe(25);
  });

  it('toggles blind mode accurately', () => {
    expect(engine.isBlindMode()).toBe(false);
    engine.toggleBlindMode();
    expect(engine.isBlindMode()).toBe(true);
  });
});
