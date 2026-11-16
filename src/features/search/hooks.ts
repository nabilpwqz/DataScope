import { useAppSelector, useAppDispatch } from '@/store';
import { setSearch, setSearchType, setSearchField } from '@/store/slices/searchConfigSlice';

export function useSearchControls() {
  const dispatch = useAppDispatch();
  const { search, debouncedSearch, searchType, searchField } = useAppSelector(
    (state) => state.searchConfig
  );

  return {
    search,
    debouncedSearch,
    searchType,
    searchField,
    setSearch: (s: string) => dispatch(setSearch(s)),
    setSearchType: (t: any) => dispatch(setSearchType(t)),
    setSearchField: (f: any) => dispatch(setSearchField(f)),
  };
}
