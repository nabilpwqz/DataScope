import { getRawClient } from '../src/lib/db';

const companies = [
  'Acrobat Logistics', 'Siemens Digital', 'SAP Enterprise', 'Deutsche Telekom',
  'BMW Mobility', 'Allianz Global', 'BASF Chemicals', 'Bayer Life Sciences',
  'Mercedes-Benz Fleet', 'Bosch Automation', 'Infineon Microelectronics', 'Lufthansa Systems',
  'Continental Automotive', 'Merck Group', 'Adidas Direct', 'Volkswagen Group',
  'Henkel Consumer', 'Fresenius Medical', 'Beiersdorf Nivea', 'E.ON Energy',
  'Puma Athletic', 'Heidelberg Cement', 'Covestro Polymers', 'Symrise Flavors',
  'Zalando Retail', 'Delivery Hero', 'HelloFresh Platform', 'Brenntag Solutions',
  'Rheinmetall Defense', 'Knorr-Bremse Rail', 'Nemetschek Software', 'TeamViewer Systems',
  'Bechtle IT', 'Aixtron Photonics', 'Wacker Chemie', 'Kion Material Handling',
  'Carl Zeiss Meditec', 'Evonik Specialty', 'Rational AG', 'United Internet Cloud',
  'Hugo Boss Global', 'Fielmann Vision', 'Daimler Truck', 'Traton Logistics',
  'Software AG', 'Vitesco Tech', 'Aurubis Copper', 'LANXESS Specialty',
  'Gerresheimer Packaging', 'Hensoldt Sensors', 'Siltronic Wafers', 'Krones Bottling',
  'Nordex Wind', 'Sartorius Biotech', 'SMA Solar', 'Cancom Cloud',
  'Encavis Clean', 'Jenoptik Optical', 'Duerr Robotics', 'Jungheinrich Logistics',
  'Scout24 Media', 'MorphoSys Bio', 'Stroeer Out-of-Home', 'Hypoport Fintech',
  'CompuGroup Medical', 'Varta Storage', 'Evotec Drug Discovery', 'Krones Packaging',
  'Sixt Mobility', 'CTS Eventim', 'Kloeckner Metals', 'ProSiebenSat.1',
  'Hapag-Lloyd Maritime', 'Talanx Insurance', 'Hannover Re', 'Munich Re Group'
];

const prefixes = ['Global', 'Advanced', 'Integrated', 'NextGen', 'Strategic', 'Unified', 'Premier', 'Apex', 'Core', 'Vanguard'];
const suffixes = ['Holdings', 'Solutions', 'Ventures', 'Technologies', 'Systems', 'International', 'Group', 'AG', 'GmbH', 'LLC', 'Corp'];
const categories = ['Enterprise', 'Mid-Market', 'Tier 1 Partner', 'SMB', 'Strategic Wholesale', 'Public Sector'];
const statuses = ['Active', 'Pending', 'Archived', 'Suspended', 'Completed', 'Flagged'];
const countries = [
  { name: 'Germany', region: 'DACH', weight: 0.28 },
  { name: 'United States', region: 'Americas', weight: 0.26 },
  { name: 'United Kingdom', region: 'EMEA', weight: 0.14 },
  { name: 'France', region: 'EMEA', weight: 0.10 },
  { name: 'Japan', region: 'APAC', weight: 0.08 },
  { name: 'Canada', region: 'Americas', weight: 0.06 },
  { name: 'Australia', region: 'APAC', weight: 0.04 },
  { name: 'Switzerland', region: 'DACH', weight: 0.04 },
];

const RECORDS_TO_ADD = 11000;
const CHUNK_SIZE = 2500;

async function run() {
  console.log('=== DataScope Record Ingestion: Adding 11,000 Indexed Records ===');
  const startTime = performance.now();
  const client = await getRawClient();

  try {
    // 1. Get current count and max ID for ds-sales-01
    const countRes = await client.query(`
      SELECT count(*)::int AS count 
      FROM dataset_records 
      WHERE dataset_id = 'ds-sales-01';
    `);
    const currentSalesCount = countRes.rows[0]?.count || 100000;
    console.log(`Current ds-sales-01 record count: ${currentSalesCount.toLocaleString()}`);

    const maxKeyRes = await client.query(`
      SELECT record_key 
      FROM dataset_records 
      WHERE dataset_id = 'ds-sales-01' 
      ORDER BY record_key DESC 
      LIMIT 1;
    `);
    let startOffset = currentSalesCount;
    if (maxKeyRes.rows.length > 0) {
      const match = maxKeyRes.rows[0].record_key.match(/\d+/);
      if (match) {
        startOffset = Math.max(startOffset, parseInt(match[0], 10));
      }
    }
    console.log(`Starting generation from offset index: ${startOffset + 1}`);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 86400000;
    const ninetyDaysAgo = now - 90 * 86400000;

    let insertedTotal = 0;
    const totalBatches = Math.ceil(RECORDS_TO_ADD / CHUNK_SIZE);

    for (let b = 0; b < totalBatches; b++) {
      const currentBatchCount = Math.min(CHUNK_SIZE, RECORDS_TO_ADD - b * CHUNK_SIZE);
      const valueStrings: string[] = [];

      for (let i = 0; i < currentBatchCount; i++) {
        const globalIndex = startOffset + b * CHUNK_SIZE + i + 1;
        const recordKey = `ACC-${String(globalIndex).padStart(7, '0')}`;
        const id = `rec-sales-${String(globalIndex).padStart(7, '0')}`;

        const compBase = companies[globalIndex % companies.length];
        const prefix = prefixes[(globalIndex * 7) % prefixes.length];
        const suffix = suffixes[(globalIndex * 13) % suffixes.length];
        const title = `${prefix} ${compBase} ${suffix}`.replace(/'/g, "''");

        const category = categories[globalIndex % categories.length];

        // Ensure 70% active for rich benchmark testing
        const statusIdx = (globalIndex % 100 < 70) ? 0 : (globalIndex % 100 < 82) ? 1 : (globalIndex % 100 < 90) ? 2 : (globalIndex % 100 < 94) ? 3 : (globalIndex % 100 < 97) ? 4 : 5;
        const status = statuses[statusIdx];

        // Revenue distribution
        const isMegaTier = (globalIndex % 100) < 10;
        const isMidTier = (globalIndex % 100) < 40;
        const revenue = isMegaTier
          ? Math.round(500000 + (globalIndex % 4500000))
          : isMidTier
            ? Math.round(25000 + (globalIndex % 475000))
            : Math.round(10500 + (globalIndex % 14500)); // Ensure plenty > 10,000

        const countryObj = countries[globalIndex % countries.length];
        const country = countryObj.name;
        const region = countryObj.region;

        // Generate date: 40% in last 30 days, 30% in last 90 days, rest older
        let randomTime: number;
        if (globalIndex % 10 < 4) {
          randomTime = thirtyDaysAgo + ((globalIndex * 31337) % (28 * 86400000));
        } else if (globalIndex % 10 < 7) {
          randomTime = ninetyDaysAgo + ((globalIndex * 17337) % (60 * 86400000));
        } else {
          randomTime = now - (180 * 86400000) + ((globalIndex * 7337) % (90 * 86400000));
        }
        const recordDate = new Date(randomTime).toISOString();

        const metadata = JSON.stringify({
          industry: compBase.split(' ')[1] || 'Technology',
          tier: isMegaTier ? 'Tier 1 Platinum' : isMidTier ? 'Tier 2 Gold' : 'Standard Silver',
          leadSource: (globalIndex % 2 === 0) ? 'Outbound Enterprise' : 'Inbound Platform',
          riskScore: (globalIndex * 19) % 100,
          contractTermMonths: [12, 24, 36, 48][globalIndex % 4],
          primaryContact: `exec_${globalIndex % 500}@${compBase.toLowerCase().replace(/[^a-z]/g, '')}.com`,
          notes: `Enterprise indexed record for ${country} - Verified compliance`,
        }).replace(/'/g, "''");

        const searchVectorContent = `${recordKey} ${title} ${category} ${country} ${region} ${status}`.replace(/'/g, "''");

        valueStrings.push(
          `('${id}', 'ds-sales-01', '${recordKey}', '${title}', '${category}', '${status}', ${revenue}, '${country}', '${region}', '${recordDate}', '${metadata}', to_tsvector('english', '${searchVectorContent}'))`
        );
      }

      await client.query(`
        INSERT INTO dataset_records (
          id, dataset_id, record_key, title, category, status, numeric_value, 
          country, region, record_date, metadata, search_vector
        )
        VALUES ${valueStrings.join(',\n')}
        ON CONFLICT (id) DO NOTHING;
      `);

      insertedTotal += currentBatchCount;
      const pct = Math.round((insertedTotal / RECORDS_TO_ADD) * 100);
      console.log(` -> Inserted batch ${b + 1}/${totalBatches} (${insertedTotal.toLocaleString()} / ${RECORDS_TO_ADD.toLocaleString()} records, ${pct}%)...`);
    }

    // 2. Update datasets metadata table
    const updateRes = await client.query(`
      UPDATE datasets 
      SET total_records = (SELECT count(*)::int FROM dataset_records WHERE dataset_id = 'ds-sales-01'),
          updated_at = NOW()
      WHERE id = 'ds-sales-01'
      RETURNING total_records;
    `);
    const newTotalInDataset = updateRes.rows[0]?.total_records;

    const totalAllRes = await client.query(`
      SELECT count(*)::int AS total_count FROM dataset_records;
    `);
    const newTotalOverall = totalAllRes.rows[0]?.total_count;

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`\n=== Successfully added ${insertedTotal.toLocaleString()} indexed records in ${elapsed}s ===`);
    console.log(`New ds-sales-01 total: ${newTotalInDataset.toLocaleString()} records`);
    console.log(`New platform-wide total: ${newTotalOverall.toLocaleString()} records`);

  } catch (err) {
    console.error('Error during record insertion:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
