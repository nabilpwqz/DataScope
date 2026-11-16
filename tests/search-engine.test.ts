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

  it('should encode and decode keyset cursors correctly', () => {
    const rawCursor = { id: 'rec-sales-0000042', recordDate: '2024-05-15T12:00:00.000Z', direction: 'next' };
    const encoded = Buffer.from(JSON.stringify(rawCursor)).toString('base64');
    const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));

    expect(decoded.id).toBe('rec-sales-0000042');
    expect(decoded.recordDate).toBe('2024-05-15T12:00:00.000Z');
    expect(decoded.direction).toBe('next');
  });

  it('should generate distinct hashes when cursor pagination is used vs offset', () => {
    const offsetHash = SearchEngine.generateQueryHash({
      datasetId: 'ds-sales-01',
      paginationType: 'offset',
      page: 1,
      pageSize: 25,
    });

    const cursorHash = SearchEngine.generateQueryHash({
      datasetId: 'ds-sales-01',
      paginationType: 'cursor',
      cursor: Buffer.from(JSON.stringify({ id: 'rec-1', recordDate: '2024-01-01T00:00:00.000Z' })).toString('base64'),
      pageSize: 25,
    });

    expect(offsetHash).not.toBe(cursorHash);
  });
});

