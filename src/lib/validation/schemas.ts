import { z } from 'zod';

export const FilterOperatorEnum = z.enum([
  'equals',
  'contains',
  'starts_with',
  'ends_with',
  'gt',
  'gte',
  'lt',
  'lte',
  'greater_than',
  'less_than',
  'between',
  'in',
  'is_null',
  'is_not_null',
]);

export const FilterConditionSchema = z
  .object({
    id: z.string().max(64).optional(),
    field: z.string().min(1, 'Field name is required').max(64),
    operator: FilterOperatorEnum,
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]).optional(),
    valueTo: z.union([z.string(), z.number()]).optional(),
  })
  .strict();

export const SortDirectionEnum = z.enum(['asc', 'desc']);

export const SortConditionSchema = z
  .object({
    field: z.string().min(1).max(64),
    direction: SortDirectionEnum,
  })
  .strict();

export const SearchRecordsQuerySchema = z.object({
  datasetId: z.string().min(1),
  search: z.string().optional().default(''),
  searchType: z.enum(['hybrid', 'fts', 'trgm', 'exact']).optional().default('hybrid'),
  searchField: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
  filterLogicalOperator: z.enum(['AND', 'OR']).optional().default('AND'),
  cursor: z.string().optional(),
});

export const SearchQuerySchema = z
  .object({
    datasetId: z.string().max(64).optional(),
    search: z.string().max(100).optional().default(''),
    searchType: z.enum(['hybrid', 'fts', 'trgm', 'exact']).optional().default('hybrid'),
    filters: z.array(FilterConditionSchema).max(10).optional().default([]),
    filterLogicalOperator: z.enum(['AND', 'OR']).optional().default('AND'),
    sort: z.array(SortConditionSchema).max(5).optional().default([]),
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
    searchField: z.string().max(64).optional(),
    paginationType: z.enum(['offset', 'cursor']).optional().default('offset'),
    cursor: z.string().max(512).optional(),
  })
  .strict();

export const LoginSchema = z
  .object({
    email: z.string().email().max(128),
    password: z.string().min(1).max(128),
  })
  .strict();

export const RegisterSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email().max(128),
    password: z.string().min(6).max(128),
    department: z.string().max(100).optional().default('Product Operations'),
    role: z.enum(['admin', 'analyst', 'viewer']).optional().default('viewer'),
  })
  .strict();

export const SavedViewCreateSchema = z
  .object({
    datasetId: z.string().min(1).max(64),
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional().default(''),
    isShared: z.boolean().optional().default(false),
    searchQuery: z.string().max(100).optional().default(''),
    searchType: z.enum(['hybrid', 'fts', 'trigram', 'exact', 'trgm']).optional().default('hybrid'),
    filterConfig: z.array(FilterConditionSchema).max(10).optional().default([]),
    filterLogicalOperator: z.enum(['AND', 'OR']).optional().default('AND'),
    sortConfig: z.array(SortConditionSchema).max(5).optional().default([]),
    visibleColumns: z.array(z.string().max(64)).max(50).optional().default([]),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
  })
  .strict();

export const ExportRequestSchema = z
  .object({
    datasetId: z.string().min(1).max(64),
    format: z.enum(['csv', 'json']).default('csv'),
    search: z.string().max(100).optional().default(''),
    filters: z.array(FilterConditionSchema).max(10).optional().default([]),
    filterLogicalOperator: z.enum(['AND', 'OR']).optional().default('AND'),
    sort: z.array(SortConditionSchema).max(5).optional().default([]),
    limit: z.coerce.number().int().min(1).max(100000).optional().default(10000),
  })
  .strict();

export const CommentCreateSchema = z
  .object({
    content: z.string().min(1).max(2000),
  })
  .strict();

export const DatasetCreateSchema = z
  .object({
    name: z.string().min(3, 'Dataset name must be at least 3 characters').max(100),
    description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
    category: z.string().min(2, 'Category is required').max(100),
    dataSource: z.string().min(2, 'Data source is required').max(100),
    accessLevel: z.enum(['public', 'restricted', 'admin_only']).default('public'),
  })
  .strict();
