import { describe, it, expect } from 'vitest';
import { DataLakeService } from '../src/core/DataLakeService';
import { IndexedDBCache } from '../src/core/IndexedDBCache';

describe('DataLakeService and IndexedDBCache', () => {
  it('generates realistic Price Action dataset for any symbol and timeframe', () => {
    const dataLake = DataLakeService.getInstance();
    const bars = dataLake.generateRealisticDataset('EURUSD', 'M15', 100);

    expect(bars.length).toBe(100);
    expect(bars[0].open).toBeGreaterThan(0);
    expect(bars[0].high).toBeGreaterThanOrEqual(bars[0].low);
    expect(bars[0].time).toBeLessThan(bars[1].time);
    expect((bars[1].time as number) - (bars[0].time as number)).toBe(900); // 15 mins step
  });

  it('stores and retrieves candle batches in IndexedDBCache memory fallback', async () => {
    const cache = IndexedDBCache.getInstance();
    const dataLake = DataLakeService.getInstance();
    const mockBars = dataLake.generateRealisticDataset('GBPUSD', 'H1', 50);

    await cache.setBars('GBPUSD', 'H1', mockBars);
    const retrieved = await cache.getBars('GBPUSD', 'H1');

    expect(retrieved).not.toBeNull();
    expect(retrieved!.length).toBe(50);
    expect(retrieved![0].close).toBe(mockBars[0].close);
  });
});
