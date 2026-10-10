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

  let prevEma = Number(bars[0].close.toFixed(3));
  result.push({
    time: bars[0].time,
    value: prevEma,
  });

  for (let i = 1; i < bars.length; i++) {
    const close = bars[i].close;
    const currentEma = Number((close * k + prevEma * (1 - k)).toFixed(3));
    prevEma = currentEma;
    result.push({
      time: bars[i].time,
      value: currentEma,
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
