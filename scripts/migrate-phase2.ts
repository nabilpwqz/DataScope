import { getRawClient } from '../src/lib/db';

async function migratePhase2() {
  console.log('Running Phase 2 Migration: query_metrics table and schema synchronization...');
  const client = await getRawClient();

  try {
    // 1. Create query_metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS query_metrics (
        id text PRIMARY KEY,
        endpoint text NOT NULL,
        query_type text NOT NULL,
        query_hash text NOT NULL,
        execution_time_ms real NOT NULL,
        total_records_scanned integer NOT NULL DEFAULT 0,
        cache_hit boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_query_metrics_created ON query_metrics (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_query_metrics_hash ON query_metrics (query_hash);
      CREATE INDEX IF NOT EXISTS idx_query_metrics_endpoint ON query_metrics (endpoint);
    `);
    console.log('query_metrics table ready.');

    // 2. If query_performance_logs table exists, copy data to query_metrics
    const checkOldTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'query_performance_logs'
      );
    `);

    if (checkOldTable.rows[0].exists) {
      await client.query(`
        INSERT INTO query_metrics (id, endpoint, query_type, query_hash, execution_time_ms, total_records_scanned, cache_hit, created_at)
        SELECT id, endpoint, query_type, query_hash, execution_time_ms, total_records_scanned, cache_hit, created_at
        FROM query_performance_logs
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('Migrated data from query_performance_logs to query_metrics.');
    }

    // 3. Ensure export_jobs table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS export_jobs (
        id text PRIMARY KEY,
        user_id text NOT NULL,
        dataset_id text NOT NULL,
        format text NOT NULL DEFAULT 'csv',
        status text NOT NULL DEFAULT 'pending',
        filter_criteria jsonb DEFAULT '{}',
        total_rows integer NOT NULL DEFAULT 0,
        file_url text,
        created_at timestamptz NOT NULL DEFAULT now(),
        completed_at timestamptz
      );

      CREATE INDEX IF NOT EXISTS idx_export_jobs_user ON export_jobs (user_id);
      CREATE INDEX IF NOT EXISTS idx_export_jobs_dataset ON export_jobs (dataset_id);
      CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs (status);
    `);
    console.log('export_jobs table ready.');

    // 4. List all tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('Current public tables in PostgreSQL:');
    tablesRes.rows.forEach((r: { table_name: string }) => console.log(' - ' + r.table_name));

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migratePhase2();
