import { describe, it, expect } from 'vitest';
import { compilePushdownWhereClause } from '@/lib/search/query-builder-optimizer';

describe('Query Builder Optimizer', () => {
  it('compiles single condition pushdown SQL correctly', () => {
    const sql = compilePushdownWhereClause('ds-sales-01', [
      { field: 'status', operator: 'equals', value: 'Active' },
    ]);
    expect(sql).toBe("dataset_id = 'ds-sales-01' AND (status = 'Active')");
  });

  it('compiles compound conditions with boolean operators', () => {
    const sql = compilePushdownWhereClause(
      'ds-sales-01',
      [
        { field: 'status', operator: 'equals', value: 'Active' },
        { field: 'numericValue', operator: 'greater_than', value: 10000 },
      ],
      'AND'
    );
    expect(sql).toContain("status = 'Active' AND numeric_value > 10000");
  });
});
