import { describe, it, expect } from 'vitest';
import {
  searchConfigSlice,
  setSearch,
  setDebouncedSearch,
  setSearchType,
  setSearchField,
  addFilter,
  removeFilter,
  clearFilters,
  setPage,
  setPageSize,
  setSort,
  addSortCondition,
  removeSortCondition,
  applySavedViewConfig,
} from '@/store/slices/searchConfigSlice';

describe('Search Config Redux Slice', () => {
  const initialState = searchConfigSlice.getInitialState();

  it('should initialize with default state', () => {
    expect(initialState.page).toBe(1);
    expect(initialState.pageSize).toBe(25);
    expect(initialState.searchType).toBe('hybrid');
    expect(initialState.filterLogicalOperator).toBe('AND');
    expect(initialState.filters).toEqual([]);
  });

  it('should update search string synchronously', () => {
    const state = searchConfigSlice.reducer(initialState, setSearch('Apex Systems'));
    expect(state.search).toBe('Apex Systems');
    expect(state.debouncedSearch).toBe('');
  });

  it('should update debounced search and reset to page 1', () => {
    const stateWithPage10 = { ...initialState, page: 10 };
    const nextState = searchConfigSlice.reducer(stateWithPage10, setDebouncedSearch('Acme'));

    expect(nextState.debouncedSearch).toBe('Acme');
    expect(nextState.page).toBe(1);
  });

  it('should manage adding and removing filter conditions', () => {
    const filter = {
      id: 'f-1',
      field: 'status',
      operator: 'equals' as const,
      value: 'Active',
    };

    const stateWithFilter = searchConfigSlice.reducer(initialState, addFilter(filter));
    expect(stateWithFilter.filters.length).toBe(1);
    expect(stateWithFilter.filters[0].field).toBe('status');

    const stateAfterRemoval = searchConfigSlice.reducer(stateWithFilter, removeFilter('f-1'));
    expect(stateAfterRemoval.filters.length).toBe(0);
  });

  it('should support multi-column sorting additions and updates', () => {
    const cleanState = { ...initialState, sort: [] };
    // Add primary sort column
    const step1 = searchConfigSlice.reducer(
      cleanState,
      addSortCondition({ field: 'numericValue', direction: 'desc' })
    );
    expect(step1.sort).toEqual([{ field: 'numericValue', direction: 'desc' }]);

    // Add secondary sort column
    const step2 = searchConfigSlice.reducer(
      step1,
      addSortCondition({ field: 'recordDate', direction: 'desc' })
    );
    expect(step2.sort.length).toBe(2);
    expect(step2.sort[0].field).toBe('numericValue');
    expect(step2.sort[1].field).toBe('recordDate');

    // Toggle direction of existing column
    const step3 = searchConfigSlice.reducer(
      step2,
      addSortCondition({ field: 'numericValue', direction: 'asc' })
    );
    expect(step3.sort.length).toBe(2);
    expect(step3.sort[0].direction).toBe('asc');

    // Remove a sort condition
    const step4 = searchConfigSlice.reducer(step3, removeSortCondition('numericValue'));
    expect(step4.sort.length).toBe(1);
    expect(step4.sort[0].field).toBe('recordDate');
  });

  it('should support field-based search targeting and search types', () => {
    const stateWithField = searchConfigSlice.reducer(initialState, setSearchField('title'));
    expect(stateWithField.searchField).toBe('title');

    const stateWithTrgm = searchConfigSlice.reducer(stateWithField, setSearchType('trgm'));
    expect(stateWithTrgm.searchType).toBe('trgm');
  });

  it('should apply saved view configuration cleanly', () => {
    const savedConfig = {
      search: 'Enterprise',
      searchType: 'fts' as const,
      filters: [{ id: 'f-2', field: 'country', operator: 'equals' as const, value: 'Germany' }],
      filterLogicalOperator: 'AND' as const,
      sort: [{ field: 'numericValue', direction: 'desc' as const }],
      pageSize: 50,
    };

    const nextState = searchConfigSlice.reducer(initialState, applySavedViewConfig(savedConfig));

    expect(nextState.search).toBe('Enterprise');
    expect(nextState.debouncedSearch).toBe('Enterprise');
    expect(nextState.searchType).toBe('fts');
    expect(nextState.pageSize).toBe(50);
    expect(nextState.filters.length).toBe(1);
    expect(nextState.page).toBe(1);
  });
});

