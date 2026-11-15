import { Pool } from 'pg';

const databaseUrl = 'postgresql://neondb_owner:npg_Kb9AgZ4jIBOd@ep-silent-smoke-ao9xf02q-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function testNeon() {
  console.log('Testing Neon connection...');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const res = await pool.query('SELECT current_database(), current_user, version();');
    console.log('Neon connection SUCCESS:', res.rows[0]);

    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
    console.log('Public tables in Neon:', tables.rows.map(r => r.table_name));

    try {
      const ds = await pool.query('SELECT count(*)::int as count FROM datasets;');
      console.log('Datasets count in Neon:', ds.rows[0]);
    } catch (e: any) {
      console.log('Datasets query failed:', e.message);
    }

    try {
      const rec = await pool.query('SELECT count(*)::int as count FROM dataset_records;');
      console.log('Records count in Neon:', rec.rows[0]);
    } catch (e: any) {
      console.log('Records query failed:', e.message);
    }
  } catch (err: any) {
    console.error('Neon connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

testNeon();

