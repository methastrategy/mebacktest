import { CandleBar, Timeframe } from '../types/candle';

export interface CacheMetadata {
  symbol: string;
  timeframe: Timeframe;
  count: number;
  lastUpdated: number;
  sizeBytes: number;
}

export class IndexedDBCache {
  private static instance: IndexedDBCache;
  private memoryFallback: Map<string, CandleBar[]> = new Map();
  private dbName = 'MeBacktest_DataLake';
  private storeName = 'candle_cache';
  private db: IDBDatabase | null = null;
  private isSupported: boolean;

  private constructor() {
    this.isSupported = typeof window !== 'undefined' && 'indexedDB' in window;
    if (this.isSupported) {
      this.initDB();
    }
  }

  public static getInstance(): IndexedDBCache {
    if (!IndexedDBCache.instance) {
      IndexedDBCache.instance = new IndexedDBCache();
    }
    return IndexedDBCache.instance;
  }

  private initDB(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isSupported) return resolve();
      try {
        const request = window.indexedDB.open(this.dbName, 1);
        request.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };
        request.onsuccess = (e) => {
          this.db = (e.target as IDBOpenDBRequest).result;
          resolve();
        };
        request.onerror = () => {
          resolve();
        };
      } catch {
        resolve();
      }
    });
  }

  private getCacheKey(symbol: string, tf: Timeframe): string {
    return `${symbol.toUpperCase()}_${tf}`;
  }

  public async setBars(symbol: string, tf: Timeframe, bars: CandleBar[]): Promise<void> {
    const key = this.getCacheKey(symbol, tf);
    this.memoryFallback.set(key, bars);

    if (this.db) {
      try {
        const tx = this.db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.put(bars, key);
      } catch {
        // Fallback already populated
      }
    }
  }

  public async getBars(symbol: string, tf: Timeframe): Promise<CandleBar[] | null> {
    const key = this.getCacheKey(symbol, tf);
    if (this.memoryFallback.has(key)) {
      return this.memoryFallback.get(key) || null;
    }

    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db!.transaction(this.storeName, 'readonly');
          const store = tx.objectStore(this.storeName);
          const req = store.get(key);
          req.onsuccess = () => {
            const result = req.result as CandleBar[] | undefined;
            if (result && Array.isArray(result)) {
              this.memoryFallback.set(key, result);
              resolve(result);
            } else {
              resolve(null);
            }
          };
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    }

    return null;
  }

  public async clearCache(): Promise<void> {
    this.memoryFallback.clear();
    if (this.db) {
      try {
        const tx = this.db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.clear();
      } catch {
        // Ignore
      }
    }
  }

  public getCacheStats(): { memoryKeys: string[]; memoryCount: number } {
    return {
      memoryKeys: Array.from(this.memoryFallback.keys()),
      memoryCount: this.memoryFallback.size,
    };
  }
}
