import { Pool } from 'pg';
import { initDatabase, getRawClient } from '../src/lib/db';

const databaseUrl = 'postgresql://neondb_owner:npg_Kb9AgZ4jIBOd@ep-silent-smoke-ao9xf02q-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function syncNeon() {
  process.env.DATABASE_URL = databaseUrl;
  console.log('Connecting to Neon via initDatabase()...');
  const { db, rawClient, engineType } = await initDatabase();
  console.log('Engine type initialized:', engineType);

  const tables = await rawClient.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
  console.log('Public tables in Neon now:', tables.rows.map((r: any) => r.table_name));

  const auditCount = await rawClient.query('SELECT count(*)::int as count FROM audit_logs;');
  console.log('Audit logs count:', auditCount.rows[0]);

  const dqCount = await rawClient.query('SELECT count(*)::int as count FROM data_quality_issues;');
  console.log('Data quality issues count:', dqCount.rows[0]);

  const recCount = await rawClient.query('SELECT count(*)::int as count FROM dataset_records;');
  console.log('Dataset records count:', recCount.rows[0]);
}

syncNeon().catch(console.error);
