import { Pool } from 'pg';

const databaseUrl = 'postgresql://neondb_owner:npg_Kb9AgZ4jIBOd@ep-silent-smoke-ao9xf02q-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function createGinIndexes() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Enabling pg_trgm extension in Neon...');
    await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

    console.log('Creating GIN index for Trigram on title...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_records_trgm_title ON dataset_records USING gin (title gin_trgm_ops);');

    console.log('Creating GIN index for Full-Text Search...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_records_fts ON dataset_records USING gin (
        to_tsvector('english', title || ' ' || category || ' ' || country || ' ' || record_key)
      );
    `);

    console.log('Creating composite index for multi-column filtering...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_records_composite_filter ON dataset_records (dataset_id, status, country, numeric_value);
    `);

    console.log('GIN and composite indexes created successfully!');
  } catch (err: any) {
    console.error('Error creating indexes:', err.message);
  } finally {
    await pool.end();
  }
}

createGinIndexes();

