import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FilterCondition, SortCondition } from '@/types';

export interface SearchConfigState {
  search: string;
  debouncedSearch: string;
  searchType: 'hybrid' | 'fts' | 'trgm' | 'exact';
  searchField: string;
  filters: FilterCondition[];
  filterLogicalOperator: 'AND' | 'OR';
  sort: SortCondition[];
  page: number;
  pageSize: number;
  paginationType: 'offset' | 'cursor';
  cursor: string | null;
}

const initialState: SearchConfigState = {
  search: '',
  debouncedSearch: '',
  searchType: 'hybrid',
  searchField: '',
  filters: [],
  filterLogicalOperator: 'AND',
  sort: [{ field: 'recordDate', direction: 'desc' }],
  page: 1,
  pageSize: 25,
  paginationType: 'offset',
  cursor: null,
};

export const searchConfigSlice = createSlice({
  name: 'searchConfig',
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setDebouncedSearch: (state, action: PayloadAction<string>) => {
      state.debouncedSearch = action.payload;
      state.page = 1; // Reset to page 1 on new search
      state.cursor = null;
    },
    setSearchType: (state, action: PayloadAction<'hybrid' | 'fts' | 'trgm' | 'exact'>) => {
      state.searchType = action.payload;
      state.page = 1;
    },
    setSearchField: (state, action: PayloadAction<string>) => {
      state.searchField = action.payload;
      state.page = 1;
    },
    addFilter: (state, action: PayloadAction<FilterCondition>) => {
      state.filters.push(action.payload);
      state.page = 1;
      state.cursor = null;
    },
    updateFilter: (state, action: PayloadAction<{ id: string; filter: Partial<FilterCondition> }>) => {
      const idx = state.filters.findIndex((f) => f.id === action.payload.id);
      if (idx !== -1) {
        state.filters[idx] = { ...state.filters[idx], ...action.payload.filter };
      }
      state.page = 1;
      state.cursor = null;
    },
    removeFilter: (state, action: PayloadAction<string>) => {
      state.filters = state.filters.filter((f) => f.id !== action.payload);
      state.page = 1;
      state.cursor = null;
    },
    clearFilters: (state) => {
      state.filters = [];
      state.page = 1;
      state.cursor = null;
    },
    setFilters: (state, action: PayloadAction<FilterCondition[]>) => {
      state.filters = action.payload;
      state.page = 1;
      state.cursor = null;
    },
    setFilterLogicalOperator: (state, action: PayloadAction<'AND' | 'OR'>) => {
      state.filterLogicalOperator = action.payload;
      state.page = 1;
    },
    setSort: (state, action: PayloadAction<SortCondition[]>) => {
      state.sort = action.payload;
      state.page = 1;
      state.cursor = null;
    },
    toggleColumnSort: (state, action: PayloadAction<string>) => {
      const col = action.payload;
      const existingIdx = state.sort.findIndex((s) => s.field === col);
      if (existingIdx !== -1) {
        if (state.sort[existingIdx].direction === 'asc') {
          state.sort[existingIdx].direction = 'desc';
        } else {
          // Remove sort if already desc
          state.sort.splice(existingIdx, 1);
        }
      } else {
        // Single sort primary or multi-sort
        state.sort = [{ field: col, direction: 'asc' }, ...state.sort.slice(0, 1)];
      }
      state.page = 1;
      state.cursor = null;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.page = 1;
      state.cursor = null;
    },
    setPaginationType: (state, action: PayloadAction<'offset' | 'cursor'>) => {
      state.paginationType = action.payload;
      state.page = 1;
      state.cursor = null;
    },
    setCursor: (state, action: PayloadAction<string | null>) => {
      state.cursor = action.payload;
    },
    resetSearchConfig: (state) => {
      state.search = '';
      state.debouncedSearch = '';
      state.filters = [];
      state.filterLogicalOperator = 'AND';
      state.sort = [{ field: 'recordDate', direction: 'desc' }];
      state.page = 1;
      state.cursor = null;
    },
    applySavedViewConfig: (
      state,
      action: PayloadAction<{
        search?: string;
        searchType?: 'hybrid' | 'fts' | 'trgm' | 'exact';
        filters: FilterCondition[];
        filterLogicalOperator?: 'AND' | 'OR';
        sort: SortCondition[];
        pageSize: number;
      }>
    ) => {
      state.search = action.payload.search || '';
      state.debouncedSearch = action.payload.search || '';
      state.searchType = action.payload.searchType || 'hybrid';
      state.filters = action.payload.filters || [];
      state.filterLogicalOperator = action.payload.filterLogicalOperator || 'AND';
      state.sort = action.payload.sort || [{ field: 'recordDate', direction: 'desc' }];
      state.pageSize = action.payload.pageSize || 25;
      state.page = 1;
      state.cursor = null;
    },
  },
});

export const {
  setSearch,
  setDebouncedSearch,
  setSearchType,
  setSearchField,
  addFilter,
  updateFilter,
  removeFilter,
  clearFilters,
  setFilters,
  setFilterLogicalOperator,
  setSort,
  toggleColumnSort,
  setPage,
  setPageSize,
  setPaginationType,
  setCursor,
  resetSearchConfig,
  applySavedViewConfig,
} = searchConfigSlice.actions;

export default searchConfigSlice.reducer;

