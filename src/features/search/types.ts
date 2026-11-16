import type { FilterCondition, SortCondition } from '@/types';

export type SearchType = 'hybrid' | 'fts' | 'trgm' | 'exact';
export type SearchField = string;
export type { FilterCondition, SortCondition };
