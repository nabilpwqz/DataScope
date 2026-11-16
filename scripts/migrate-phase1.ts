import { getRawClient } from '../src/lib/db';

async function migratePhase1() {
  console.log('Running Phase 1 Migration: access_permissions and roles tables...');
  const client = await getRawClient();

  // Create roles table
  await client.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id text PRIMARY KEY,
      name text NOT NULL,
      description text NOT NULL,
      permissions jsonb NOT NULL DEFAULT '[]',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  // Create access_permissions table
  await client.query(`
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

    CREATE INDEX IF NOT EXISTS idx_access_perms_dataset ON access_permissions (dataset_id);
    CREATE INDEX IF NOT EXISTS idx_access_perms_user ON access_permissions (user_id);
    CREATE INDEX IF NOT EXISTS idx_access_perms_role ON access_permissions (role);
    CREATE INDEX IF NOT EXISTS idx_access_perms_lookup ON access_permissions (dataset_id, role, can_read);
  `);

  // Seed baseline roles
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

  // Seed baseline access_permissions for the 3 roles and 3 datasets
  // 1. ds-sales-01: Public - Admin, Analyst, Viewer can all read. Admin & Analyst can export. Admin can manage.
  // 2. ds-telemetry-02: Restricted - Admin & Analyst can read & export. Viewer has NO access.
  // 3. ds-finance-03: Admin only - Only Admin has access. Analyst & Viewer have NO access.
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

  console.log('Phase 1 Migration successfully applied.');
  process.exit(0);
}

migratePhase1().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
