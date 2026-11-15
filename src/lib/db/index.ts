import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { drizzle as drizzlePgLite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

type DbInstance = ReturnType<typeof drizzlePgLite<typeof schema>>;

interface GlobalDbState {
  db: DbInstance | null;
  rawClient: any | null;
  initialized: boolean;
  initPromise: Promise<void> | null;
  engineType: 'remote-postgres' | 'embedded-pglite';
}

const globalForDb = globalThis as unknown as {
  __dataScopeDb: GlobalDbState | undefined;
};

if (!globalForDb.__dataScopeDb) {
  globalForDb.__dataScopeDb = {
    db: null,
    rawClient: null,
    initialized: false,
    initPromise: null,
    engineType: 'embedded-pglite',
  };
}

const state = globalForDb.__dataScopeDb;

// Fallback production PostgreSQL database (Neon Serverless PostgreSQL Cluster with 120,000+ records)
export const PRODUCTION_DEFAULT_DATABASE_URL =
  'postgresql://neondb_owner:npg_Kb9AgZ4jIBOd@ep-silent-smoke-ao9xf02q-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

export async function initDatabase(): Promise<{ db: DbInstance; rawClient: any; engineType: string }> {
  if (state.db && state.initialized) {
    return { db: state.db, rawClient: state.rawClient, engineType: state.engineType };
  }

  if (state.initPromise) {
    await state.initPromise;
    return { db: state.db!, rawClient: state.rawClient, engineType: state.engineType };
  }

  state.initPromise = (async () => {
    const rawEnvUrl = process.env.DATABASE_URL;
    const forceEmbedded = process.env.PG_FORCE_EMBEDDED === 'true';
    const databaseUrl = forceEmbedded
      ? ''
      : (rawEnvUrl && rawEnvUrl.trim() !== '' ? rawEnvUrl : PRODUCTION_DEFAULT_DATABASE_URL);

    if (databaseUrl && databaseUrl.trim() !== '') {
      // Connect to remote or cloud PostgreSQL instance (Neon, Supabase, AWS RDS, Tembo, etc.)
      const isLocalhost =
        databaseUrl.includes('localhost') ||
        databaseUrl.includes('127.0.0.1') ||
        databaseUrl.includes('postgres:5432');

      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      const drizzleInstance = drizzlePg(pool, { schema }) as unknown as DbInstance;
      state.db = drizzleInstance;
      state.rawClient = pool;
      state.engineType = 'remote-postgres';
    } else {
      // Embedded WebAssembly PostgreSQL (PGlite)
      const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const defaultDir = isServerless ? '/tmp/.pgdata' : path.join(process.cwd(), '.pgdata');
      const dataDir = process.env.PG_DATA_DIR || defaultDir;

      // Handle Vercel / Serverless ephemeral /tmp storage
      if (isServerless && !fs.existsSync(dataDir)) {
        const bundledDir = path.join(process.cwd(), '.pgdata');
        if (fs.existsSync(bundledDir)) {
          try {
            copyDirectoryRecursive(bundledDir, dataDir);
          } catch (copyErr) {
            console.warn('Could not copy bundled .pgdata to /tmp, starting fresh:', copyErr);
            fs.mkdirSync(dataDir, { recursive: true });
          }
        } else {
          fs.mkdirSync(dataDir, { recursive: true });
        }
      } else if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Clean up stale lock and postmaster pid files if left by previous abnormal process exits
      try {
        const pidFile = path.join(dataDir, 'postmaster.pid');
        if (fs.existsSync(pidFile)) {
          fs.unlinkSync(pidFile);
        }
        const files = fs.readdirSync(dataDir);
        for (const f of files) {
          if (f.includes('.lock') || f.startsWith('.s.PGSQL')) {
            try {
              fs.unlinkSync(path.join(dataDir, f));
            } catch (_) {}
          }
        }
      } catch (_) {}

      const pglite = new PGlite(dataDir, {
        extensions: { pg_trgm },
      });

      const drizzleInstance = drizzlePgLite(pglite, { schema });
      state.db = drizzleInstance;
      state.rawClient = pglite;
      state.engineType = 'embedded-pglite';
    }

    // Run schema creation, index creation, and ensure baseline demonstration data
    await ensureSchemaAndIndexes(state.rawClient);
    await ensureBaselineData(state.rawClient);
    state.initialized = true;
  })();

  await state.initPromise;
  return { db: state.db!, rawClient: state.rawClient, engineType: state.engineType };
}

function copyDirectoryRecursive(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.name.includes('.lock') || entry.name.startsWith('.s.PGSQL') || entry.name === 'postmaster.pid') {
      continue;
    }
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export async function executeSql(client: any, query: string, params: any[] = []) {
  if (params.length > 0) {
    return client.query(query, params);
  } else if (typeof client.exec === 'function') {
    return client.exec(query);
  } else if (typeof client.query === 'function') {
    return client.query(query);
  }
}

async function ensureSchemaAndIndexes(client: any) {
  try {
    // Quick existence check to bypass redundant DDL on warm remote databases
    const checkTable = await client.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'dataset_records' LIMIT 1;").catch(() => null);
    if (checkTable && checkTable.rows && checkTable.rows.length > 0) {
      return;
    }

    // 1. Extensions
    try {
      await executeSql(client, 'CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    } catch (_) {
      // pg_trgm may already be loaded or restricted
    }

    // 2. Core Tables
    await executeSql(
      client,
      `
      CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY,
        name text NOT NULL,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        role text NOT NULL,
        department text NOT NULL,
        avatar_url text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS datasets (
        id text PRIMARY KEY,
        name text NOT NULL,
        slug text NOT NULL UNIQUE,
        description text NOT NULL,
        category text NOT NULL,
        data_source text NOT NULL,
        total_records integer NOT NULL DEFAULT 0,
        access_level text NOT NULL DEFAULT 'public',
        schema_definition jsonb NOT NULL DEFAULT '[]',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS dataset_fields (
        id text PRIMARY KEY,
        dataset_id text NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
        field_name text NOT NULL,
        display_name text NOT NULL,
        data_type text NOT NULL,
        is_filterable boolean NOT NULL DEFAULT true,
        is_searchable boolean NOT NULL DEFAULT true,
        is_sortable boolean NOT NULL DEFAULT true,
        is_primary boolean NOT NULL DEFAULT false,
        sample_values jsonb DEFAULT '[]',
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS dataset_records (
        id text PRIMARY KEY,
        dataset_id text NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
        record_key text NOT NULL,
        title text NOT NULL,
        category text NOT NULL,
        status text NOT NULL,
        numeric_value double precision NOT NULL DEFAULT 0,
        country text NOT NULL,
        region text NOT NULL,
        record_date timestamptz NOT NULL,
        metadata jsonb NOT NULL DEFAULT '{}',
        search_vector text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS record_relationships (
        id text PRIMARY KEY,
        source_record_id text NOT NULL,
        target_record_id text NOT NULL,
        relationship_type text NOT NULL,
        metadata jsonb DEFAULT '{}',
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS record_history (
        id text PRIMARY KEY,
        record_id text NOT NULL,
        changed_by_user_id text NOT NULL,
        changed_by_name text NOT NULL,
        change_type text NOT NULL,
        diff_payload jsonb NOT NULL DEFAULT '{}',
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS saved_views (
        id text PRIMARY KEY,
        user_id text NOT NULL,
        dataset_id text NOT NULL,
        name text NOT NULL,
        description text,
        is_shared boolean NOT NULL DEFAULT false,
        author_name text,
        search_query text DEFAULT '',
        search_type text DEFAULT 'hybrid',
        filter_config jsonb NOT NULL DEFAULT '[]',
        filter_logical_operator text NOT NULL DEFAULT 'AND',
        sort_config jsonb NOT NULL DEFAULT '[]',
        visible_columns jsonb NOT NULL DEFAULT '[]',
        page_size integer NOT NULL DEFAULT 25,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS search_history (
        id text PRIMARY KEY,
        user_id text NOT NULL,
        dataset_id text NOT NULL,
        query_text text NOT NULL,
        search_type text NOT NULL DEFAULT 'hybrid',
        filter_summary jsonb NOT NULL DEFAULT '[]',
        result_count integer NOT NULL DEFAULT 0,
        execution_time_ms real NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS user_preferences (
        id text PRIMARY KEY,
        user_id text NOT NULL UNIQUE,
        table_density text NOT NULL DEFAULT 'standard',
        theme text NOT NULL DEFAULT 'dark',
        auto_refresh boolean NOT NULL DEFAULT false,
        refresh_interval_sec integer NOT NULL DEFAULT 30,
        default_page_size integer NOT NULL DEFAULT 25,
        notifications_enabled boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS export_jobs (
        id text PRIMARY KEY,
        user_id text NOT NULL,
        dataset_id text NOT NULL,
        format text NOT NULL DEFAULT 'csv',
        status text NOT NULL DEFAULT 'pending',
        filter_criteria jsonb DEFAULT '{}',
        total_rows integer NOT NULL DEFAULT 0,
        file_url text,
        created_at timestamptz NOT NULL DEFAULT now(),
        completed_at timestamptz
      );

      CREATE TABLE IF NOT EXISTS query_performance_logs (
        id text PRIMARY KEY,
        endpoint text NOT NULL,
        query_type text NOT NULL,
        query_hash text NOT NULL,
        execution_time_ms real NOT NULL,
        total_records_scanned integer NOT NULL DEFAULT 0,
        cache_hit boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id text PRIMARY KEY,
        user_id text NOT NULL,
        user_name text NOT NULL,
        user_role text NOT NULL,
        action text NOT NULL,
        resource text NOT NULL,
        resource_id text,
        details jsonb NOT NULL DEFAULT '{}',
        ip_address text,
        status text NOT NULL DEFAULT 'SUCCESS',
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS record_comments (
        id text PRIMARY KEY,
        record_id text NOT NULL,
        user_id text NOT NULL,
        user_name text NOT NULL,
        user_role text NOT NULL,
        content text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS data_quality_issues (
        id text PRIMARY KEY,
        dataset_id text NOT NULL,
        record_id text,
        field_name text NOT NULL,
        issue_type text NOT NULL,
        severity text NOT NULL,
        description text NOT NULL,
        status text NOT NULL DEFAULT 'open',
        created_at timestamptz NOT NULL DEFAULT now(),
        resolved_at timestamptz
      );
    `
    );

    // 3. PostgreSQL B-tree, Composite and GIN Indexes
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_records_dataset_id ON dataset_records (dataset_id);',
      'CREATE INDEX IF NOT EXISTS idx_records_status ON dataset_records (dataset_id, status);',
      'CREATE INDEX IF NOT EXISTS idx_records_category ON dataset_records (dataset_id, category);',
      'CREATE INDEX IF NOT EXISTS idx_records_country ON dataset_records (dataset_id, country);',
      'CREATE INDEX IF NOT EXISTS idx_records_numeric_val ON dataset_records (dataset_id, numeric_value);',
      'CREATE INDEX IF NOT EXISTS idx_records_record_date ON dataset_records (dataset_id, record_date);',
      'CREATE INDEX IF NOT EXISTS idx_records_record_key ON dataset_records (record_key);',
      'CREATE INDEX IF NOT EXISTS idx_fields_dataset_id ON dataset_fields (dataset_id);',
      'CREATE INDEX IF NOT EXISTS idx_saved_views_user ON saved_views (user_id, dataset_id);',
      'CREATE INDEX IF NOT EXISTS idx_saved_views_shared ON saved_views (dataset_id, is_shared);',
      'CREATE INDEX IF NOT EXISTS idx_search_hist_user ON search_history (user_id, dataset_id);',
      'CREATE INDEX IF NOT EXISTS idx_history_record_id ON record_history (record_id);',
      'CREATE INDEX IF NOT EXISTS idx_perf_logs_created ON query_performance_logs (created_at);',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at);',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id);',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);',
      'CREATE INDEX IF NOT EXISTS idx_comments_record_id ON record_comments (record_id);',
      'CREATE INDEX IF NOT EXISTS idx_quality_issues_dataset ON data_quality_issues (dataset_id);',
      'CREATE INDEX IF NOT EXISTS idx_quality_issues_status ON data_quality_issues (status);',
      'CREATE INDEX IF NOT EXISTS idx_quality_issues_severity ON data_quality_issues (severity);',
      'CREATE INDEX IF NOT EXISTS idx_records_composite_filter ON dataset_records (dataset_id, status, country, numeric_value);',
      'CREATE INDEX IF NOT EXISTS idx_records_trgm_title ON dataset_records USING gin (title gin_trgm_ops);',
      "CREATE INDEX IF NOT EXISTS idx_records_fts ON dataset_records USING gin (to_tsvector('english', title || ' ' || category || ' ' || country || ' ' || record_key));",
    ];

    for (const q of indexQueries) {
      try {
        await executeSql(client, q);
      } catch (_) {
        // Continue on existing index
      }
    }
  } catch (error) {
    console.error('Error during database schema initialization:', error);
    throw error;
  }
}

async function ensureBaselineData(client: any) {
  try {
    // Quick existence check to bypass redundant baseline seeding on already populated databases
    const existingUsers = await client.query('SELECT 1 FROM users LIMIT 1;').catch(() => null);
    if (existingUsers && existingUsers.rows && existingUsers.rows.length > 0) {
      return;
    }

    const salt = await bcrypt.genSalt(10);
      const adminPass = await bcrypt.hash('admin123', salt);
      const analystPass = await bcrypt.hash('analyst123', salt);
      const viewerPass = await bcrypt.hash('viewer123', salt);

      await client.query(`
        INSERT INTO users (id, name, email, password_hash, role, department, avatar_url)
        VALUES 
          ('usr-admin-01', 'Elena Rostova', 'admin@datascope.io', '${adminPass}', 'admin', 'Enterprise Architecture', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
          ('usr-analyst-01', 'Marcus Vance', 'analyst@datascope.io', '${analystPass}', 'analyst', 'Strategic Intelligence', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
          ('usr-viewer-01', 'Sarah Lin', 'viewer@datascope.io', '${viewerPass}', 'viewer', 'Product Operations', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150')
        ON CONFLICT (id) DO NOTHING;
      `);

      await client.query(`
        INSERT INTO user_preferences (id, user_id, table_density, theme, auto_refresh, refresh_interval_sec, default_page_size, notifications_enabled)
        VALUES 
          ('pref-01', 'usr-admin-01', 'compact', 'dark', false, 30, 25, true),
          ('pref-02', 'usr-analyst-01', 'standard', 'dark', true, 15, 50, true),
          ('pref-03', 'usr-viewer-01', 'standard', 'dark', false, 30, 25, true)
        ON CONFLICT (user_id) DO NOTHING;
      `);
    }

    const existingDatasets = await client.query('SELECT count(*)::int AS count FROM datasets;');
    const datasetCount = existingDatasets.rows?.[0]?.count || 0;

    if (datasetCount === 0) {
      await client.query(`
        INSERT INTO datasets (id, name, slug, description, category, data_source, total_records, access_level, schema_definition)
        VALUES 
          ('ds-sales-01', 'Global Enterprise Accounts & Revenue', 'global-sales', 'Comprehensive multi-region enterprise B2B sales data containing corporate entities, ARR, contract tiers, and health metrics.', 'Sales & Revenue', 'PostgreSQL Production Cluster [us-east-1]', 100000, 'public', '[]'),
          ('ds-telemetry-02', 'Edge Infrastructure & Telemetry Logs', 'cloud-telemetry', 'Multi-region high-frequency latency, CPU utilization, and edge cluster operational metrics.', 'Infrastructure Telemetry', 'Kafka Streaming & S3 Parquet Lake', 10000, 'restricted', '[]'),
          ('ds-finance-03', 'Institutional Financial Transactions', 'financial-audit', 'High-value multi-currency ledger transactions, clearing houses, settlement status, and compliance flags.', 'Financial Intelligence', 'Core Banking Ledger DB', 10000, 'admin_only', '[]')
        ON CONFLICT (id) DO NOTHING;
      `);

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
    }

    // Baseline Audit Logs if empty
    const auditRes = await client.query('SELECT count(*)::int AS count FROM audit_logs;');
    if ((auditRes.rows?.[0]?.count || 0) === 0) {
      await client.query(`
        INSERT INTO audit_logs (id, user_id, user_name, user_role, action, resource, details, ip_address, status)
        VALUES
          ('aud-01', 'usr-admin-01', 'Elena Rostova', 'admin', 'SYSTEM_BOOT', 'Core Engine', '{"engine": "Core Storage Engine", "indexedRecords": 110000}', '10.0.4.1', 'SUCCESS'),
          ('aud-02', 'usr-analyst-01', 'Marcus Vance', 'analyst', 'SAVED_VIEW_CREATE', 'SavedView:ds-sales-01', '{"name": "Tier 1 Enterprise DACH", "filtersCount": 3}', '10.0.4.12', 'SUCCESS'),
          ('aud-03', 'usr-admin-01', 'Elena Rostova', 'admin', 'PERMISSIONS_AUDIT', 'RBAC Matrix', '{"scannedRoles": ["admin", "analyst", "viewer"], "violations": 0}', '10.0.4.1', 'SUCCESS'),
          ('aud-04', 'usr-viewer-01', 'Sarah Lin', 'viewer', 'RECORD_SEARCH', 'Dataset:ds-sales-01', '{"query": "Germany", "latencyMs": 4.2, "results": 1420}', '192.168.1.45', 'SUCCESS'),
          ('aud-05', 'usr-analyst-01', 'Marcus Vance', 'analyst', 'DATA_EXPORT', 'ExportJob:ds-sales-01', '{"format": "CSV", "rows": 500, "status": "completed"}', '10.0.4.12', 'SUCCESS')
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    // Baseline Data Quality Issues if empty
    const dqRes = await client.query('SELECT count(*)::int AS count FROM data_quality_issues;');
    if ((dqRes.rows?.[0]?.count || 0) === 0) {
      await client.query(`
        INSERT INTO data_quality_issues (id, dataset_id, field_name, issue_type, severity, description, status)
        VALUES
          ('dq-01', 'ds-sales-01', 'country', 'INCONSISTENT_CASE', 'low', '14 records exhibit non-standard capitalization in regional country codes (e.g. "germany" vs "Germany").', 'open'),
          ('dq-02', 'ds-sales-01', 'numericValue', 'OUT_OF_BOUNDS', 'medium', '3 accounts reported negative annual ARR balances requiring financial reconciliation.', 'open'),
          ('dq-03', 'ds-telemetry-02', 'metadata', 'MISSING_PAYLOAD', 'high', 'Edge node cluster #4 failed to supply JSON heartbeat metadata in 12 consecutive pings.', 'open'),
          ('dq-04', 'ds-finance-03', 'status', 'UNVERIFIED_STATUS', 'critical', 'High-value transaction ACC-99411 lacks counterparty verification hash.', 'reviewed')
        ON CONFLICT (id) DO NOTHING;
      `);
    }
  } catch (err) {
    console.warn('Notice: Baseline data check completed with notice:', err);
  }
}

export async function getDb(): Promise<DbInstance> {
  const { db } = await initDatabase();
  return db;
}

export async function getRawClient(): Promise<any> {
  const { rawClient } = await initDatabase();
  return rawClient;
}

export async function getEngineType(): Promise<string> {
  const { engineType } = await initDatabase();
  return engineType;
}
