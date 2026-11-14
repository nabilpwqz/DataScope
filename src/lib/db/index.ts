import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { drizzle as drizzlePgLite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

type DbInstance = ReturnType<typeof drizzlePgLite<typeof schema>>;

interface GlobalDbState {
  db: DbInstance | null;
  rawClient: any | null;
  initialized: boolean;
  initPromise: Promise<void> | null;
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
  };
}

const state = globalForDb.__dataScopeDb;

export async function initDatabase(): Promise<{ db: DbInstance; rawClient: any }> {
  if (state.db && state.initialized) {
    return { db: state.db, rawClient: state.rawClient };
  }

  if (state.initPromise) {
    await state.initPromise;
    return { db: state.db!, rawClient: state.rawClient };
  }

  state.initPromise = (async () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl && databaseUrl.trim() !== '') {
      // Connect to remote or local external PostgreSQL instance
      const pool = new Pool({ connectionString: databaseUrl });
      const drizzleInstance = drizzlePg(pool, { schema }) as unknown as DbInstance;
      state.db = drizzleInstance;
      state.rawClient = pool;
    } else {
      // Default: Embedded WebAssembly PostgreSQL (PGlite) with persistence
      const dataDir = process.env.PG_DATA_DIR || path.join(process.cwd(), '.pgdata');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      } else {
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
      }

      const pglite = new PGlite(dataDir, {
        extensions: { pg_trgm },
      });

      const drizzleInstance = drizzlePgLite(pglite, { schema });
      state.db = drizzleInstance;
      state.rawClient = pglite;
    }

    // Run schema creation and index creation
    await ensureSchemaAndIndexes(state.rawClient);
    state.initialized = true;
  })();

  await state.initPromise;
  return { db: state.db!, rawClient: state.rawClient };
}

async function executeSql(client: any, query: string, params: any[] = []) {
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
    // 1. Extensions
    try {
      await executeSql(client, 'CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    } catch (e) {
      // pg_trgm may already be loaded or not supported in specific setups
    }

    // 2. Tables
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
    ];

    for (const q of indexQueries) {
      try {
        await executeSql(client, q);
      } catch (err) {
        // Continue on existing index
      }
    }
  } catch (error) {
    console.error('Error during database schema initialization:', error);
    throw error;
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
