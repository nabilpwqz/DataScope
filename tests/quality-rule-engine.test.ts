import { describe, it, expect } from 'vitest';
import { calculateQualityHealthScore } from '@/lib/quality/rule-engine';

describe('Data Quality Rule Engine', () => {
  it('computes 100% health score when zero defects exist', () => {
    const score = calculateQualityHealthScore({
      totalRecords: 100000,
      nullCount: 0,
      duplicateCount: 0,
      invalidFormatCount: 0,
    });
    expect(score).toBe(100);
  });

  it('accurately discounts scores based on weighted quality dimensions', () => {
    const score = calculateQualityHealthScore({
      totalRecords: 1000,
      nullCount: 50, // 95% completeness -> 38
      duplicateCount: 10, // 99% uniqueness -> 39.6
      invalidFormatCount: 20, // 98% validity -> 19.6
    });
    expect(score).toBeGreaterThan(95);
    expect(score).toBeLessThan(100);
  });
});
