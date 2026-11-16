import crypto from 'crypto';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

export class SharedQueryCache<T = any> {
  private localCache: Map<string, CacheEntry<T>> = new Map();
  private maxItems: number;
  private defaultTTLMs: number;
  private hits: number = 0;
  private misses: number = 0;
  private datasetVersions: Map<string, number> = new Map();

  private upstashUrl: string | undefined;
  private upstashToken: string | undefined;

  constructor(maxItems: number = 1000, defaultTTLMs: number = 60000) {
    this.maxItems = maxItems;
    this.defaultTTLMs = defaultTTLMs;
    this.upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    this.upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  }

  public getDatasetVersion(datasetId: string): number {
    return this.datasetVersions.get(datasetId) || 1;
  }

  public incrementDatasetVersion(datasetId: string): number {
    const current = this.getDatasetVersion(datasetId);
    const next = current + 1;
    this.datasetVersions.set(datasetId, next);
    this.invalidateDataset(datasetId);
    return next;
  }

  public generateCacheKey(datasetId: string, normalizedQuery: string): string {
    const version = this.getDatasetVersion(datasetId);
    const raw = `${datasetId}:${normalizedQuery}:v${version}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32);
    return `ds:cache:${datasetId}:${hash}`;
  }

  get(key: string): T | null {
    const entry = this.localCache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.localCache.delete(key);
      this.misses++;
      return null;
    }

    // Refresh position for LRU
    this.localCache.delete(key);
    entry.hits++;
    this.localCache.set(key, entry);
    this.hits++;
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.localCache.size >= this.maxItems) {
      const oldestKey = this.localCache.keys().next().value;
      if (oldestKey) {
        this.localCache.delete(oldestKey);
      }
    }

    this.localCache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs || this.defaultTTLMs),
      createdAt: Date.now(),
      hits: 0,
    });
  }

  invalidate(patternOrPrefix: string): number {
    let deleted = 0;
    for (const key of Array.from(this.localCache.keys())) {
      if (key.includes(patternOrPrefix)) {
        this.localCache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  invalidateDataset(datasetId: string): number {
    return this.invalidate(datasetId);
  }

  clear(): void {
    this.localCache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;
    return {
      size: this.localCache.size,
      maxItems: this.maxItems,
      hits: this.hits,
      misses: this.misses,
      hitRate: parseFloat(hitRate.toFixed(1)),
      totalRequests,
      isSharedRedis: Boolean(this.upstashUrl && this.upstashToken),
    };
  }
}

// Global server singleton cache across hot reloads
const globalForCache = globalThis as unknown as {
  searchCache: SharedQueryCache | undefined;
};

export const queryCache = globalForCache.searchCache || new SharedQueryCache(1000, 60000);

// Backward-compatible alias
export { SharedQueryCache as LRUCache };

if (process.env.NODE_ENV !== 'production') {
  globalForCache.searchCache = queryCache;
}
