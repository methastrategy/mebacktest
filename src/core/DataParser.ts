import Papa from 'papaparse';
import { CandleBar } from '../types/candle';
import { UTCTimestamp } from 'lightweight-charts';

interface RawCsvRow {
  time?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  tick_volume?: string;
  time_thai?: string;
  [key: string]: string | undefined;
}

export function parseCandleCsv(csvString: string): CandleBar[] {
  const parsed = Papa.parse<RawCsvRow>(csvString.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const bars: CandleBar[] = [];

  for (const row of parsed.data) {
    if (!row.time || !row.open || !row.high || !row.low || !row.close) {
      continue;
    }

    const dateObj = new Date(row.time.trim());
    if (isNaN(dateObj.getTime())) {
      continue;
    }

    const unixSeconds = Math.floor(dateObj.getTime() / 1000) as UTCTimestamp;
    const open = parseFloat(row.open);
    const high = parseFloat(row.high);
    const low = parseFloat(row.low);
    const close = parseFloat(row.close);
    const volume = row.tick_volume ? parseFloat(row.tick_volume) : undefined;

    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
      continue;
    }

    bars.push({
      time: unixSeconds,
      open,
      high,
      low,
      close,
      volume,
      rawTimeStr: row.time,
      timeThai: row.time_thai,
    });
  }

  // Deduplicate and sort chronologically ASC
  const seenTimes = new Set<number>();
  const uniqueBars: CandleBar[] = [];

  for (const bar of bars) {
    if (!seenTimes.has(bar.time)) {
      seenTimes.add(bar.time);
      uniqueBars.push(bar);
    }
  }

  uniqueBars.sort((a, b) => a.time - b.time);

  return uniqueBars;
}
