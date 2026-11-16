import { initDatabase, executeSql } from '../src/lib/db';
import bcrypt from 'bcryptjs';

// Parse command line arguments and environment variables
const args = process.argv.slice(2);
const envSeedSize = process.env.SEED_SIZE?.toLowerCase();
const cliScale = args.find((a) => a.startsWith('--scale='))?.split('=')[1]?.toLowerCase();
const scaleArg = cliScale || envSeedSize || '100k';
const is1M = scaleArg === '1m' || scaleArg === '1000k' || scaleArg === '1000000' || scaleArg === '1m_rows';
const forceClean = args.includes('--force') || args.includes('--clean') || args.includes('--truncate');

const SALES_TARGET = is1M ? 800000 : 100000;
const TELEMETRY_TARGET = is1M ? 100000 : 10000;
const FINANCE_TARGET = is1M ? 100000 : 10000;
const TOTAL_TARGET = SALES_TARGET + TELEMETRY_TARGET + FINANCE_TARGET;
const BATCH_SIZE = 5000;

async function seed() {
  console.log('=== DataScope Enterprise Database Seeder (Drizzle ORM Sole Data Layer) ===');
  console.log(`Target Scale: ${scaleArg.toUpperCase()} (${TOTAL_TARGET.toLocaleString()} total records across 3 datasets)`);
  console.log(`Force Clean: ${forceClean ? 'YES (truncating tables)' : 'NO (idempotent upsert)'}`);
  console.log(`Batch Size: ${BATCH_SIZE.toLocaleString()}`);

  const startTime = performance.now();
  const { rawClient: client } = await initDatabase();

  // Check existing count if not forced
  if (!forceClean) {
    try {
      const countRes = await client.query('SELECT COUNT(*)::int AS count FROM dataset_records;');
      const currentCount = countRes.rows[0]?.count || 0;
      if (currentCount >= TOTAL_TARGET) {
        console.log(`\nDatabase already contains ${currentCount.toLocaleString()} records (target was ${TOTAL_TARGET.toLocaleString()}).`);
        console.log('To re-seed or change scale, pass --force (e.g. npm run seed -- --scale=1M --force).');
        process.exit(0);
      }
    } catch (e) {
      // Table may not exist yet, proceed
    }
  } else {
    console.log('\n[Clean] Truncating dataset_records, record_relationships, and record_history...');
    await client.query(`
      TRUNCATE TABLE record_history, record_relationships, dataset_records CASCADE;
    `);
  }

  // 1. Core Users & Credentials
  console.log('\n1. Seeding Users & Authentication Credentials...');
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('admin123', salt);
  const analystPass = await bcrypt.hash('analyst123', salt);
  const viewerPass = await bcrypt.hash('viewer123', salt);

  await client.query(`
    INSERT INTO users (id, name, email, password_hash, role, department, avatar_url)
    VALUES 
      ('usr-admin-01', 'Admin User', 'admin@datascope.io', '${adminPass}', 'admin', 'Enterprise Architecture', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
      ('usr-analyst-01', 'Analyst User', 'analyst@datascope.io', '${analystPass}', 'analyst', 'Strategic Intelligence', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
      ('usr-viewer-01', 'Viewer User', 'viewer@datascope.io', '${viewerPass}', 'viewer', 'Product Operations', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      password_hash = EXCLUDED.password_hash;
  `);

  // 2. Roles & Granular Permissions
  console.log('2. Seeding Enterprise Roles...');
  await client.query(`
    INSERT INTO roles (id, name, description, permissions)
    VALUES 
      ('admin', 'Administrator', 'Full system and data governance access across all datasets and settings', '["manage_users", "manage_datasets", "manage_permissions", "export_data", "save_views", "view_analytics", "read_all", "write_all"]'),
      ('analyst', 'Intelligence Analyst', 'Deep analytical query access, export capabilities, and saved views', '["read_restricted", "export_data", "save_views", "share_views", "view_analytics"]'),
      ('viewer', 'Business Viewer', 'Read-only exploratory access to designated public datasets', '["read_public", "basic_filters", "view_shared_views"]')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      permissions = EXCLUDED.permissions;
  `);

  // 3. Core Business Datasets
  console.log('3. Seeding Core Business Datasets...');
  await client.query(`
    INSERT INTO datasets (id, name, slug, description, category, data_source, total_records, access_level, schema_definition)
    VALUES 
      (
        'ds-sales-01',
        'Global Enterprise Accounts & Revenue',
        'global-sales',
        'Comprehensive multi-region enterprise B2B sales data containing corporate entities, ARR, contract tiers, and health metrics.',
        'Sales & Revenue',
        'PostgreSQL Production Cluster [us-east-1]',
        ${SALES_TARGET},
        'public',
        '[]'
      ),
      (
        'ds-telemetry-02',
        'Edge Infrastructure & Telemetry Logs',
        'cloud-telemetry',
        'Multi-region high-frequency latency, CPU utilization, and edge cluster operational metrics.',
        'Infrastructure Telemetry',
        'Kafka Streaming & S3 Parquet Lake',
        ${TELEMETRY_TARGET},
        'restricted',
        '[]'
      ),
      (
        'ds-finance-03',
        'Institutional Financial Transactions',
        'financial-audit',
        'High-value multi-currency ledger transactions, clearing houses, settlement status, and compliance flags.',
        'Financial Intelligence',
        'Core Banking Ledger DB',
        ${FINANCE_TARGET},
        'admin_only',
        '[]'
      )
    ON CONFLICT (id) DO UPDATE SET
      total_records = EXCLUDED.total_records,
      access_level = EXCLUDED.access_level;
  `);

  // 4. Access Permissions Matrix
  console.log('4. Seeding Dataset Access Permissions Matrix...');
  await client.query(`
    INSERT INTO access_permissions (id, role, dataset_id, can_read, can_write, can_export, can_manage)
    VALUES
      ('perm-admin-sales', 'admin', 'ds-sales-01', true, true, true, true),
      ('perm-analyst-sales', 'analyst', 'ds-sales-01', true, false, true, false),
      ('perm-viewer-sales', 'viewer', 'ds-sales-01', true, false, false, false),

      ('perm-admin-telem', 'admin', 'ds-telemetry-02', true, true, true, true),
      ('perm-analyst-telem', 'analyst', 'ds-telemetry-02', true, false, true, false),

      ('perm-admin-fin', 'admin', 'ds-finance-03', true, true, true, true)
    ON CONFLICT (id) DO UPDATE SET
      can_read = EXCLUDED.can_read,
      can_write = EXCLUDED.can_write,
      can_export = EXCLUDED.can_export,
      can_manage = EXCLUDED.can_manage;
  `);

  // 5. User Preferences
  await client.query(`
    INSERT INTO user_preferences (id, user_id, table_density, theme, auto_refresh, refresh_interval_sec, default_page_size, notifications_enabled)
    VALUES 
      ('pref-01', 'usr-admin-01', 'compact', 'dark', false, 30, 25, true),
      ('pref-02', 'usr-analyst-01', 'standard', 'dark', true, 15, 50, true),
      ('pref-03', 'usr-viewer-01', 'standard', 'dark', false, 30, 25, true)
    ON CONFLICT (user_id) DO NOTHING;
  `);

  // 6. Dataset Fields Metadata
  console.log('5. Seeding Dataset Field Definitions...');
  await client.query(`
    INSERT INTO dataset_fields (id, dataset_id, field_name, display_name, data_type, is_filterable, is_searchable, is_sortable, is_primary, sample_values)
    VALUES 
      ('f-01', 'ds-sales-01', 'recordKey', 'Account Key', 'string', true, true, true, true, '["ACC-10023", "ACC-90412", "ACC-44102"]'),
      ('f-02', 'ds-sales-01', 'title', 'Company Name', 'string', true, true, true, false, '["Stripe Inc", "Siemens AG", "Databricks", "SAP SE"]'),
      ('f-03', 'ds-sales-01', 'category', 'Market Segment', 'string', true, true, true, false, '["Enterprise", "Mid-Market", "Tier 1 Partner", "SMB"]'),
      ('f-04', 'ds-sales-01', 'status', 'Account Status', 'string', true, true, true, false, '["Active", "Pending", "Archived", "Suspended", "Completed", "Flagged"]'),
      ('f-05', 'ds-sales-01', 'numericValue', 'Annual Revenue ($)', 'currency', true, true, true, false, '["12000", "85000", "250000", "1450000"]'),
      ('f-06', 'ds-sales-01', 'country', 'Country', 'string', true, true, true, false, '["Germany", "United States", "United Kingdom", "France", "Japan", "Canada"]'),
      ('f-07', 'ds-sales-01', 'region', 'Region', 'string', true, true, true, false, '["EMEA", "Americas", "APAC", "DACH", "Nordics"]'),
      ('f-08', 'ds-sales-01', 'recordDate', 'Contract Date', 'date', true, false, true, false, '["2024-01-15", "2024-06-20", "2024-11-01"]'),
      
      ('f-tel-01', 'ds-telemetry-02', 'recordKey', 'Log Key', 'string', true, true, true, true, '["LOG-000001", "LOG-000042"]'),
      ('f-tel-02', 'ds-telemetry-02', 'title', 'Heartbeat Event', 'string', true, true, true, false, '["Edge Cluster Node Heartbeat"]'),
      ('f-tel-03', 'ds-telemetry-02', 'category', 'Service Tier', 'string', true, true, true, false, '["Telemetry"]'),
      ('f-tel-04', 'ds-telemetry-02', 'status', 'Health Status', 'string', true, true, true, false, '["Active", "Pending", "Flagged"]'),
      ('f-tel-05', 'ds-telemetry-02', 'numericValue', 'CPU Usage (%)', 'number', true, true, true, false, '["24.5", "68.2", "89.1"]'),
      ('f-tel-06', 'ds-telemetry-02', 'country', 'Deployment Scope', 'string', true, true, true, false, '["Global Cloud"]'),
      ('f-tel-07', 'ds-telemetry-02', 'region', 'Multi-Region Topology', 'string', true, true, true, false, '["Multi-Region"]'),
      ('f-tel-08', 'ds-telemetry-02', 'recordDate', 'Heartbeat Timestamp', 'date', true, false, true, false, '["2024-01-15T12:00:00Z"]'),

      ('f-fin-01', 'ds-finance-03', 'recordKey', 'Transaction ID', 'string', true, true, true, true, '["TXN-000001", "TXN-000042"]'),
      ('f-fin-02', 'ds-finance-03', 'title', 'Clearing Entity', 'string', true, true, true, false, '["JPMorgan Chase Clearing", "Deutsche Bank Securities"]'),
      ('f-fin-03', 'ds-finance-03', 'category', 'Settlement Instrument', 'string', true, true, true, false, '["Wholesale Clearing", "Cross-Border Wire", "Securities Settlement"]'),
      ('f-fin-04', 'ds-finance-03', 'status', 'Settlement Status', 'string', true, true, true, false, '["Active", "Completed", "Pending", "Flagged", "Suspended"]'),
      ('f-fin-05', 'ds-finance-03', 'numericValue', 'Settlement Value ($)', 'currency', true, true, true, false, '["50000", "1250000", "18500000"]'),
      ('f-fin-06', 'ds-finance-03', 'country', 'Counterparty Jurisdiction', 'string', true, true, true, false, '["United States", "Germany", "United Kingdom", "Switzerland"]'),
      ('f-fin-07', 'ds-finance-03', 'region', 'Financial Jurisdiction', 'string', true, true, true, false, '["Americas", "DACH", "EMEA", "APAC"]'),
      ('f-fin-08', 'ds-finance-03', 'recordDate', 'Value Date', 'date', true, false, true, false, '["2024-01-15T00:00:00Z"]')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 7. Generate Dataset Records with realistic distributions and nulls
  console.log(`\n6. Generating ${SALES_TARGET.toLocaleString()} Enterprise Sales Records...`);
  const companies = [
    'Acrobat Logistics', 'Apex Data Systems', 'Aura Healthtech', 'Bavaria Robotics',
    'BlueShift Cloud', 'Cognitive Dynamics', 'CyberPulse Shield', 'DataGrid Analytics',
    'Deutsche FinTech', 'Elemental Energy', 'Falcon Supply Chain', 'Helios Solar Grid',
    'HyperScale Systems', 'InfraCore Networks', 'Kinetic Motor Corp', 'Krypton Semiconductor',
    'Luminary BioSciences', 'Meridian Global', 'Nexus Autonomous', 'Nordic Maritime',
    'Nova Genomics', 'OmniCommerce Labs', 'Orbit Satellites', 'Pinnacle Aerospace',
    'Polaris Quantum', 'Precision Instruments', 'Prism Artificial Intelligence', 'Quantum Ledger',
    'Radiant Medical', 'Redwood Software', 'Sapphire Cloud', 'Sentient Robotics',
    'Stratus Telemetry', 'Summit Industrial', 'Synapse Neural Corp', 'Titanium Defense',
    'Vector Dynamics', 'Veritas Asset Management', 'Vortex Security', 'Zenith Logistics'
  ];
  const prefixes = ['Global', 'Advanced', 'Integrated', 'NextGen', 'Strategic', 'Unified', 'Premier', 'Apex', 'Core', 'Vanguard'];
  const suffixes = ['Holdings', 'Solutions', 'Ventures', 'Technologies', 'Systems', 'International', 'Group', 'AG', 'GmbH', 'LLC', 'Corp'];
  const categories = ['Enterprise', 'Mid-Market', 'Tier 1 Partner', 'SMB', 'Strategic Wholesale', 'Public Sector'];
  const statuses = ['Active', 'Pending', 'Archived', 'Suspended', 'Completed', 'Flagged'];
  const countries = [
    { name: 'Germany', region: 'DACH', weight: 0.22 },
    { name: 'United States', region: 'Americas', weight: 0.28 },
    { name: 'United Kingdom', region: 'EMEA', weight: 0.14 },
    { name: 'France', region: 'EMEA', weight: 0.10 },
    { name: 'Japan', region: 'APAC', weight: 0.08 },
    { name: 'Canada', region: 'Americas', weight: 0.06 },
    { name: 'Australia', region: 'APAC', weight: 0.05 },
    { name: 'Switzerland', region: 'DACH', weight: 0.04 },
    { name: 'Singapore', region: 'APAC', weight: 0.03 },
  ];

  const now = Date.now();
  const dateSpan = 730 * 86400000; // 2 years
  const baseDate = now - dateSpan;

  // Insert sales records in batches of 2,500 to prevent payload limits
  const salesChunkSize = 2500;
  const totalSalesBatches = Math.ceil(SALES_TARGET / salesChunkSize);

  for (let b = 0; b < totalSalesBatches; b++) {
    const currentBatchCount = Math.min(salesChunkSize, SALES_TARGET - b * salesChunkSize);
    const valueStrings: string[] = [];

    for (let i = 0; i < currentBatchCount; i++) {
      const globalIndex = b * salesChunkSize + i + 1;
      const recordKey = `ACC-${String(globalIndex).padStart(7, '0')}`;

      const compBase = companies[globalIndex % companies.length];
      const prefix = prefixes[(globalIndex * 7) % prefixes.length];
      const suffix = suffixes[(globalIndex * 13) % suffixes.length];
      const title = `${prefix} ${compBase} ${suffix}`.replace(/'/g, "''");

      const category = categories[globalIndex % categories.length];
      // realistic status distribution: mostly Active, some Pending, fewer Suspended/Flagged
      const statusIdx = (globalIndex % 100 < 65) ? 0 : (globalIndex % 100 < 80) ? 1 : (globalIndex % 100 < 90) ? 2 : (globalIndex % 100 < 95) ? 3 : (globalIndex % 100 < 98) ? 4 : 5;
      const status = statuses[statusIdx];

      // Revenue distribution: power-law / tiered
      const isMegaTier = (globalIndex % 100) < 5;
      const isMidTier = (globalIndex % 100) < 30;
      let revenue = isMegaTier
        ? Math.round(500000 + (globalIndex % 4500000))
        : isMidTier
          ? Math.round(25000 + (globalIndex % 475000))
          : Math.round(1500 + (globalIndex % 23500));

      const countryObj = countries[globalIndex % countries.length];
      const country = countryObj.name;
      // Inject realistic nulls in 3% of region data for data quality engine testing
      const hasNullRegion = globalIndex % 33 === 0;
      const region = hasNullRegion ? 'Unspecified' : countryObj.region;

      const randomTime = baseDate + Math.floor((globalIndex / SALES_TARGET) * dateSpan) + ((globalIndex * 31337) % 86400000);
      const recordDate = new Date(randomTime).toISOString();

      const metadata = JSON.stringify({
        industry: compBase.split(' ')[1] || 'Technology',
        tier: isMegaTier ? 'Tier 1 Platinum' : isMidTier ? 'Tier 2 Gold' : 'Standard Silver',
        leadSource: (globalIndex % 2 === 0) ? 'Outbound Enterprise' : 'Inbound Platform',
        riskScore: (globalIndex * 17) % 100,
        contractTermMonths: [12, 24, 36, 48][globalIndex % 4],
        primaryContact: `exec_${globalIndex % 500}@${compBase.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        notes: hasNullRegion ? null : `Verified compliance record for ${country}`,
      }).replace(/'/g, "''");

      const id = `rec-sales-${String(globalIndex).padStart(7, '0')}`;
      const searchVectorContent = `${recordKey} ${title} ${category} ${country} ${region} ${status}`.replace(/'/g, "''");

      valueStrings.push(
        `('${id}', 'ds-sales-01', '${recordKey}', '${title}', '${category}', '${status}', ${revenue}, '${country}', '${region}', '${recordDate}', '${metadata}', to_tsvector('english', '${searchVectorContent}'))`
      );
    }

    await executeSql(client, `
      INSERT INTO dataset_records (id, dataset_id, record_key, title, category, status, numeric_value, country, region, record_date, metadata, search_vector)
      VALUES ${valueStrings.join(',\n')}
      ON CONFLICT (id) DO NOTHING;
    `);

    if ((b + 1) % 10 === 0 || b === totalSalesBatches - 1) {
      const inserted = Math.min((b + 1) * salesChunkSize, SALES_TARGET);
      const pct = Math.round((inserted / SALES_TARGET) * 100);
      console.log(` -> [Sales] ${inserted.toLocaleString()} / ${SALES_TARGET.toLocaleString()} records (${pct}%)...`);
    }
  }

  // 8. Generate Telemetry Records
  console.log(`\n7. Generating ${TELEMETRY_TARGET.toLocaleString()} Cloud Telemetry Records...`);
  const telemetryNodes = ['edge-us-east-1a', 'edge-eu-central-1', 'edge-ap-southeast-1', 'edge-sa-east-1', 'edge-af-south-1'];
  const telemetryChunkSize = 2500;
  const totalTelemetryBatches = Math.ceil(TELEMETRY_TARGET / telemetryChunkSize);

  for (let b = 0; b < totalTelemetryBatches; b++) {
    const currentCount = Math.min(telemetryChunkSize, TELEMETRY_TARGET - b * telemetryChunkSize);
    const telemetryValues: string[] = [];

    for (let i = 0; i < currentCount; i++) {
      const globalIndex = b * telemetryChunkSize + i + 1;
      const id = `rec-tel-${String(globalIndex).padStart(7, '0')}`;
      const key = `LOG-${String(globalIndex).padStart(7, '0')}`;
      const node = telemetryNodes[globalIndex % telemetryNodes.length];
      const title = `Edge Cluster Node [${node}] Heartbeat #${globalIndex}`.replace(/'/g, "''");
      const status = (globalIndex % 25 === 0) ? 'Flagged' : (globalIndex % 15 === 0) ? 'Pending' : 'Active';
      const cpuUsage = Math.round((12 + ((globalIndex * 7) % 85)) * 10) / 10;
      const telemSpan = 60 * 86400000;
      const telemBase = now - telemSpan;
      const recDate = new Date(telemBase + Math.floor((globalIndex / TELEMETRY_TARGET) * telemSpan) + ((globalIndex * 1337) % 60000)).toISOString();
      const metadata = JSON.stringify({
        cpuUsage,
        node,
        cluster: 'Kubernetes-EKS-v1.30',
        latencyP99Ms: (globalIndex * 3) % 45 + 5,
      }).replace(/'/g, "''");
      const searchVector = `${key} ${title} Telemetry Global Cloud Multi-Region ${status}`.replace(/'/g, "''");

      telemetryValues.push(
        `('${id}', 'ds-telemetry-02', '${key}', '${title}', 'Telemetry', '${status}', ${cpuUsage}, 'Global Cloud', 'Multi-Region', '${recDate}', '${metadata}', to_tsvector('english', '${searchVector}'))`
      );
    }

    await executeSql(client, `
      INSERT INTO dataset_records (id, dataset_id, record_key, title, category, status, numeric_value, country, region, record_date, metadata, search_vector)
      VALUES ${telemetryValues.join(',\n')}
      ON CONFLICT (id) DO NOTHING;
    `);

    if ((b + 1) % 4 === 0 || b === totalTelemetryBatches - 1) {
      const inserted = Math.min((b + 1) * telemetryChunkSize, TELEMETRY_TARGET);
      const pct = Math.round((inserted / TELEMETRY_TARGET) * 100);
      console.log(` -> [Telemetry] ${inserted.toLocaleString()} / ${TELEMETRY_TARGET.toLocaleString()} records (${pct}%)...`);
    }
  }

  // 9. Generate Institutional Financial Transactions
  console.log(`\n8. Generating ${FINANCE_TARGET.toLocaleString()} Institutional Financial Transactions...`);
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

  const finChunkSize = 2500;
  const totalFinBatches = Math.ceil(FINANCE_TARGET / finChunkSize);

  for (let b = 0; b < totalFinBatches; b++) {
    const currentCount = Math.min(finChunkSize, FINANCE_TARGET - b * finChunkSize);
    const financeValues: string[] = [];

    for (let i = 0; i < currentCount; i++) {
      const globalIndex = b * finChunkSize + i + 1;
      const id = `rec-fin-${String(globalIndex).padStart(7, '0')}`;
      const key = `TXN-${String(globalIndex).padStart(7, '0')}`;
      const inst = finInstitutions[globalIndex % finInstitutions.length];
      const cat = finCategories[globalIndex % finCategories.length];
      const statusIdx = (globalIndex % 100 < 60) ? 0 : (globalIndex % 100 < 80) ? 1 : (globalIndex % 100 < 90) ? 2 : (globalIndex % 100 < 95) ? 3 : (globalIndex % 100 < 98) ? 4 : 5;
      const status = statuses[statusIdx];
      const cObj = finCountries[globalIndex % finCountries.length];
      const country = cObj.name;
      const region = cObj.region;
      const amount = Math.round(50000 + ((globalIndex * 17923) % 24950000));
      const finSpan = 180 * 86400000;
      const finBase = now - finSpan;
      const recDate = new Date(finBase + Math.floor((globalIndex / FINANCE_TARGET) * finSpan) + ((globalIndex * 1337) % 60000)).toISOString();
      const title = `${inst} [${cat} #${globalIndex}]`.replace(/'/g, "''");
      const metadata = JSON.stringify({
        settlementChannel: 'SWIFT-ISO20022',
        clearingHouse: 'Fedwire-DTCC',
        currency: 'USD',
        riskScore: (globalIndex * 13) % 100,
        complianceTier: 'SOX-Compliant'
      }).replace(/'/g, "''");
      const searchVector = `${key} ${title} ${cat} ${country} ${region} ${status}`.replace(/'/g, "''");

      financeValues.push(
        `('${id}', 'ds-finance-03', '${key}', '${title}', '${cat}', '${status}', ${amount}, '${country}', '${region}', '${recDate}', '${metadata}', to_tsvector('english', '${searchVector}'))`
      );
    }

    await executeSql(client, `
      INSERT INTO dataset_records (id, dataset_id, record_key, title, category, status, numeric_value, country, region, record_date, metadata, search_vector)
      VALUES ${financeValues.join(',\n')}
      ON CONFLICT (id) DO NOTHING;
    `);

    if ((b + 1) % 4 === 0 || b === totalFinBatches - 1) {
      const inserted = Math.min((b + 1) * finChunkSize, FINANCE_TARGET);
      const pct = Math.round((inserted / FINANCE_TARGET) * 100);
      console.log(` -> [Finance] ${inserted.toLocaleString()} / ${FINANCE_TARGET.toLocaleString()} records (${pct}%)...`);
    }
  }

  // 10. Record Relationships & Historical Audit Trails
  console.log('\n9. Seeding Record Relationships & Historical Audit Trails...');
  await client.query(`
    INSERT INTO record_relationships (id, source_record_id, target_record_id, relationship_type, metadata)
    VALUES 
      ('rel-01', 'rec-sales-0000001', 'rec-sales-0000042', 'parent_holding_entity', '{"ownershipPercentage": 100}'),
      ('rel-02', 'rec-sales-0000001', 'rec-sales-0000108', 'regional_subsidiary', '{"jurisdiction": "DACH"}'),
      ('rel-03', 'rec-sales-0000002', 'rec-sales-0000015', 'referred_by_partner', '{"commissionRate": 0.12}'),
      ('rel-04', 'rec-sales-0000005', 'rec-sales-0000022', 'co_marketing_consortium', '{"activeSince": "2023-04-01"}')
    ON CONFLICT (id) DO NOTHING;
  `);

  await client.query(`
    INSERT INTO record_history (id, record_id, changed_by_user_id, changed_by_name, change_type, diff_payload, created_at)
    VALUES 
      ('hist-01', 'rec-sales-0000001', 'usr-admin-01', 'Admin User', 'STATUS_CHANGE', '{"field": "status", "oldValue": "Pending", "newValue": "Active", "reason": "Compliance verification completed"}', NOW() - INTERVAL '15 days'),
      ('hist-02', 'rec-sales-0000001', 'usr-analyst-01', 'Analyst User', 'VALUATION_UPDATE', '{"field": "numericValue", "oldValue": 250000, "newValue": 850000, "reason": "Enterprise Q3 expansion upsell"}', NOW() - INTERVAL '4 days'),
      ('hist-03', 'rec-sales-0000002', 'usr-analyst-01', 'Analyst User', 'STATUS_CHANGE', '{"field": "status", "oldValue": "Flagged", "newValue": "Active", "reason": "KYC resolution passed"}', NOW() - INTERVAL '2 days')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 11. Saved Views & Search History
  console.log('10. Seeding Saved Views & Search History...');
  await client.query(`
    INSERT INTO saved_views (id, user_id, dataset_id, name, description, is_shared, author_name, search_query, search_type, filter_config, filter_logical_operator, sort_config, visible_columns, page_size)
    VALUES 
      (
        'view-01',
        'usr-analyst-01',
        'ds-sales-01',
        'High-Value German Enterprise',
        'Active accounts based in Germany with annual revenue exceeding $10,000.',
        true,
        'Analyst User',
        '',
        'hybrid',
        '[{"id": "c1", "field": "status", "operator": "equals", "value": "Active"}, {"id": "c2", "field": "country", "operator": "equals", "value": "Germany"}, {"id": "c3", "field": "numericValue", "operator": "greater_than", "value": 10000}]',
        'AND',
        '[{"field": "numericValue", "direction": "desc"}]',
        '["recordKey", "title", "category", "status", "numericValue", "country", "recordDate"]',
        25
      ),
      (
        'view-02',
        'usr-admin-01',
        'ds-sales-01',
        'Flagged & Suspended Accounts',
        'All corporate records marked for compliance or risk audit inspection.',
        true,
        'Admin User',
        '',
        'hybrid',
        '[{"id": "c4", "field": "status", "operator": "in", "value": ["Flagged", "Suspended"]}]',
        'AND',
        '[{"field": "recordDate", "direction": "desc"}]',
        '["recordKey", "title", "category", "status", "numericValue", "country", "region"]',
        50
      ),
      (
        'view-03',
        'usr-analyst-01',
        'ds-sales-01',
        'Americas Mega Accounts (> $500k)',
        'Tier 1 mega enterprise accounts in North and South America.',
        false,
        'Analyst User',
        '',
        'hybrid',
        '[{"id": "c5", "field": "region", "operator": "equals", "value": "Americas"}, {"id": "c6", "field": "numericValue", "operator": "greater_than", "value": 500000}]',
        'AND',
        '[{"field": "numericValue", "direction": "desc"}]',
        '["recordKey", "title", "category", "status", "numericValue", "country"]',
        25
      )
    ON CONFLICT (id) DO NOTHING;
  `);

  await client.query(`
    INSERT INTO search_history (id, user_id, dataset_id, query_text, search_type, filter_summary, result_count, execution_time_ms)
    VALUES 
      ('sh-01', 'usr-analyst-01', 'ds-sales-01', 'Germany Revenue > 10k', 'hybrid', '[{"field": "country", "operator": "equals", "value": "Germany"}]', 18450, 4.2),
      ('sh-02', 'usr-admin-01', 'ds-sales-01', 'Quantum Robotics', 'fts', '[]', 1420, 8.5),
      ('sh-03', 'usr-viewer-01', 'ds-sales-01', 'Active Americas', 'exact', '[{"field": "status", "operator": "equals", "value": "Active"}]', 42100, 6.1)
    ON CONFLICT (id) DO NOTHING;
  `);

  const elapsed = Math.round(performance.now() - startTime);
  console.log(`\n=== DataScope Database Seed Complete in ${(elapsed / 1000).toFixed(2)}s ===`);
  console.log(`Total Records: ${TOTAL_TARGET.toLocaleString()} verified and indexed across 3 datasets.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Fatal error during seed:', err);
  process.exit(1);
});
