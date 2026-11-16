import { NextRequest, NextResponse } from 'next/server';
import { SearchEngine } from '@/lib/search/search-engine';
import { authorize } from '@/lib/auth/authorize';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const datasetId = 'ds-sales-01';
    const benchmarkResults: Record<string, any> = {};

    // 1. Full-Text Search benchmark
    const ftsRes = await SearchEngine.executeQuery({
      datasetId,
      search: 'Enterprise Logistics',
      searchType: 'fts',
      page: 1,
      pageSize: 25,
    });
    benchmarkResults.fullTextSearch = {
      label: 'PostgreSQL Full-Text Search (tsvector @@ tsquery)',
      executionTimeMs: ftsRes.executionTimeMs,
      totalMatched: ftsRes.totalRecords,
      cacheHit: ftsRes.cacheHit,
    };

    // 2. Trigram Search benchmark
    const trgmRes = await SearchEngine.executeQuery({
      datasetId,
      search: 'Bavaria Robotik',
      searchType: 'trgm',
      page: 1,
      pageSize: 25,
    });
    benchmarkResults.trigramSearch = {
      label: 'PostgreSQL Trigram Search (similarity & fuzzy match)',
      executionTimeMs: trgmRes.executionTimeMs,
      totalMatched: trgmRes.totalRecords,
      cacheHit: trgmRes.cacheHit,
    };

    // 3. Combined Complex Multi-Filter benchmark
    const multiFilterRes = await SearchEngine.executeQuery({
      datasetId,
      filters: [
        { id: '1', field: 'status', operator: 'equals', value: 'Active' },
        { id: '2', field: 'country', operator: 'equals', value: 'Germany' },
        { id: '3', field: 'numericValue', operator: 'greater_than', value: 10000 },
      ],
      filterLogicalOperator: 'AND',
      sort: [{ field: 'numericValue', direction: 'desc' }],
      page: 1,
      pageSize: 25,
    });
    benchmarkResults.multiFilterSearch = {
      label: 'Combined Filters (Status=Active, Country=Germany, Revenue > 10k)',
      executionTimeMs: multiFilterRes.executionTimeMs,
      totalMatched: multiFilterRes.totalRecords,
      cacheHit: multiFilterRes.cacheHit,
    };

    // 4. Deep Pagination benchmark
    const deepPageRes = await SearchEngine.executeQuery({
      datasetId,
      page: 50,
      pageSize: 25,
      sort: [{ field: 'recordDate', direction: 'desc' }],
    });
    benchmarkResults.deepPagination = {
      label: 'Pagination (Page 50, 25 rows)',
      executionTimeMs: deepPageRes.executionTimeMs,
      totalMatched: deepPageRes.totalRecords,
      cacheHit: deepPageRes.cacheHit,
    };

    // 5. Cache Hit benchmark
    const cachedRes = await SearchEngine.executeQuery({
      datasetId,
      search: 'Enterprise Logistics',
      searchType: 'fts',
      page: 1,
      pageSize: 25,
    });
    benchmarkResults.cacheHitEvaluation = {
      label: 'Query Cache Retrieval',
      executionTimeMs: cachedRes.executionTimeMs,
      totalMatched: cachedRes.totalRecords,
      cacheHit: cachedRes.cacheHit,
    };

    return NextResponse.json({
      environment: 'PostgreSQL Database Engine Live Benchmark',
      timestamp: new Date().toISOString(),
      results: benchmarkResults,
    });
  } catch (err: any) {
    console.error('Benchmark execution error:', err);
    return NextResponse.json({ error: 'Benchmark failed', details: err.message }, { status: 500 });
  }
}
