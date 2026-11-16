import { getRawClient } from '../src/lib/db';

async function main() {
  const client = await getRawClient();
  try {
    const res = await client.query(`
      SELECT
        COUNT(*) AS total_rows,
        COUNT(CASE WHEN title IS NULL THEN 1 END) AS null_titles,
        COUNT(CASE WHEN status IS NULL THEN 1 END) AS null_statuses,
        COUNT(CASE WHEN numeric_value IS NULL THEN 1 END) AS null_values,
        COUNT(CASE WHEN country IS NULL THEN 1 END) AS null_countries
      FROM dataset_records;
    `);
    console.log('=== DataScope Data Quality Integrity Scan ===');
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Quality audit failed:', err);
    process.exit(1);
  }
}

main();
