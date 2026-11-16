import { getRawClient } from '../src/lib/db';
import fs from 'fs';

async function main() {
  const client = await getRawClient();
  const datasetId = process.argv[2] || 'ds-sales-01';
  console.log(`Exporting sample snapshot for dataset: ${datasetId}...`);

  try {
    const res = await client.query(`
      SELECT record_key, title, status, category, country, numeric_value, record_date
      FROM dataset_records
      WHERE dataset_id = $1
      LIMIT 1000;
    `, [datasetId]);

    const outPath = `export_${datasetId}_snapshot.json`;
    fs.writeFileSync(outPath, JSON.stringify(res.rows, null, 2));
    console.log(`Wrote ${res.rows.length} records to ${outPath}`);
    process.exit(0);
  } catch (err) {
    console.error('Export failed:', err);
    process.exit(1);
  }
}

main();
