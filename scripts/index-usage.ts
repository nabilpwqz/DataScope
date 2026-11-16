import { getRawClient } from '../src/lib/db';

async function main() {
  const client = await getRawClient();
  try {
    const res = await client.query(`
      SELECT 
        relname AS table_name,
        indexrelname AS index_name,
        idx_scan AS number_of_scans,
        idx_tup_read AS tuples_read,
        idx_tup_fetch AS tuples_fetched
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 15;
    `);
    console.log('=== PostgreSQL Index Scan Statistics ===');
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Failed to retrieve index stats:', err);
    process.exit(1);
  }
}

main();
