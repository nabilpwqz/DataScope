import { NextResponse } from 'next/server';
import { getRawClient, getEngineType } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = performance.now();

  try {
    const rawClient = await getRawClient();
    const engineType = await getEngineType();

    // Measure active DB latency
    const pingRes = await rawClient.query('SELECT 1 AS ping, count(*)::int AS datasets_count FROM datasets;');
    const latencyMs = Number((performance.now() - startTime).toFixed(2));

    let recordsCount = 0;
    try {
      const recRes = await rawClient.query('SELECT count(*)::int AS records_count FROM dataset_records;');
      recordsCount = recRes.rows?.[0]?.records_count || 0;
    } catch (_) {}

    const memoryUsage = process.memoryUsage();

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        platform: 'DataScope Enterprise Discovery',
        environment: {
          nodeEnv: process.env.NODE_ENV || 'production',
          isVercel: Boolean(process.env.VERCEL),
          region: process.env.VERCEL_REGION || 'local',
        },
        database: {
          healthy: true,
          engineType,
          latencyMs,
          totalDatasets: pingRes.rows?.[0]?.datasets_count || 0,
          totalRecords: recordsCount,
        },
        system: {
          rssMb: (memoryUsage.rss / 1024 / 1024).toFixed(2),
          heapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
          heapTotalMb: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message || 'Database connection error',
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
      },
      { status: 503 }
    );
  }
}

