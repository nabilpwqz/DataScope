-- DataScope Initial Drizzle Migration
-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Users Table
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

-- Access Permissions Table
CREATE TABLE IF NOT EXISTS access_permissions (
  id text PRIMARY KEY,
  user_id text REFERENCES users(id) ON DELETE CASCADE,
  role text,
  dataset_id text NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  can_read boolean NOT NULL DEFAULT true,
  can_write boolean NOT NULL DEFAULT false,
  can_export boolean NOT NULL DEFAULT false,
  can_manage boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id text PRIMARY KEY,
  user_id text NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  table_density text NOT NULL DEFAULT 'standard',
  theme text NOT NULL DEFAULT 'dark',
  auto_refresh boolean NOT NULL DEFAULT false,
  refresh_interval_sec integer NOT NULL DEFAULT 30,
  default_page_size integer NOT NULL DEFAULT 25,
  notifications_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Datasets Table
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

-- Dataset Fields Table
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

-- Dataset Records Table
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

-- Record Relationships Table
CREATE TABLE IF NOT EXISTS record_relationships (
  id text PRIMARY KEY,
  source_record_id text NOT NULL,
  target_record_id text NOT NULL,
  relationship_type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Record History Table
CREATE TABLE IF NOT EXISTS record_history (
  id text PRIMARY KEY,
  record_id text NOT NULL,
  changed_by_user_id text NOT NULL,
  changed_by_name text NOT NULL,
  change_type text NOT NULL,
  diff_payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Saved Views Table
CREATE TABLE IF NOT EXISTS saved_views (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  dataset_id text NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_shared boolean NOT NULL DEFAULT false,
  query_config jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Search History Table
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

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  user_name text NOT NULL,
  user_role text NOT NULL,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id text,
  details jsonb NOT NULL DEFAULT '{}',
  ip_address text NOT NULL DEFAULT '127.0.0.1',
  status text NOT NULL DEFAULT 'success',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Data Quality Issues Table
CREATE TABLE IF NOT EXISTS data_quality_issues (
  id text PRIMARY KEY,
  dataset_id text NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  record_id text,
  field_name text,
  issue_type text NOT NULL,
  severity text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- Record Comments Table
CREATE TABLE IF NOT EXISTS record_comments (
  id text PRIMARY KEY,
  record_id text NOT NULL,
  user_id text NOT NULL,
  user_name text NOT NULL,
  user_role text NOT NULL,
  comment_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Query Performance Logs Table
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

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_records_dataset_date ON dataset_records (dataset_id, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_records_composite_filter ON dataset_records (dataset_id, status, country, numeric_value);
CREATE INDEX IF NOT EXISTS idx_records_trgm_title ON dataset_records USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_records_fts ON dataset_records USING gin (to_tsvector('english', title || ' ' || category || ' ' || country || ' ' || record_key));
CREATE INDEX IF NOT EXISTS idx_records_record_key ON dataset_records (record_key);
CREATE INDEX IF NOT EXISTS idx_saved_views_dataset ON saved_views (dataset_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_user ON saved_views (user_id);
CREATE INDEX IF NOT EXISTS idx_search_hist_user ON search_history (user_id, dataset_id);
CREATE INDEX IF NOT EXISTS idx_perf_logs_created ON query_performance_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quality_issues_dataset ON data_quality_issues (dataset_id);

