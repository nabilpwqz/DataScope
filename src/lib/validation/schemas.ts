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
  'between',
  'in',
  'is_null',
  'is_not_null',
]);

export const FilterConditionSchema = z
  .object({
    id: z.string().max(64).optional(),
    field: z.string().min(1).max(64),
    operator: FilterOperatorEnum,
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]).optional(),
    valueTo: z.union([z.string(), z.number()]).optional(),
  })
  .strict();

export const SortConditionSchema = z
  .object({
    field: z.string().min(1).max(64),
    direction: z.enum(['asc', 'desc']),
  })
  .strict();

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
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional().default(''),
    isShared: z.boolean().optional().default(false),
    searchQuery: z.string().max(100).optional().default(''),
    searchType: z.enum(['hybrid', 'fts', 'trigram', 'exact']).optional().default('hybrid'),
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
    name: z.string().min(2).max(100),
    description: z.string().max(1000).optional().default(''),
    category: z.string().max(100).optional().default('General'),
    dataSource: z.string().max(100).optional().default('Internal Postgres'),
    accessLevel: z.enum(['public', 'restricted', 'admin_only']).default('public'),
  })
  .strict();
