import { CandleBar, Timeframe } from '../types/candle';

export interface IntegrityReport {
  symbol: string;
  timeframe: Timeframe;
  totalBars: number;
  gapCount: number;
  continuityScore: number; // 0 to 100%
  expectedStepSeconds: number;
  largestGapSeconds: number;
  detectedGaps: Array<{
    beforeIndex: number;
    beforeTime: number;
    afterTime: number;
    gapSeconds: number;
  }>;
}

export class DataIntegrityChecker {
  public static getTimeframeStepSeconds(tf: Timeframe): number {
    switch (tf) {
      case 'M1':
        return 60;
      case 'M5':
        return 300;
      case 'M15':
        return 900;
      case 'H1':
        return 3600;
      case 'D1':
        return 86400;
      default:
        return 900;
    }
  }

  public static auditCandles(symbol: string, tf: Timeframe, bars: CandleBar[]): IntegrityReport {
    if (!bars || bars.length < 2) {
      return {
        symbol,
        timeframe: tf,
        totalBars: bars?.length || 0,
        gapCount: 0,
        continuityScore: 100,
        expectedStepSeconds: this.getTimeframeStepSeconds(tf),
        largestGapSeconds: 0,
        detectedGaps: [],
      };
    }

    const expectedStep = this.getTimeframeStepSeconds(tf);
    const gaps: IntegrityReport['detectedGaps'] = [];
    let largestGap = 0;

    for (let i = 0; i < bars.length - 1; i++) {
      const cur = bars[i].time as number;
      const next = bars[i + 1].time as number;
      const diff = next - cur;

      // Allow weekend gaps (up to ~72 hours / 259200s for forex/gold without penalizing)
      if (diff > expectedStep * 2 && diff < 260000) {
        gaps.push({
          beforeIndex: i,
          beforeTime: cur,
          afterTime: next,
          gapSeconds: diff,
        });
        if (diff > largestGap) {
          largestGap = diff;
        }
      }
    }

    // Continuity score: percentage of continuous transitions
    const validTransitions = bars.length - 1 - gaps.length;
    const continuityScore = Math.max(0, Math.min(100, (validTransitions / (bars.length - 1)) * 100));

    return {
      symbol,
      timeframe: tf,
      totalBars: bars.length,
      gapCount: gaps.length,
      continuityScore: Math.round(continuityScore * 100) / 100,
      expectedStepSeconds: expectedStep,
      largestGapSeconds: largestGap,
      detectedGaps: gaps.slice(0, 10), // keep top 10 for diagnostics
    };
  }
}
