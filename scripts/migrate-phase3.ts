import { getRawClient } from '../src/lib/db';

async function migratePhase3() {
  console.log('Running Phase 3 Migration: Generated tsvector column and composite B-tree indexes...');
  const client = await getRawClient();

  try {
    // 1. Add generated tsvector column if not exists
    console.log('1. Checking and creating generated tsvector column search_tsv...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'dataset_records' AND column_name = 'search_tsv'
        ) THEN
          ALTER TABLE dataset_records 
          ADD COLUMN search_tsv tsvector 
          GENERATED ALWAYS AS (
            to_tsvector('english', coalesce(title, '') || ' ' || coalesce(category, '') || ' ' || coalesce(country, '') || ' ' || coalesce(region, '') || ' ' || coalesce(status, '') || ' ' || coalesce(record_key, ''))
          ) STORED;
        END IF;
      END $$;
    `);
    console.log('search_tsv generated column ready.');

    // 2. Create GIN index on search_tsv
    console.log('2. Creating GIN index on search_tsv...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_records_search_tsv_gin ON dataset_records USING gin(search_tsv);
    `);
    console.log('idx_records_search_tsv_gin index ready.');

    // 3. Composite B-tree indexes matching filter patterns
    console.log('3. Creating composite filter indexes...');
    await client.query(`
      -- Composite filter pattern: (dataset_id, status, country, record_date DESC)
      CREATE INDEX IF NOT EXISTS idx_records_filter_composite 
      ON dataset_records (dataset_id, status, country, record_date DESC);

      -- Numeric range filter: (dataset_id, numeric_value)
      CREATE INDEX IF NOT EXISTS idx_records_dataset_numeric 
      ON dataset_records (dataset_id, numeric_value);

      -- Keyset pagination index: (dataset_id, record_date DESC, id DESC)
      CREATE INDEX IF NOT EXISTS idx_records_keyset 
      ON dataset_records (dataset_id, record_date DESC, id DESC);
    `);
    console.log('Composite B-tree indexes ready.');

    // 4. Verify indexes
    const idxRes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'dataset_records'
      ORDER BY indexname;
    `);
    console.log('\nVerified indexes on dataset_records:');
    idxRes.rows.forEach((r: any) => console.log(` - ${r.indexname}: ${r.indexdef}`));

  } catch (error) {
    console.error('Migration Phase 3 failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migratePhase3();
