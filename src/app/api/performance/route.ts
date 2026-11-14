import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { queryCache } from '@/lib/cache/lru-cache';
import { PerformanceMetric } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const client = await getRawClient();

    // 1. Fetch recent performance logs
    const logsRes = await client.query(`
      SELECT id, endpoint, query_type, query_hash, execution_time_ms, total_records_scanned, cache_hit, created_at
      FROM query_performance_logs
      ORDER BY created_at DESC
      LIMIT 100;
    `);

    // 2. Fetch cache stats from LRU cache
    const cacheStats = queryCache.getStats();

    // 3. Compute expensive queries
    const expensiveRes = await client.query(`
      SELECT query_type, AVG(execution_time_ms)::real as avg_time, MAX(execution_time_ms)::real as max_time, COUNT(*)::int as count
      FROM query_performance_logs
      GROUP BY query_type
      ORDER BY avg_time DESC;
    `);

    const metrics: PerformanceMetric[] = logsRes.rows.map((r: any) => ({
      id: r.id,
      timestamp: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
      endpoint: r.endpoint,
      queryType: r.query_type,
      executionTimeMs: r.execution_time_ms,
      cacheHit: r.cache_hit,
      recordsCount: r.total_records_scanned,
    }));

    return NextResponse.json({
      metrics,
      cacheStats,
      expensiveQueriesSummary: expensiveRes.rows,
    });
  } catch (err: any) {
    console.error('Fetch performance metrics error:', err);
    return NextResponse.json({ error: 'Failed to fetch performance stats' }, { status: 500 });
  }
}
