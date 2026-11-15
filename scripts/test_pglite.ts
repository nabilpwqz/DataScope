import { initDatabase, getRawClient } from '../src/lib/db';

async function testPglite() {
  delete process.env.DATABASE_URL;
  process.env.PG_DATA_DIR = './test-pgdata';
  
  console.log('Initializing database without DATABASE_URL...');
  const { db, rawClient, engineType } = await initDatabase();
  console.log('Engine type:', engineType);
  
  const datasets = await rawClient.query('SELECT count(*)::int as count FROM datasets;');
  console.log('Datasets count:', datasets.rows);
  
  const records = await rawClient.query('SELECT count(*)::int as count FROM dataset_records;');
  console.log('Records count:', records.rows);
}

testPglite().catch(console.error);
