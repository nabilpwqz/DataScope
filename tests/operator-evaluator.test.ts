import { describe, it, expect } from 'vitest';
import { evaluateFilterCondition } from '@/lib/filter/operator-evaluator';

describe('Filter Operator Evaluator', () => {
  it('evaluates equality, numbers, and strings', () => {
    expect(evaluateFilterCondition('Active', 'equals', 'active')).toBe(true);
    expect(evaluateFilterCondition(50000, 'greater_than', 10000)).toBe(true);
    expect(evaluateFilterCondition(5000, 'greater_than', 10000)).toBe(false);
  });

  it('evaluates between range boundaries accurately', () => {
    expect(evaluateFilterCondition(25000, 'between', 10000, 50000)).toBe(true);
    expect(evaluateFilterCondition(5000, 'between', 10000, 50000)).toBe(false);
  });

  it('evaluates null and not-null checks', () => {
    expect(evaluateFilterCondition(null, 'is_null', '')).toBe(true);
    expect(evaluateFilterCondition('Germany', 'is_not_null', '')).toBe(true);
  });
});
