import { describe, it, expect } from 'vitest';
import { calculateEMA, calculateNextEMA } from '../src/core/indicators';
import { CandleBar } from '../src/types/candle';
import { UTCTimestamp } from 'lightweight-charts';

describe('indicators - EMA', () => {
  it('returns empty array on empty input or invalid period', () => {
    expect(calculateEMA([], 20)).toEqual([]);
    const dummyBar: CandleBar = {
      time: 1000 as UTCTimestamp,
      open: 10,
      high: 12,
      low: 9,
      close: 11,
    };
    expect(calculateEMA([dummyBar], 0)).toEqual([]);
  });

  it('calculates EMA accurately over a series', () => {
    const prices = [100, 102, 104, 103, 105];
    const bars: CandleBar[] = prices.map((p, idx) => ({
      time: (1000 + idx * 60) as UTCTimestamp,
      open: p,
      high: p + 1,
      low: p - 1,
      close: p,
    }));

    // Period 3: k = 2 / (3 + 1) = 0.5
    // Bar 0: EMA = 100
    // Bar 1: EMA = 102 * 0.5 + 100 * 0.5 = 101
    // Bar 2: EMA = 104 * 0.5 + 101 * 0.5 = 102.5
    // Bar 3: EMA = 103 * 0.5 + 102.5 * 0.5 = 102.75
    // Bar 4: EMA = 105 * 0.5 + 102.75 * 0.5 = 103.875
    const emaSeries = calculateEMA(bars, 3);
    expect(emaSeries.length).toBe(5);
    expect(emaSeries[0].value).toBe(100);
    expect(emaSeries[1].value).toBe(101);
    expect(emaSeries[2].value).toBe(102.5);
    expect(emaSeries[3].value).toBe(102.75);
    expect(emaSeries[4].value).toBe(103.875);
  });

  it('calculates next EMA incrementally matching full series', () => {
    const kPeriod = 20;
    const prevEma = 2400.0;
    const currentClose = 2410.0;
    const k = 2 / (20 + 1);
    const expected = Number((currentClose * k + prevEma * (1 - k)).toFixed(3));

    const nextVal = calculateNextEMA(currentClose, prevEma, kPeriod);
    expect(nextVal).toBe(expected);
  });
});
