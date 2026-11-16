import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { queryCache } from '@/lib/cache/lru-cache';
import { authorize } from '@/lib/auth/authorize';
import { PerformanceMetric } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, { role: 'analyst' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const client = await getRawClient();

    // 1. Fetch recent performance logs from database
    const logsRes = await client.query(`
      SELECT id, endpoint, query_type, query_hash, execution_time_ms, total_records_scanned, cache_hit, created_at
      FROM query_metrics
      ORDER BY created_at DESC
      LIMIT 100;
    `);

    // 2. Fetch cache stats from cache
    const cacheStats = queryCache.getStats();

    // 3. Compute expensive queries from real measurements
    const expensiveRes = await client.query(`
      SELECT query_type, AVG(execution_time_ms)::real as avg_time, MAX(execution_time_ms)::real as max_time, COUNT(*)::int as count
      FROM query_metrics
      GROUP BY query_type
      ORDER BY avg_time DESC;
    `);

    // 4. Fetch aggregate real stats from query_metrics
    const aggRes = await client.query(`
      SELECT 
        COUNT(*)::int as total_queries,
        COALESCE(AVG(execution_time_ms)::real, 0) as avg_execution_time_ms,
        COALESCE(MAX(execution_time_ms)::real, 0) as max_execution_time_ms,
        COALESCE(MIN(execution_time_ms)::real, 0) as min_execution_time_ms,
        COALESCE(SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END)::int, 0) as total_cache_hits
      FROM query_metrics;
    `);

    // 5. Fetch live dataset scale from datasets table
    const dsRes = await client.query(`
      SELECT COALESCE(SUM(total_records), 0)::int as total_indexed_records
      FROM datasets;
    `);

    const agg = aggRes.rows[0] || {};
    const totalQueries = Number(agg.total_queries || 0);
    const avgExecutionTimeMs = Math.round(Number(agg.avg_execution_time_ms || 0) * 10) / 10;
    const totalCacheHits = Number(agg.total_cache_hits || 0);
    const dbHitRate = totalQueries > 0 ? Math.round((totalCacheHits / totalQueries) * 1000) / 10 : 0;
    const totalIndexedRecords = Number(dsRes.rows[0]?.total_indexed_records || 0);

    const aggregates = {
      totalQueries,
      avgExecutionTimeMs,
      totalCacheHits,
      dbHitRate,
      totalIndexedRecords,
    };

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
      aggregates,
      expensiveQueriesSummary: expensiveRes.rows,
    });
  } catch (err: any) {
    console.error('Fetch performance metrics error:', err);
    return NextResponse.json({ error: 'Failed to fetch performance stats' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authorize(req, { role: 'admin', action: 'manage' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Forbidden' }, { status: auth.status || 403 });
    }

    queryCache.clear();
    return NextResponse.json({
      success: true,
      message: 'Server query cache flushed successfully by administrator',
      stats: queryCache.getStats(),
    });
  } catch (err: any) {
    console.error('Flush cache error:', err);
    return NextResponse.json({ error: 'Failed to flush server cache' }, { status: 500 });
  }
}
