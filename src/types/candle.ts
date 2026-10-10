import { UTCTimestamp } from 'lightweight-charts';

export interface CandleBar {
  time: UTCTimestamp;       // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  rawTimeStr?: string;      // Original string e.g. "2026-05-06 06:45:00"
  timeThai?: string;        // Thai timestamp string
}

export type Timeframe = 'M5' | 'M15' | 'H1' | 'D1';
