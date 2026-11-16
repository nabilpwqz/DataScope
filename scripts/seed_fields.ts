import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

// Automatically load environment variables from .env if not already present in environment
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...values] = trimmed.split('=');
          const value = values.join('=').trim().replace(/^["']|["']$/g, '');
          if (key && !process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    }
  } catch (err) {
    // Notice: environment parsing fallback
  }
}

// Read database connection string strictly from environment variable
const rawDatabaseUrl = process.env.DATABASE_URL;

if (!rawDatabaseUrl) {
  console.error('Error: DATABASE_URL environment variable is not defined.');
  console.error('Please configure DATABASE_URL in your .env file or deployment environment.');
  process.exit(1);
}

const databaseUrl: string = rawDatabaseUrl;

async function seedFields() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await pool.query(`
      INSERT INTO dataset_fields (id, dataset_id, field_name, display_name, data_type, is_filterable, is_searchable, is_sortable, is_primary, sample_values)
      VALUES 
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

    const res = await pool.query('SELECT dataset_id, count(*)::int FROM dataset_fields GROUP BY dataset_id;');
    console.log('Updated fields per dataset:', res.rows);
  } finally {
    await pool.end();
  }
}

seedFields().catch(console.error);
