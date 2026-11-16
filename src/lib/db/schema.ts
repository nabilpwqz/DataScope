import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  doublePrecision,
  real,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'admin' | 'analyst' | 'viewer'
  department: text('department').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const roles = pgTable('roles', {
  id: text('id').primaryKey(), // 'admin' | 'analyst' | 'viewer'
  name: text('name').notNull(),
  description: text('description').notNull(),
  permissions: jsonb('permissions').notNull().default('[]'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accessPermissions = pgTable(
  'access_permissions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    role: text('role'),
    datasetId: text('dataset_id')
      .notNull()
      .references(() => datasets.id, { onDelete: 'cascade' }),
    canRead: boolean('can_read').notNull().default(true),
    canWrite: boolean('can_write').notNull().default(false),
    canExport: boolean('can_export').notNull().default(false),
    canManage: boolean('can_manage').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    datasetIdx: index('access_perms_dataset_idx').on(table.datasetId),
    userIdx: index('access_perms_user_idx').on(table.userId),
    roleIdx: index('access_perms_role_idx').on(table.role),
  })
);

export const datasets = pgTable('datasets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  dataSource: text('data_source').notNull(),
  totalRecords: integer('total_records').notNull().default(0),
  accessLevel: text('access_level').notNull().default('public'), // 'public' | 'restricted' | 'admin_only'
  schemaDefinition: jsonb('schema_definition').notNull().default('[]'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const datasetFields = pgTable(
  'dataset_fields',
  {
    id: text('id').primaryKey(),
    datasetId: text('dataset_id')
      .notNull()
      .references(() => datasets.id, { onDelete: 'cascade' }),
    fieldName: text('field_name').notNull(),
    displayName: text('display_name').notNull(),
    dataType: text('data_type').notNull(), // 'string' | 'number' | 'boolean' | 'date' | 'currency'
    isFilterable: boolean('is_filterable').notNull().default(true),
    isSearchable: boolean('is_searchable').notNull().default(true),
    isSortable: boolean('is_sortable').notNull().default(true),
    isPrimary: boolean('is_primary').notNull().default(false),
    sampleValues: jsonb('sample_values').default('[]'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    datasetIdIdx: index('fields_dataset_id_idx').on(table.datasetId),
  })
);

export const datasetRecords = pgTable(
  'dataset_records',
  {
    id: text('id').primaryKey(),
    datasetId: text('dataset_id')
      .notNull()
      .references(() => datasets.id, { onDelete: 'cascade' }),
    recordKey: text('record_key').notNull(),
    title: text('title').notNull(),
    category: text('category').notNull(),
    status: text('status').notNull(), // 'Active' | 'Pending' | 'Archived' | 'Suspended' | 'Completed' | 'Flagged'
    numericValue: doublePrecision('numeric_value').notNull().default(0),
    country: text('country').notNull(),
    region: text('region').notNull(),
    recordDate: timestamp('record_date', { withTimezone: true }).notNull(),
    metadata: jsonb('metadata').notNull().default('{}'),
    searchVector: text('search_vector'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    datasetIdIdx: index('records_dataset_id_idx').on(table.datasetId),
    statusIdx: index('records_status_idx').on(table.datasetId, table.status),
    categoryIdx: index('records_category_idx').on(table.datasetId, table.category),
    countryIdx: index('records_country_idx').on(table.datasetId, table.country),
    numericValIdx: index('records_numeric_val_idx').on(table.datasetId, table.numericValue),
    recordDateIdx: index('records_record_date_idx').on(table.datasetId, table.recordDate),
    recordKeyIdx: index('records_record_key_idx').on(table.recordKey),
  })
);

export const recordRelationships = pgTable(
  'record_relationships',
  {
    id: text('id').primaryKey(),
    sourceRecordId: text('source_record_id').notNull(),
    targetRecordId: text('target_record_id').notNull(),
    relationshipType: text('relationship_type').notNull(),
    metadata: jsonb('metadata').default('{}'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sourceIdx: index('rel_source_idx').on(table.sourceRecordId),
    targetIdx: index('rel_target_idx').on(table.targetRecordId),
  })
);

export const recordHistory = pgTable(
  'record_history',
  {
    id: text('id').primaryKey(),
    recordId: text('record_id').notNull(),
    changedByUserId: text('changed_by_user_id').notNull(),
    changedByName: text('changed_by_name').notNull(),
    changeType: text('change_type').notNull(),
    diffPayload: jsonb('diff_payload').notNull().default('{}'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    recordIdIdx: index('history_record_id_idx').on(table.recordId),
  })
);

export const savedViews = pgTable(
  'saved_views',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    datasetId: text('dataset_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    isShared: boolean('is_shared').notNull().default(false),
    authorName: text('author_name'),
    searchQuery: text('search_query').default(''),
    searchType: text('search_type').default('hybrid'),
    filterConfig: jsonb('filter_config').notNull().default('[]'),
    filterLogicalOperator: text('filter_logical_operator').notNull().default('AND'),
    sortConfig: jsonb('sort_config').notNull().default('[]'),
    visibleColumns: jsonb('visible_columns').notNull().default('[]'),
    pageSize: integer('page_size').notNull().default(25),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userDatasetIdx: index('saved_views_user_dataset_idx').on(table.userId, table.datasetId),
    datasetSharedIdx: index('saved_views_shared_idx').on(table.datasetId, table.isShared),
  })
);

export const searchHistory = pgTable(
  'search_history',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    datasetId: text('dataset_id').notNull(),
    queryText: text('query_text').notNull(),
    searchType: text('search_type').notNull().default('hybrid'),
    filterSummary: jsonb('filter_summary').notNull().default('[]'),
    resultCount: integer('result_count').notNull().default(0),
    executionTimeMs: real('execution_time_ms').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('search_hist_user_idx').on(table.userId, table.datasetId),
  })
);

export const userPreferences = pgTable('user_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  tableDensity: text('table_density').notNull().default('standard'),
  theme: text('theme').notNull().default('dark'),
  autoRefresh: boolean('auto_refresh').notNull().default(false),
  refreshIntervalSec: integer('refresh_interval_sec').notNull().default(30),
  defaultPageSize: integer('default_page_size').notNull().default(25),
  notificationsEnabled: boolean('notifications_enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const exportJobs = pgTable('export_jobs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  datasetId: text('dataset_id').notNull(),
  format: text('format').notNull().default('csv'),
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'completed' | 'failed'
  filterCriteria: jsonb('filter_criteria').default('{}'),
  totalRows: integer('total_rows').notNull().default(0),
  fileUrl: text('file_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const queryPerformanceLogs = pgTable(
  'query_performance_logs',
  {
    id: text('id').primaryKey(),
    endpoint: text('endpoint').notNull(),
    queryType: text('query_type').notNull(),
    queryHash: text('query_hash').notNull(),
    executionTimeMs: real('execution_time_ms').notNull(),
    totalRecordsScanned: integer('total_records_scanned').notNull().default(0),
    cacheHit: boolean('cache_hit').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    createdIdx: index('perf_created_idx').on(table.createdAt),
  })
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    userName: text('user_name').notNull(),
    userRole: text('user_role').notNull(),
    action: text('action').notNull(),
    resource: text('resource').notNull(),
    resourceId: text('resource_id'),
    details: jsonb('details').notNull().default('{}'),
    ipAddress: text('ip_address'),
    status: text('status').notNull().default('SUCCESS'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    createdIdx: index('audit_logs_created_idx').on(table.createdAt),
    userIdx: index('audit_logs_user_idx').on(table.userId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
  })
);

export const recordComments = pgTable(
  'record_comments',
  {
    id: text('id').primaryKey(),
    recordId: text('record_id').notNull(),
    userId: text('user_id').notNull(),
    userName: text('user_name').notNull(),
    userRole: text('user_role').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    recordIdIdx: index('comments_record_id_idx').on(table.recordId),
  })
);

export const dataQualityIssues = pgTable(
  'data_quality_issues',
  {
    id: text('id').primaryKey(),
    datasetId: text('dataset_id').notNull(),
    recordId: text('record_id'),
    fieldName: text('field_name').notNull(),
    issueType: text('issue_type').notNull(),
    severity: text('severity').notNull(), // 'low' | 'medium' | 'high' | 'critical'
    description: text('description').notNull(),
    status: text('status').notNull().default('open'), // 'open' | 'reviewed' | 'resolved'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => ({
    datasetIdx: index('quality_issues_dataset_idx').on(table.datasetId),
    statusIdx: index('quality_issues_status_idx').on(table.status),
    severityIdx: index('quality_issues_severity_idx').on(table.severity),
  })
);
