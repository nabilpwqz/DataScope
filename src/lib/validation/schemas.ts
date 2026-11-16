import { z } from 'zod';

export const FilterOperatorEnum = z.enum([
  'equals',
  'contains',
  'starts_with',
  'greater_than',
  'less_than',
  'between',
  'in',
  'is_null',
  'is_not_null',
]);

export const FilterConditionSchema = z.object({
  id: z.string(),
  field: z.string().min(1, 'Field name is required'),
  operator: FilterOperatorEnum,
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  valueTo: z.union([z.string(), z.number()]).optional(),
});

export const SortDirectionEnum = z.enum(['asc', 'desc']);

export const SortConditionSchema = z.object({
  field: z.string().min(1),
  direction: SortDirectionEnum,
});

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

export const DatasetCreateSchema = z.object({
  name: z.string().min(3, 'Dataset name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(2, 'Category is required'),
  dataSource: z.string().min(2, 'Data source is required'),
  accessLevel: z.enum(['public', 'restricted', 'admin_only']).default('public'),
});
