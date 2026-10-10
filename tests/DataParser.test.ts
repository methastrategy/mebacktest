import { describe, it, expect } from 'vitest';
import { parseCandleCsv } from '../src/core/DataParser';

describe('DataParser', () => {
  it('parses MT5 format CSV correctly and sorts ascending by time', () => {
    const rawCsv = `time,open,high,low,close,tick_volume,spread,real_volume,time_thai
2026-05-06 07:00:00+00:00,4669.123,4670.367,4658.638,4658.638,2301,280,0,2026-05-06 14:00:00+07:00
2026-05-06 06:45:00+00:00,4664.015,4669.651,4662.714,4669.066,1879,280,0,2026-05-06 13:45:00+07:00
2026-05-06 07:15:00+00:00,4658.718,4669.823,4657.488,4667.333,2365,280,0,2026-05-06 14:15:00+07:00`;

    const bars = parseCandleCsv(rawCsv);
    expect(bars.length).toBe(3);
    // Should be sorted chronologically
    expect(bars[0].open).toBe(4664.015); // 06:45:00
    expect(bars[1].open).toBe(4669.123); // 07:00:00
    expect(bars[2].open).toBe(4658.718); // 07:15:00
    expect(bars[0].time).toBeLessThan(bars[1].time);
  });
});
