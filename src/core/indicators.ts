import { UTCTimestamp } from 'lightweight-charts';
import { CandleBar } from '../types/candle';

export interface IndicatorPoint {
  time: UTCTimestamp;
  value: number;
}

/**
 * Calculates Exponential Moving Average (EMA) for an array of CandleBars.
 * Formula: EMA_t = Close_t * k + EMA_(t-1) * (1 - k), where k = 2 / (period + 1).
 */
export function calculateEMA(bars: CandleBar[], period: number): IndicatorPoint[] {
  if (!bars || bars.length === 0 || period <= 0) {
    return [];
  }

  const k = 2 / (period + 1);
  const result: IndicatorPoint[] = [];

  let prevEma = bars[0].close;
  result.push({
    time: bars[0].time,
    value: Number(prevEma.toFixed(3)),
  });

  for (let i = 1; i < bars.length; i++) {
    const close = bars[i].close;
    const currentEma = close * k + prevEma * (1 - k);
    prevEma = currentEma;
    result.push({
      time: bars[i].time,
      value: Number(currentEma.toFixed(3)),
    });
  }

  return result;
}

/**
 * Calculates the next EMA point incrementally in O(1) time.
 */
export function calculateNextEMA(currentClose: number, prevEMA: number, period: number): number {
  const k = 2 / (period + 1);
  const nextEma = currentClose * k + prevEMA * (1 - k);
  return Number(nextEma.toFixed(3));
}
