import { Pool } from 'pg';

const databaseUrl = 'postgresql://neondb_owner:npg_Kb9AgZ4jIBOd@ep-silent-smoke-ao9xf02q-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function inspect() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const ds = await pool.query('SELECT id, name, slug, total_records, access_level FROM datasets;');
    console.log('Datasets in Neon:');
    console.table(ds.rows);

    const recByDs = await pool.query('SELECT dataset_id, count(*)::int as count FROM dataset_records GROUP BY dataset_id;');
    console.log('Records by Dataset in Neon:');
    console.table(recByDs.rows);

    const sample = await pool.query('SELECT id, dataset_id, record_key, title, status, country, numeric_value, record_date FROM dataset_records LIMIT 5;');
    console.log('Sample Records:');
    console.table(sample.rows);

    const users = await pool.query('SELECT id, name, email, role, department FROM users;');
    console.log('Users in Neon:');
    console.table(users.rows);

    const views = await pool.query('SELECT id, user_id, dataset_id, name, is_shared FROM saved_views;');
    console.log('Saved Views in Neon:');
    console.table(views.rows);

    const searchHist = await pool.query('SELECT count(*)::int FROM search_history;');
    console.log('Search history count:', searchHist.rows[0]);

    // Check missing tables from Neon:
    // Notice earlier tables list had:
    // users, datasets, dataset_fields, dataset_records, record_relationships, record_history, saved_views, search_history, user_preferences, export_jobs, query_performance_logs
    // What about audit_logs, record_comments, data_quality_issues?
    const allTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
    console.log('All public tables in Neon:', allTables.rows.map(r => r.table_name));
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

inspect();

