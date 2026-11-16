import { describe, it, expect } from 'vitest';
import { SearchRecordsQuerySchema, FilterConditionSchema, DatasetCreateSchema } from '@/lib/validation/schemas';

describe('Validation Schemas (Zod)', () => {
  it('validates search query parameters with defaults', () => {
    const parsed = SearchRecordsQuerySchema.parse({ datasetId: 'ds-sales-01' });
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(25);
    expect(parsed.searchType).toBe('hybrid');
    expect(parsed.filterLogicalOperator).toBe('AND');
  });

  it('clamps and validates pageSize bounds', () => {
    expect(() => SearchRecordsQuerySchema.parse({ datasetId: 'ds-sales-01', pageSize: 500 })).toThrow();
  });

  it('validates filter condition shapes', () => {
    const valid = FilterConditionSchema.parse({
      id: 'c1',
      field: 'numericValue',
      operator: 'greater_than',
      value: 10000,
    });
    expect(valid.operator).toBe('greater_than');
  });

  it('enforces dataset creation constraints', () => {
    expect(() => DatasetCreateSchema.parse({ name: 'ab', description: 'short', category: '', dataSource: '' })).toThrow();
    const valid = DatasetCreateSchema.parse({
      name: 'Valid Dataset',
      description: 'Comprehensive operational telemetry partition',
      category: 'Analytics',
      dataSource: 'PostgreSQL Pooler',
    });
    expect(valid.accessLevel).toBe('public');
  });
});
