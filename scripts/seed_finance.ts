import { initDatabase, getRawClient, executeSql } from '../src/lib/db';

const databaseUrl = 'postgresql://neondb_owner:npg_Kb9AgZ4jIBOd@ep-silent-smoke-ao9xf02q-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function seedFinance() {
  process.env.DATABASE_URL = databaseUrl;
  const { rawClient: client } = await initDatabase();

  const finCheck = await client.query("SELECT count(*)::int as count FROM dataset_records WHERE dataset_id = 'ds-finance-03';");
  console.log('Current finance records:', finCheck.rows[0].count);

  if (finCheck.rows[0].count >= 10000) {
    console.log('Finance dataset already has 10,000 records.');
    return;
  }

  console.log('Generating 10,000 Institutional Financial Transactions...');
  const baseDate = new Date('2023-01-01T00:00:00Z').getTime();
  const statuses = ['Active', 'Pending', 'Archived', 'Suspended', 'Completed', 'Flagged'];
  const finInstitutions = [
    'JPMorgan Chase Clearing', 'Deutsche Bank Securities', 'BNP Paribas Arbitrage',
    'Barclays Capital EMEA', 'UBS Financial Services', 'Credit Agricole CIB',
    'Nomura Global Clearing', 'HSBC Global Banking', 'Santander Corporate',
    'Morgan Stanley Europe', 'Goldman Sachs Clearing', 'Citigroup Institutional',
    'Standard Chartered Global', 'DBS Bank Treasury', 'Societe Generale Markets'
  ];
  const finCategories = ['Wholesale Clearing', 'Cross-Border Wire', 'Securities Settlement', 'Forex Swaps', 'Treasury Liquidity', 'Repo Financing'];
  const finCountries = [
    { name: 'United States', region: 'Americas' },
    { name: 'Germany', region: 'DACH' },
    { name: 'United Kingdom', region: 'EMEA' },
    { name: 'Switzerland', region: 'DACH' },
    { name: 'Japan', region: 'APAC' },
    { name: 'Singapore', region: 'APAC' },
    { name: 'France', region: 'EMEA' },
    { name: 'Canada', region: 'Americas' }
  ];

  const batchSize = 2000;
  for (let b = 0; b < 5; b++) {
    const financeValues: string[] = [];
    for (let i = 1; i <= batchSize; i++) {
      const idx = b * batchSize + i;
      const id = `rec-fin-${String(idx).padStart(6, '0')}`;
      const key = `TXN-${String(idx).padStart(6, '0')}`;
      const inst = finInstitutions[idx % finInstitutions.length];
      const cat = finCategories[idx % finCategories.length];
      const statusIdx = (idx % 100 < 60) ? 0 : (idx % 100 < 80) ? 1 : (idx % 100 < 90) ? 2 : (idx % 100 < 95) ? 3 : (idx % 100 < 98) ? 4 : 5;
      const status = statuses[statusIdx];
      const cObj = finCountries[idx % finCountries.length];
      const country = cObj.name;
      const region = cObj.region;
      const amount = Math.round(50000 + ((idx * 17923) % 24950000));
      const recDate = new Date(baseDate + (idx * 5800000)).toISOString();
      const title = `${inst} [${cat} #${idx}]`.replace(/'/g, "''");
      const metadata = JSON.stringify({
        settlementChannel: 'SWIFT-ISO20022',
        clearingHouse: 'Fedwire-DTCC',
        currency: 'USD',
        riskScore: (idx * 13) % 100,
        complianceTier: 'SOX-Compliant'
      }).replace(/'/g, "''");
      financeValues.push(
        `('${id}', 'ds-finance-03', '${key}', '${title}', '${cat}', '${status}', ${amount}, '${country}', '${region}', '${recDate}', '${metadata}')`
      );
    }
    await executeSql(client, `
      INSERT INTO dataset_records (id, dataset_id, record_key, title, category, status, numeric_value, country, region, record_date, metadata)
      VALUES ${financeValues.join(',\n')}
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log(` -> Seeded batch ${b + 1} of 5 for finance dataset...`);
  }

  const total = await client.query('SELECT count(*)::int as count FROM dataset_records;');
  console.log('Total records across all datasets in Neon:', total.rows[0].count);
}

seedFinance().catch(console.error);

