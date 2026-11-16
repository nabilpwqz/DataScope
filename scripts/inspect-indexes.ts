import { getRawClient } from '../src/lib/db';

async function checkIndexes() {
  const client = await getRawClient();
  try {
    const colRes = await client.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'dataset_records';
    `);
    console.log('dataset_records columns:');
    colRes.rows.forEach((r: any) => console.log(` - ${r.column_name}: ${r.data_type} (${r.udt_name})`));

    const indexRes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'dataset_records';
    `);
    console.log('\ndataset_records indexes:');
    indexRes.rows.forEach((r: any) => console.log(` - ${r.indexname}: ${r.indexdef}`));
  } catch (err) {
    console.error('Error checking indexes:', err);
  } finally {
    process.exit(0);
  }
}

checkIndexes();

