import { useAppSelector, useAppDispatch } from '@/store';
import {
  setPage,
  setPageSize,
  setSearch,
  setSort,
  addFilter,
  removeFilter,
  clearFilters,
} from '@/store/slices/searchConfigSlice';
import { useSearchRecordsQuery } from '@/store/services/dataScopeApi';

export function useExplorerSearch() {
  const dispatch = useAppDispatch();
  const searchConfig = useAppSelector((state) => state.searchConfig);
  const selectedDatasetId = useAppSelector((state) => state.dataset.selectedDatasetId);

  const query = useSearchRecordsQuery(
    {
      datasetId: selectedDatasetId || 'ds-sales-01',
      search: searchConfig.debouncedSearch,
      searchType: searchConfig.searchType,
      searchField: searchConfig.searchField,
      filters: searchConfig.filters,
      filterLogicalOperator: searchConfig.filterLogicalOperator,
      sort: searchConfig.sort,
      page: searchConfig.page,
      pageSize: searchConfig.pageSize,
    },
    { skip: !selectedDatasetId }
  );

  return {
    ...query,
    searchConfig,
    selectedDatasetId,
    setPage: (p: number) => dispatch(setPage(p)),
    setPageSize: (ps: number) => dispatch(setPageSize(ps)),
    setSearch: (s: string) => dispatch(setSearch(s)),
    setSort: (s: any) => dispatch(setSort(s)),
    addFilter: (f: any) => dispatch(addFilter(f)),
    removeFilter: (id: string) => dispatch(removeFilter(id)),
    clearFilters: () => dispatch(clearFilters()),
  };
}
