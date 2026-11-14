export type UserRole = 'admin' | 'analyst' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface DatasetField {
  id: string;
  datasetId: string;
  fieldName: string;
  displayName: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'currency';
  isFilterable: boolean;
  isSearchable: boolean;
  isSortable: boolean;
  isPrimary?: boolean;
  sampleValues?: string[];
}

export interface Dataset {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  dataSource: string;
  totalRecords: number;
  accessLevel: 'public' | 'restricted' | 'admin_only';
  fields: DatasetField[];
  createdAt: string;
  updatedAt: string;
}

export interface DatasetRecord {
  id: string;
  datasetId: string;
  recordKey: string;
  title: string;
  category: string;
  status: 'Active' | 'Pending' | 'Archived' | 'Suspended' | 'Completed' | 'Flagged';
  numericValue: number;
  country: string;
  region: string;
  recordDate: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface RecordRelationship {
  id: string;
  sourceRecordId: string;
  targetRecordId: string;
  relationshipType: string;
  metadata?: Record<string, any>;
  targetRecord?: DatasetRecord;
}

export interface RecordHistoryItem {
  id: string;
  recordId: string;
  changedByUserId: string;
  changedByName: string;
  changeType: 'CREATED' | 'UPDATED' | 'STATUS_CHANGE' | 'TAG_ADDED' | 'VALUATION_UPDATE';
  diffPayload: {
    field?: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
  };
  createdAt: string;
}

export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'starts_with'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in'
  | 'is_null'
  | 'is_not_null';

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  valueTo?: any; // For between operator
}

export interface SortCondition {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SearchQueryRequest {
  datasetId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  searchType?: 'hybrid' | 'fts' | 'trgm' | 'exact';
  searchField?: string; // Optional field-specific search
  filters?: FilterCondition[];
  filterLogicalOperator?: 'AND' | 'OR';
  sort?: SortCondition[];
  cursor?: string; // For cursor-based pagination
  paginationType?: 'offset' | 'cursor';
}

export interface SearchQueryResponse {
  records: DatasetRecord[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextCursor?: string;
  executionTimeMs: number;
  cacheHit: boolean;
  searchStrategyUsed: string;
  appliedFiltersCount: number;
  timestamp: string;
}

export interface SavedView {
  id: string;
  userId: string;
  datasetId: string;
  name: string;
  description?: string;
  isShared: boolean;
  authorName?: string;
  searchQuery?: string;
  searchType?: string;
  filterConfig: FilterCondition[];
  filterLogicalOperator?: 'AND' | 'OR';
  sortConfig: SortCondition[];
  visibleColumns: string[];
  pageSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchHistoryEntry {
  id: string;
  userId: string;
  datasetId: string;
  datasetName?: string;
  queryText: string;
  searchType: string;
  filterSummary: FilterCondition[];
  resultCount: number;
  executionTimeMs: number;
  createdAt: string;
}

export interface UserPreferences {
  tableDensity: 'compact' | 'standard' | 'spacious';
  theme: 'dark' | 'light' | 'system';
  autoRefresh: boolean;
  refreshIntervalSec: number;
  defaultPageSize: number;
  notificationsEnabled: boolean;
}

export interface AnalyticsSummary {
  totalRecords: number;
  recordsByCategory: { category: string; count: number; totalValue: number }[];
  recordsByStatus: { status: string; count: number; percentage: number }[];
  growthTrends: { date: string; count: number; cumulative: number }[];
  topCountries: { country: string; count: number; totalValue: number }[];
  averageValue: number;
  medianValue: number;
  filterUsageStats: { field: string; usageCount: number }[];
}

export interface PerformanceMetric {
  id: string;
  timestamp: string;
  endpoint: string;
  queryType: string;
  executionTimeMs: number;
  cacheHit: boolean;
  recordsCount: number;
}
