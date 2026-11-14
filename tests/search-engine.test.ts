import { describe, it, expect } from 'vitest';
import { SearchEngine } from '@/lib/search/search-engine';

describe('Search Engine & Query Hash Generation', () => {
  it('should generate deterministic hashes for identical search queries', () => {
    const hash1 = SearchEngine.generateQueryHash({
      datasetId: 'ds-sales-01',
      search: 'Germany',
      searchType: 'hybrid',
      page: 1,
      pageSize: 25,
      filters: [{ id: '1', field: 'status', operator: 'equals', value: 'Active' }],
    });

    const hash2 = SearchEngine.generateQueryHash({
      datasetId: 'ds-sales-01',
      search: '  germany  ', // Trim and lowercase normalization
      searchType: 'hybrid',
      page: 1,
      pageSize: 25,
      filters: [{ id: '1', field: 'status', operator: 'equals', value: 'Active' }],
    });

    expect(hash1).toBe(hash2);
  });

  it('should generate distinct hashes when filter or pagination values change', () => {
    const hashA = SearchEngine.generateQueryHash({
      datasetId: 'ds-sales-01',
      search: 'Germany',
      page: 1,
      pageSize: 25,
    });

    const hashB = SearchEngine.generateQueryHash({
      datasetId: 'ds-sales-01',
      search: 'Germany',
      page: 2,
      pageSize: 25,
    });

    expect(hashA).not.toBe(hashB);
  });
});
