import { SearchEngine } from '../src/lib/search/search-engine';

const databaseUrl = 'postgresql://neondb_owner:npg_Kb9AgZ4jIBOd@ep-silent-smoke-ao9xf02q-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function testSearch() {
  process.env.DATABASE_URL = databaseUrl;
  console.log('Testing SearchEngine.executeQuery for ds-sales-01...');
  
  const res = await SearchEngine.executeQuery({
    datasetId: 'ds-sales-01',
    page: 1,
    pageSize: 10,
    search: '',
  });

  console.log('Result for ds-sales-01:');
  console.log('Total matching records:', res.totalRecords);
  console.log('Records returned:', res.records.length);
  console.log('Execution time:', res.executionTimeMs, 'ms');
  console.log('First record:', res.records[0]?.title, res.records[0]?.numericValue, res.records[0]?.country);

  console.log('Testing search with keyword "Germany"...');
  const searchRes = await SearchEngine.executeQuery({
    datasetId: 'ds-sales-01',
    page: 1,
    pageSize: 10,
    search: 'Germany',
  });
  console.log('Search "Germany" matching records:', searchRes.totalRecords);
  console.log('Execution time:', searchRes.executionTimeMs, 'ms');
}

testSearch().catch(console.error);

