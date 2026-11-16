import { getRawClient } from '../src/lib/db';

async function main() {
  const client = await getRawClient();
  try {
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'dataset_records'
      ORDER BY ordinal_position;
    `);
    console.log('=== dataset_records Table Schema ===');
    console.table(cols.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error verifying schema:', err);
    process.exit(1);
  }
}

main();
