import { NextResponse } from 'next/server';
import { getRawClient, getEngineType } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = performance.now();

  try {
    const rawClient = await getRawClient();
    const engineType = await getEngineType();

    // Measure active DB latency
    const pingStart = performance.now();
    const pingRes = await rawClient.query('SELECT 1 AS ping, count(*)::int AS datasets_count FROM datasets;');
    const latencyMs = Number((performance.now() - pingStart).toFixed(2));
    const totalDurationMs = Number((performance.now() - startTime).toFixed(2));

    let recordsCount = 0;
    try {
      const sumRes = await rawClient.query('SELECT COALESCE(SUM(total_records), 0)::int AS records_count FROM datasets;');
      recordsCount = Number(sumRes.rows?.[0]?.records_count || 0);
      if (recordsCount === 0) {
        const recRes = await rawClient.query('SELECT count(*)::int AS records_count FROM dataset_records;');
        recordsCount = recRes.rows?.[0]?.records_count || 0;
      }
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
          totalDurationMs,
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
    const rawEnvUrl =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.SUPABASE_DATABASE_URL ||
      process.env.SUPABASE_POSTGRES_URL;

    let targetHost = 'none';
    if (rawEnvUrl) {
      const match = rawEnvUrl.match(/@([^:/]+)/);
      targetHost = match ? match[1] : 'unparseable';
    }

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message || 'Database connection error',
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
        diagnostics: {
          hasDatabaseUrl: Boolean(rawEnvUrl),
          configuredHost: targetHost,
          isVercel: Boolean(process.env.VERCEL),
          nodeEnv: process.env.NODE_ENV || 'production',
        },
      },
      { status: 503 }
    );
  }
}

