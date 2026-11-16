import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache } from '@/lib/cache/lru-cache';

describe('LRU Cache & Invalidation Engine', () => {
  let cache: LRUCache;

  beforeEach(() => {
    cache = new LRUCache(3, 1000); // 3 items max, 1s TTL
  });

  it('should store and retrieve cached queries with correct hit rate stats', () => {
    cache.set('key1', { data: 'test1' });
    expect(cache.get('key1')).toEqual({ data: 'test1' });
    expect(cache.get('missing')).toBeNull();

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(50.0);
  });

  it('should evict least-recently-used entry when exceeding capacity', () => {
    cache.set('k1', 'val1');
    cache.set('k2', 'val2');
    cache.set('k3', 'val3');

    // Access k1 so k2 becomes the oldest
    cache.get('k1');

    // Set k4 -> should evict k2
    cache.set('k4', 'val4');

    expect(cache.get('k2')).toBeNull();
    expect(cache.get('k1')).toBe('val1');
    expect(cache.get('k3')).toBe('val3');
    expect(cache.get('k4')).toBe('val4');
  });

  it('should invalidate entries matching dataset pattern upon mutation', () => {
    cache.set('dataset:ds-1:q1', { count: 10 });
    cache.set('dataset:ds-1:q2', { count: 20 });
    cache.set('dataset:ds-2:q1', { count: 30 });

    const deletedCount = cache.invalidateDataset('ds-1');
    expect(deletedCount).toBe(2);

    expect(cache.get('dataset:ds-1:q1')).toBeNull();
    expect(cache.get('dataset:ds-1:q2')).toBeNull();
    expect(cache.get('dataset:ds-2:q1')).toEqual({ count: 30 });
  });

  it('should support dataset versioning for atomic cache key invalidation', () => {
    const keyV1 = cache.generateCacheKey('ds-sales-01', 'query_hash_abc');
    expect(cache.getDatasetVersion('ds-sales-01')).toBe(1);

    const nextVer = cache.incrementDatasetVersion('ds-sales-01');
    expect(nextVer).toBe(2);

    const keyV2 = cache.generateCacheKey('ds-sales-01', 'query_hash_abc');
    expect(keyV1).not.toBe(keyV2);
  });
});

