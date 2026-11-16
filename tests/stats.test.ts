import { describe, it, expect } from 'vitest';
import { calculateSummaryStats } from '@/lib/utils/stats';

describe('Statistical Utilities', () => {
  it('computes correct min, max, mean, sum, and median', () => {
    const data = [10, 20, 30, 40, 50];
    const stats = calculateSummaryStats(data);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(50);
    expect(stats.mean).toBe(30);
    expect(stats.sum).toBe(150);
    expect(stats.median).toBe(30);
  });

  it('handles empty and null arrays gracefully', () => {
    const stats = calculateSummaryStats([]);
    expect(stats.mean).toBe(0);
    expect(stats.min).toBe(0);
  });
});
