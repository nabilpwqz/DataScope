interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

export class LRUCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxItems: number;
  private defaultTTL: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxItems: number = 500, defaultTTLMs: number = 60000) {
    this.maxItems = maxItems;
    this.defaultTTL = defaultTTLMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Refresh position for LRU
    this.cache.delete(key);
    entry.hits++;
    this.cache.set(key, entry);
    this.hits++;
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.cache.size >= this.maxItems) {
      // Evict oldest item (first item in Map iterator)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs || this.defaultTTL),
      createdAt: Date.now(),
      hits: 0,
    });
  }

  invalidate(patternOrPrefix: string): number {
    let deleted = 0;
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(patternOrPrefix)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  invalidateDataset(datasetId: string): number {
    return this.invalidate(`dataset:${datasetId}`);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;
    return {
      size: this.cache.size,
      maxItems: this.maxItems,
      hits: this.hits,
      misses: this.misses,
      hitRate: parseFloat(hitRate.toFixed(1)),
      totalRequests,
    };
  }
}

// Global server singleton cache
const globalForCache = globalThis as unknown as {
  searchCache: LRUCache | undefined;
};

export const queryCache = globalForCache.searchCache || new LRUCache(1000, 60000);

if (process.env.NODE_ENV !== 'production') {
  globalForCache.searchCache = queryCache;
}
