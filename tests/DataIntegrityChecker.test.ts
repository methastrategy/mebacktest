import { describe, it, expect } from 'vitest';
import { DataIntegrityChecker } from '../src/core/DataIntegrityChecker';
import { CandleBar } from '../src/types/candle';
import { UTCTimestamp } from 'lightweight-charts';

describe('DataIntegrityChecker', () => {
  it('correctly maps timeframe step seconds', () => {
    expect(DataIntegrityChecker.getTimeframeStepSeconds('M1')).toBe(60);
    expect(DataIntegrityChecker.getTimeframeStepSeconds('M5')).toBe(300);
    expect(DataIntegrityChecker.getTimeframeStepSeconds('M15')).toBe(900);
    expect(DataIntegrityChecker.getTimeframeStepSeconds('H1')).toBe(3600);
    expect(DataIntegrityChecker.getTimeframeStepSeconds('D1')).toBe(86400);
  });

  it('audits continuous dataset and gives 100% score', () => {
    const bars: CandleBar[] = [
      { time: 1000 as UTCTimestamp, open: 1, high: 2, low: 0.5, close: 1.5 },
      { time: 1060 as UTCTimestamp, open: 1.5, high: 2.5, low: 1.2, close: 2.0 },
      { time: 1120 as UTCTimestamp, open: 2.0, high: 2.2, low: 1.8, close: 1.9 },
    ];

    const report = DataIntegrityChecker.auditCandles('XAUUSD', 'M1', bars);
    expect(report.continuityScore).toBe(100);
    expect(report.gapCount).toBe(0);
    expect(report.totalBars).toBe(3);
  });

  it('detects abnormal gaps and adjusts continuity score', () => {
    const bars: CandleBar[] = [
      { time: 1000 as UTCTimestamp, open: 1, high: 2, low: 0.5, close: 1.5 },
      { time: 5000 as UTCTimestamp, open: 1.5, high: 2.5, low: 1.2, close: 2.0 }, // 4000s gap
      { time: 5060 as UTCTimestamp, open: 2.0, high: 2.2, low: 1.8, close: 1.9 },
    ];

    const report = DataIntegrityChecker.auditCandles('XAUUSD', 'M1', bars);
    expect(report.gapCount).toBe(1);
    expect(report.continuityScore).toBeLessThan(100);
    expect(report.largestGapSeconds).toBe(4000);
  });
});
